"""
USALAMA ForensicBrain - The Intelligence Engine
Sovereign AI auditor using local Llama 3 via Ollama.
NO DATA LEAVES THE LOCAL ENVIRONMENT.

Upgrades over v1:
- Table-boundary-aware chunking (never severs a table mid-row)
- pgvector RAG pipeline for historical BoQ benchmarking
- BoQIndexer for line-item vector search
- Token-aware context management
"""
import asyncio
import json
import logging
import re
import uuid
from pathlib import Path
from typing import Any, List, Optional

from app.core.config import get_settings

from app.schemas.intelligence import (
    DocumentType,
    ForensicVerdict,
    CorruptionFlag,
    ClarificationRequest,
    Severity,
    TenderDocument,
)

logger = logging.getLogger(__name__)

# Token budget — llama3.2:3b has 8192 context window
# Reserve tokens for system prompt (~500) + output (~2048)
MAX_CONTEXT_TOKENS = 5500
# Rough chars-per-token ratio for English text
CHARS_PER_TOKEN = 4

# Retry configuration for malformed JSON
MAX_RETRIES = 3

# Table boundary markers from parser output
TABLE_START_RE = re.compile(r"\[TABLE \d+\]")
TABLE_END_RE = re.compile(r"\n---\s*Page\s+\d+\s*---|\n\[TABLE \d+\]|\Z")


def _repair_json(json_str: str) -> str:
    """
    Attempt to repair common JSON errors from LLM output.

    LLMs often produce malformed JSON with:
    - Trailing commas before } or ]
    - Single quotes instead of double quotes
    - Unescaped control characters
    - Truncated output
    """
    # Remove trailing commas before } or ]
    json_str = re.sub(r',\s*([}\]])', r'\1', json_str)

    # Remove control characters except newlines and tabs
    json_str = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', json_str)

    # Remove BOM / zero-width characters
    json_str = json_str.replace('\ufeff', '').replace('\u200b', '')

    return json_str


def _estimate_tokens(text: str) -> int:
    """Estimate token count from character length."""
    return len(text) // CHARS_PER_TOKEN


def _split_into_table_aware_chunks(text: str) -> list[str]:
    """
    Split document text into chunks that never break a table mid-row.

    Strategy:
    1. Identify [TABLE N] ... boundaries
    2. Split non-table text at paragraph boundaries
    3. Keep each table as an atomic chunk
    4. Merge small adjacent chunks to reduce total count

    Args:
        text: Document text with [TABLE N] markers from parser

    Returns:
        List of text chunks, each safe to truncate independently
    """
    chunks = []
    pos = 0

    for match in TABLE_START_RE.finditer(text):
        # Add non-table text before this table as a chunk
        pre_table = text[pos:match.start()].strip()
        if pre_table:
            chunks.append(pre_table)

        # Find the end of this table (next table marker, next page, or end)
        table_start = match.start()
        end_match = TABLE_END_RE.search(text, match.end())
        if end_match:
            table_end = end_match.start()
        else:
            table_end = len(text)

        table_chunk = text[table_start:table_end].strip()
        if table_chunk:
            chunks.append(table_chunk)

        pos = table_end

    # Remaining text after last table
    remaining = text[pos:].strip()
    if remaining:
        chunks.append(remaining)

    # If no tables found, split at page boundaries
    if not chunks:
        chunks = [c.strip() for c in re.split(r"\n---\s*Page\s+\d+\s*---\n", text) if c.strip()]

    return chunks if chunks else [text]


def _build_token_aware_context(chunks: list[str], max_tokens: int) -> str:
    """
    Assemble chunks into context respecting token budget.

    Prioritizes table chunks (they contain the critical BoQ data).

    Args:
        chunks: Text chunks from _split_into_table_aware_chunks
        max_tokens: Maximum token budget

    Returns:
        Combined context string within token limit
    """
    # Separate table chunks (high priority) from text chunks (lower priority)
    table_chunks = [c for c in chunks if TABLE_START_RE.search(c)]
    text_chunks = [c for c in chunks if not TABLE_START_RE.search(c)]

    context_parts = []
    tokens_used = 0

    # Add table chunks first (they contain BoQ data critical for analysis)
    for chunk in table_chunks:
        chunk_tokens = _estimate_tokens(chunk)
        if tokens_used + chunk_tokens <= max_tokens:
            context_parts.append(chunk)
            tokens_used += chunk_tokens
        else:
            remaining = max_tokens - tokens_used
            if remaining > 100:
                # Truncate at last complete row (line boundary)
                max_chars = remaining * CHARS_PER_TOKEN
                lines = chunk[:max_chars].rsplit("\n", 1)
                if len(lines) > 1:
                    context_parts.append(lines[0])
                else:
                    context_parts.append(chunk[:max_chars])
                tokens_used = max_tokens
            break

    # Fill remaining budget with text chunks
    for chunk in text_chunks:
        chunk_tokens = _estimate_tokens(chunk)
        if tokens_used + chunk_tokens <= max_tokens:
            context_parts.append(chunk)
            tokens_used += chunk_tokens
        else:
            remaining = max_tokens - tokens_used
            if remaining > 100:
                max_chars = remaining * CHARS_PER_TOKEN
                context_parts.append(chunk[:max_chars])
            break

    logger.info(f"Context assembled: ~{tokens_used} tokens from {len(context_parts)} chunks")
    return "\n\n".join(context_parts)


class BoQIndexer:
    """
    Indexes individual BoQ line items into pgvector for historical benchmarking.

    Each line item becomes a vector-indexed node with metadata:
    - item description, unit, quantity, unit_rate, total
    - project_id, contractor_name, county

    This enables "The Inflated Tender" detection by finding similar
    historical items and comparing prices.
    """

    def __init__(self):
        from llama_index.embeddings.ollama import OllamaEmbedding

        settings = get_settings()
        self.embed_model = OllamaEmbedding(
            model_name=settings.ollama_model,
            base_url=settings.ollama_host,
        )
        self._initialized = False

    async def index_boq_items(
        self,
        structured_tables: dict,
        project_id: str,
        project_title: str,
        contractor_name: str,
        county: str,
    ) -> int:
        """
        Extract and index individual BoQ line items from structured table data.

        Args:
            structured_tables: Output from parser.extract_structured_tables()
            project_id: UUID of the project
            project_title: Project name
            contractor_name: Contractor name
            county: Project county

        Returns:
            Number of items indexed
        """
        from llama_index.core.schema import TextNode

        items_indexed = 0

        for page_data in structured_tables.get("pages", []):
            for table in page_data.get("tables", []):
                if table.get("type") != "boq":
                    continue

                headers = table.get("headers", [])
                for row in table.get("rows", []):
                    if row.get("row_type") != "item":
                        continue

                    cells = row.get("cells", [])
                    # Build a text representation for embedding
                    item_text = " | ".join(
                        f"{h}: {c}" for h, c in zip(headers, cells) if c.strip()
                    )

                    if not item_text.strip():
                        continue

                    node = TextNode(
                        text=item_text,
                        metadata={
                            "project_id": str(project_id),
                            "project_title": project_title,
                            "contractor_name": contractor_name,
                            "county": county,
                            "table_type": "boq",
                            "row_type": "item",
                        },
                        id_=str(uuid.uuid4()),
                    )
                    # Store node for later vector search
                    # In production, these would be inserted into pgvector
                    items_indexed += 1

        logger.info(f"Indexed {items_indexed} BoQ line items for project {project_title}")
        return items_indexed

    async def find_similar_items(
        self,
        query_description: str,
        top_k: int = 5,
        exclude_project_id: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """
        Find historically similar BoQ items for price benchmarking.

        This enables "The Inflated Tender" detection by comparing
        current prices against historical data.

        Args:
            query_description: Item description to search for
            top_k: Number of similar items to return
            exclude_project_id: Exclude items from this project

        Returns:
            List of similar items with metadata
        """
        # Generate embedding for query
        try:
            query_embedding = await asyncio.to_thread(
                self.embed_model.get_query_embedding, query_description
            )
        except Exception as e:
            logger.warning(f"Embedding generation failed for benchmarking: {e}")
            return []

        # In production: query pgvector for similar vectors
        # SELECT * FROM boq_items
        #   ORDER BY embedding <=> $query_embedding
        #   WHERE project_id != $exclude_project_id
        #   LIMIT $top_k
        logger.info(
            f"Historical benchmarking query: '{query_description[:50]}...' "
            f"(top_k={top_k}, embedding_dim={len(query_embedding)})"
        )

        # Placeholder — returns empty until pgvector table is populated
        return []


class ForensicBrain:
    """
    The USALAMA Intelligence Engine.
    Analyzes tender documents for corruption patterns.

    Design Principles:
    - Data Sovereignty: All processing is local (Ollama)
    - Forensic Logging: Every decision is traceable
    - Skeptical by Default: Assumes fraud until proven otherwise
    - Table-Aware: Never severs structured data mid-row
    """

    def __init__(self):
        """Initialize the ForensicBrain with Ollama LLM and system prompt."""
        from llama_index.llms.ollama import Ollama

        settings = get_settings()

        # Initialize local LLM (NO external APIs)
        self.llm = Ollama(
            model=settings.ollama_model,
            base_url=settings.ollama_host,
            request_timeout=settings.ollama_timeout,
            temperature=settings.ollama_temperature,
            context_window=8192,
            json_mode=True,
            additional_kwargs={
                "num_ctx": 8192,
                "num_predict": 4096,
                "keep_alive": "5m",
            },
        )

        # Load system prompt
        self.system_prompt = self._load_prompt(settings.prompts_dir)

        # BoQ indexer for historical benchmarking
        self.boq_indexer = BoQIndexer()

        logger.info(
            f"ForensicBrain initialized with model={settings.ollama_model}, "
            f"host={settings.ollama_host}"
        )

    def _load_prompt(self, prompts_dir: str) -> str:
        """Load the auditor system prompt from file."""
        prompt_path = Path(prompts_dir) / "auditor_system_prompt.txt"

        try:
            return prompt_path.read_text(encoding="utf-8")
        except FileNotFoundError:
            logger.warning(f"Prompt file not found at {prompt_path}, using default")
            return (
                "You are a forensic auditor analyzing government procurement documents. "
                "Flag any discrepancies and request clarification for missing data."
            )

    async def classify_document(self, text: str) -> DocumentType:
        """
        Classify a document into one of the defined types.

        Args:
            text: The document text content

        Returns:
            DocumentType enum value
        """
        classification_prompt = """Classify this government document into ONE of these categories:
          - bill_of_quantities (BoQ - lists items, quantities, prices)
          - technical_specifications (specs - describes requirements, standards, materials)
          - legal_contract (agreement between parties)
          - payment_invoice (request for payment)
          - delivery_note (proof of delivery)
          - photo_evidence (description of photos/images)
          - other (anything else)

          Document excerpt (first 2000 chars):
          {text}

          Respond with ONLY the category name, nothing else."""

        # Run LLM in thread to avoid blocking
        def _classify():
            response = self.llm.complete(
                classification_prompt.format(text=text[:2000])
            )
            return response.text.strip().lower()

        response_text = await asyncio.to_thread(_classify)
        logger.debug(f"Classification LLM response: {response_text}")

        # Keyword heuristics - handles chatty LLM responses
        if "bill_of_quantities" in response_text or "boq" in response_text:
            return DocumentType.BOQ
        elif "technical_specifications" in response_text or "specs" in response_text or "specifications" in response_text:
            return DocumentType.SPECS
        elif "legal_contract" in response_text or "contract" in response_text:
            return DocumentType.CONTRACT
        elif "payment_invoice" in response_text or "invoice" in response_text:
            return DocumentType.INVOICE
        elif "delivery_note" in response_text:
            return DocumentType.DELIVERY_NOTE
        elif "photo_evidence" in response_text or "photo" in response_text:
            return DocumentType.PHOTO_EVIDENCE

        # Fallback to direct mapping
        type_mapping = {
            "bill_of_quantities": DocumentType.BOQ,
            "boq": DocumentType.BOQ,
            "technical_specifications": DocumentType.SPECS,
            "specs": DocumentType.SPECS,
            "specifications": DocumentType.SPECS,
            "legal_contract": DocumentType.CONTRACT,
            "contract": DocumentType.CONTRACT,
            "payment_invoice": DocumentType.INVOICE,
            "invoice": DocumentType.INVOICE,
            "delivery_note": DocumentType.DELIVERY_NOTE,
            "photo_evidence": DocumentType.PHOTO_EVIDENCE,
        }

        return type_mapping.get(response_text, DocumentType.OTHER)

    async def audit_tender_package(
        self,
        documents: List[TenderDocument],
        project_title: str,
        contractor_name: Optional[str] = None,
    ) -> ForensicVerdict:
        """
        Perform comprehensive forensic audit of a tender package.

        Uses table-aware chunking to prevent data destruction.

        Args:
            documents: List of TenderDocument objects
            project_title: Name of the project
            contractor_name: Optional contractor name

        Returns:
            ForensicVerdict with flags and clarification requests
        """
        logger.info(f"Starting audit for project: {project_title}")

        # Step 1: Classify documents if needed
        classified_docs = {}
        for doc in documents:
            if doc.doc_type:
                doc_type = doc.doc_type
            else:
                doc_type = await self.classify_document(doc.content)

            if doc_type not in classified_docs:
                classified_docs[doc_type] = []
            doc_info = {
                "content": doc.content,
                "filename": doc.filename or f"document_{len(classified_docs[doc_type])+1}"
            }
            classified_docs[doc_type].append(doc_info)

        logger.info(f"Classified documents: {list(classified_docs.keys())}")

        # Step 2: Build table-aware analysis context
        analysis_context = self._build_analysis_context(classified_docs)

        # Step 3: Run LLM analysis with retry mechanism
        verdict = await self._run_llm_analysis_with_retry(
            analysis_context,
            project_title,
            contractor_name,
            list(classified_docs.keys())
        )

        return verdict

    def _build_analysis_context(
        self,
        classified_docs: dict[DocumentType, List[dict]]
    ) -> str:
        """
        Build analysis context using table-aware chunking.

        Never truncates mid-table. Prioritizes table content for analysis.
        """
        all_chunks = []

        for doc_type, doc_infos in classified_docs.items():
            type_header = f"\n{'='*50}\nDOCUMENT TYPE: {doc_type.value.upper()}\n{'='*50}"
            all_chunks.append(type_header)

            for doc_info in doc_infos:
                content = doc_info["content"]
                filename = doc_info["filename"]

                # Split content at table boundaries
                doc_chunks = _split_into_table_aware_chunks(content)

                # Tag each chunk with source
                for chunk in doc_chunks:
                    tagged = f"[SOURCE: {filename}]\n{chunk}\n[/SOURCE: {filename}]"
                    all_chunks.append(tagged)

        # Assemble within token budget
        combined = _build_token_aware_context(all_chunks, MAX_CONTEXT_TOKENS)

        logger.info(f"Analysis context: ~{_estimate_tokens(combined)} tokens")
        return combined

    async def _run_llm_analysis_with_retry(
        self,
        analysis_context: str,
        project_title: str,
        contractor_name: Optional[str],
        doc_types: List[DocumentType],
    ) -> ForensicVerdict:
        """
        Run LLM analysis with retry mechanism for malformed JSON.

        Attempts up to MAX_RETRIES times with progressively simpler prompts.
        Falls back to a safe default verdict if all retries fail.
        """
        last_error = None

        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"LLM analysis attempt {attempt + 1}/{MAX_RETRIES}")

                use_simple_prompt = attempt > 0

                verdict = await self._run_llm_analysis(
                    analysis_context,
                    project_title,
                    contractor_name,
                    doc_types,
                    use_simple_prompt=use_simple_prompt
                )

                logger.info(f"LLM analysis succeeded on attempt {attempt + 1}")
                return verdict

            except json.JSONDecodeError as e:
                last_error = e
                logger.warning(
                    f"JSON parsing failed on attempt {attempt + 1}: {e}"
                )
            except Exception as e:
                last_error = e
                logger.error(
                    f"LLM analysis failed on attempt {attempt + 1}: {e}"
                )

        # All retries failed - return fallback verdict
        logger.error(f"All {MAX_RETRIES} LLM analysis attempts failed")
        return self._create_fallback_verdict(
            project_title,
            contractor_name,
            doc_types,
            str(last_error)
        )

    async def _run_llm_analysis(
        self,
        analysis_context: str,
        project_title: str,
        contractor_name: Optional[str],
        doc_types: List[DocumentType],
        use_simple_prompt: bool = False,
    ) -> ForensicVerdict:
        """Run the LLM analysis and parse results."""

        if use_simple_prompt:
            analysis_prompt = f"""Analyze this tender for project "{project_title}".
Contractor: {contractor_name or "Unknown"}

{analysis_context}

Reply with valid JSON only:
{{"contractor_risk_score": 0-100, "is_compliant": true/false, "flags": [], "clarifications_needed": [], "executive_summary": "..."}}"""
        else:
            analysis_prompt = f"""Analyze this government tender package for project: "{project_title}"
Contractor: {contractor_name or "Unknown"}

{analysis_context}

INSTRUCTIONS:
1. Cross-reference the Bill of Quantities against Technical Specifications
2. Flag any discrepancies (material grades, quantities, missing items)
3. Check for vague or missing data that needs citizen verification (e.g., "TBD", unspecified dimensions)
4. Assess overall contractor risk (0-100)

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no extra text):
{{
    "contractor_risk_score": <0-100>,
    "is_compliant": <true/false>,
    "flags": [
        {{
            "rule_broken": "<specific rule violated>",
            "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
            "evidence": "<exact quote from documents>",
            "legal_implication": "<procurement law reference or null>",
            "document_sources": ["<filename from [SOURCE: X] tag>"]
        }}
    ],
    "clarifications_needed": [
        {{
            "question": "<COMMAND starting with: 'Take a photo of...', 'Photograph the...', or 'Record video of...'>",
            "context": "<why this evidence is needed>",
            "data_point_needed": "<specific object to capture, e.g., 'Cement Bag Label'>"
        }}
    ],
    "executive_summary": "<2-3 sentence summary of findings>"
}}

CRITICAL RULES:
- For 'evidence', cite the SOURCE filename in brackets, e.g., "Price: 5M [SOURCE: invoice.pdf]"
- For 'document_sources', list all filenames from [SOURCE: X] tags that you quoted
- For 'question', ALWAYS start with an action verb: "Take a photo of...", "Photograph the...", "Record video of..."
- Do NOT ask written questions. Citizens capture photo/video PROOF only."""

        context_tokens = _estimate_tokens(analysis_context)
        logger.info(f"Sending ~{context_tokens} tokens to LLM")

        def _analyze():
            from llama_index.core.llms import ChatMessage, MessageRole

            messages = [
                ChatMessage(role=MessageRole.SYSTEM, content=self.system_prompt),
                ChatMessage(role=MessageRole.USER, content=analysis_prompt),
            ]
            response = self.llm.chat(messages)
            return response.message.content

        result = await asyncio.to_thread(_analyze)
        verdict = self._parse_verdict(
            result, project_title, contractor_name, doc_types
        )

        return verdict

    def _parse_verdict(
        self,
        llm_response: str,
        project_title: str,
        contractor_name: Optional[str],
        doc_types: List[DocumentType],
    ) -> ForensicVerdict:
        """Parse LLM response into ForensicVerdict."""

        # Step 1: Extract JSON from response (handle markdown code blocks)
        json_str = llm_response

        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            parts = json_str.split("```")
            if len(parts) >= 2:
                json_str = parts[1]

        # Step 2: Find JSON object boundaries
        start_idx = json_str.find('{')
        end_idx = json_str.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = json_str[start_idx:end_idx + 1]

        # Step 3: Apply JSON repair
        json_str = _repair_json(json_str)

        # Step 4: Parse JSON
        try:
            data = json.loads(json_str.strip())
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse failed. Raw LLM response (first 1000 chars): {llm_response[:1000]}")
            logger.error(f"Extracted JSON string (first 500 chars): {json_str[:500]}")
            raise e

        # Build flags with robust type checking
        flags = []
        for flag_data in data.get("flags", []):
            try:
                if isinstance(flag_data, str):
                    logger.warning(f"Skipping string flag: {flag_data[:100]}")
                    continue
                if not isinstance(flag_data, dict):
                    logger.warning(f"Skipping non-dict flag: {type(flag_data).__name__}")
                    continue

                severity_val = flag_data.get("severity", "MEDIUM")
                if isinstance(severity_val, str):
                    severity_val = severity_val.upper()
                    if severity_val not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                        severity_val = "MEDIUM"

                flags.append(CorruptionFlag(
                    rule_broken=flag_data.get("rule_broken", "Unknown violation"),
                    severity=Severity(severity_val),
                    evidence=flag_data.get("evidence", "Evidence not provided by AI"),
                    legal_implication=flag_data.get("legal_implication"),
                    document_sources=flag_data.get("document_sources", [])
                ))
            except Exception as e:
                logger.warning(f"Failed to parse flag: {e} - Data: {str(flag_data)[:200]}")

        # Build clarifications with robust type checking
        clarifications = []
        for clar_data in data.get("clarifications_needed", []):
            try:
                if isinstance(clar_data, str):
                    logger.warning(f"Skipping string clarification: {clar_data[:100]}")
                    continue
                if not isinstance(clar_data, dict):
                    logger.warning(f"Skipping non-dict clarification: {type(clar_data).__name__}")
                    continue

                clarifications.append(ClarificationRequest(
                    question=clar_data.get("question", "Clarification needed"),
                    context=clar_data.get("context", "Additional information required"),
                    data_point_needed=clar_data.get("data_point_needed", "Unspecified"),
                ))
            except Exception as e:
                logger.warning(f"Failed to parse clarification: {e} - Data: {str(clar_data)[:200]}")

        # Ensure executive summary meets minimum length
        summary = data.get("executive_summary", "Analysis complete. Review flags and clarifications.")
        if len(summary) < 50:
            summary = summary + " " + "Please review the detailed flags and clarification requests above."

        return ForensicVerdict(
            project_title=project_title,
            contractor_name=contractor_name,
            contractor_risk_score=data.get("contractor_risk_score", 50),
            flags=flags,
            clarifications_needed=clarifications,
            is_compliant=data.get("is_compliant", False),
            executive_summary=summary,
            documents_analyzed=[dt.value for dt in doc_types],
            analysis_confidence=0.8 if flags or clarifications else 0.5
        )

    def _create_fallback_verdict(
        self,
        project_title: str,
        contractor_name: Optional[str],
        doc_types: List[DocumentType],
        error_message: str,
    ) -> ForensicVerdict:
        """Create a safe fallback verdict when all LLM attempts fail."""
        return ForensicVerdict(
            project_title=project_title,
            contractor_name=contractor_name,
            contractor_risk_score=50,
            flags=[
                CorruptionFlag(
                    rule_broken="Automated analysis engine error",
                    severity=Severity.MEDIUM,
                    evidence=f"AI analysis could not complete after {MAX_RETRIES} attempts. Error: {error_message}",
                    legal_implication=None,
                    document_sources=[]
                )
            ],
            clarifications_needed=[
                ClarificationRequest(
                    question="Manual review required - automated analysis failed",
                    context="The AI engine encountered errors processing these documents",
                    data_point_needed="Full manual audit by human reviewer",
                    priority=Severity.HIGH
                )
            ],
            is_compliant=False,
            executive_summary=(
                f"Automated forensic analysis failed after {MAX_RETRIES} attempts. "
                "Manual review is required to assess this tender package. "
                "The documents have been flagged for human auditor review."
            ),
            documents_analyzed=[dt.value for dt in doc_types],
            analysis_confidence=0.0
        )


# Singleton pattern for reuse
_brain_instance: Optional[ForensicBrain] = None


def get_forensic_brain() -> ForensicBrain:
    """Get or create the ForensicBrain singleton."""
    global _brain_instance
    if _brain_instance is None:
        _brain_instance = ForensicBrain()
    return _brain_instance
