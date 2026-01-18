"""
USALAMA ForensicBrain - The Intelligence Engine
Sovereign AI auditor using local Llama 3.1 via Ollama.
NO DATA LEAVES THE LOCAL ENVIRONMENT.
"""
import asyncio
import json
import logging
import re
from pathlib import Path
from typing import List, Optional

from llama_index.llms.ollama import Ollama
from llama_index.core.llms import ChatMessage, MessageRole

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

# Document size limit - Llama 3.1 has 128k context, we use 50k chars per doc
MAX_DOCUMENT_CHARS = 50_000

# Retry configuration for malformed JSON
MAX_RETRIES = 3


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

    # Fix common escape issues - unescaped newlines in strings
    # This is a simplified approach
    lines = json_str.split('\n')
    repaired_lines = []
    for line in lines:
        # Remove any BOM or zero-width characters
        line = line.replace('\ufeff', '').replace('\u200b', '')
        repaired_lines.append(line)
    json_str = '\n'.join(repaired_lines)

    return json_str


class ForensicBrain:
    """
    The USALAMA Intelligence Engine.
    Analyzes tender documents for corruption patterns.

    Design Principles:
    - Data Sovereignty: All processing is local (Ollama)
    - Forensic Logging: Every decision is traceable
    - Skeptical by Default: Assumes fraud until proven otherwise
    """

    def __init__(self):
        """Initialize the ForensicBrain with Ollama LLM and system prompt."""
        settings = get_settings()

        # Initialize local LLM (NO external APIs)
        # Increased context window to allow LLM to generate complete JSON output
        self.llm = Ollama(
            model=settings.ollama_model,
            base_url=settings.ollama_host,
            request_timeout=settings.ollama_timeout,
            temperature=settings.ollama_temperature,
            context_window=8192,  # Increased from 4096 to prevent truncation
            json_mode=True,  # Force valid JSON output
            additional_kwargs={
                "num_ctx": 8192,  # Match context_window for Ollama
                "num_predict": 4096,  # Allow longer output (doubled from 2048)
            },
        )

        # Load system prompt
        self.system_prompt = self._load_prompt(settings.prompts_dir)

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

        This is a fast, single-prompt classification for routing documents.

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

        result = await asyncio.to_thread(_classify)

        # Map response to enum
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

        return type_mapping.get(result, DocumentType.OTHER)

    async def audit_tender_package(
        self,
        documents: List[TenderDocument],
        project_title: str,
        contractor_name: Optional[str] = None,
    ) -> ForensicVerdict:
        """
        Perform comprehensive forensic audit of a tender package.

        This is the main analysis method that:
        1. Classifies documents (if not pre-classified)
        2. Cross-references BoQ against Specifications
        3. Detects price anomalies
        4. Identifies data gaps requiring clarification

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
            classified_docs[doc_type].append(doc.content)

        logger.info(f"Classified documents: {list(classified_docs.keys())}")

        # Step 2: Build analysis context
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
        classified_docs: dict[DocumentType, List[str]]
    ) -> str:
        """Build the analysis context from classified documents."""
        context_parts = []

        for doc_type, contents in classified_docs.items():
            context_parts.append(f"\n{'='*50}")
            context_parts.append(f"DOCUMENT TYPE: {doc_type.value.upper()}")
            context_parts.append(f"{'='*50}")
            for i, content in enumerate(contents, 1):
                # Use 50,000 char limit to leverage Llama 3.1's 128k context
                truncated = content[:MAX_DOCUMENT_CHARS] if len(content) > MAX_DOCUMENT_CHARS else content
                if len(content) > MAX_DOCUMENT_CHARS:
                    logger.warning(
                        f"Document {i} of type {doc_type.value} truncated from "
                        f"{len(content)} to {MAX_DOCUMENT_CHARS} chars"
                    )
                context_parts.append(f"\n--- Document {i} ---\n{truncated}")

        return "\n".join(context_parts)

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

                # Use simpler prompt on retries
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
            # Simplified prompt for retry attempts
            analysis_prompt = f"""Analyze this tender for project "{project_title}".
Contractor: {contractor_name or "Unknown"}

{analysis_context}

Reply with valid JSON only:
{{"contractor_risk_score": 0-100, "is_compliant": true/false, "flags": [], "clarifications_needed": [], "executive_summary": "..."}}"""
        else:
            # Full detailed prompt
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
            "legal_implication": "<procurement law reference or null>"
        }}
    ],
    "clarifications_needed": [
        {{
            "question": "<specific question for citizen verifier>",
            "context": "<why this information is needed>",
            "data_point_needed": "<e.g., Road Width, Cement Brand>"
        }}
    ],
    "executive_summary": "<2-3 sentence summary of findings>"
}}"""

        def _analyze():
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

        # Handle markdown code blocks
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            parts = json_str.split("```")
            if len(parts) >= 2:
                json_str = parts[1]

        # Step 2: Try to find JSON object boundaries
        # This handles cases where LLM adds text before/after JSON
        start_idx = json_str.find('{')
        end_idx = json_str.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = json_str[start_idx:end_idx + 1]

        # Step 3: Apply JSON repair
        json_str = _repair_json(json_str)

        # Step 4: Parse JSON - will raise JSONDecodeError if invalid
        try:
            data = json.loads(json_str.strip())
        except json.JSONDecodeError as e:
            # Log the raw response for debugging
            logger.error(f"JSON parse failed. Raw LLM response (first 1000 chars): {llm_response[:1000]}")
            logger.error(f"Extracted JSON string (first 500 chars): {json_str[:500]}")
            raise e

        # Build flags
        flags = []
        for flag_data in data.get("flags", []):
            try:
                # Handle severity as string or enum
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
                logger.warning(f"Failed to parse flag: {e}")

        # Build clarifications
        clarifications = []
        for clar_data in data.get("clarifications_needed", []):
            try:
                clarifications.append(ClarificationRequest(
                    question=clar_data.get("question", "Clarification needed"),
                    context=clar_data.get("context", "Additional information required"),
                    data_point_needed=clar_data.get("data_point_needed", "Unspecified"),
                ))
            except Exception as e:
                logger.warning(f"Failed to parse clarification: {e}")

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
            contractor_risk_score=50,  # Neutral score
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
            is_compliant=False,  # Conservative default
            executive_summary=(
                f"Automated forensic analysis failed after {MAX_RETRIES} attempts. "
                "Manual review is required to assess this tender package. "
                "The documents have been flagged for human auditor review."
            ),
            documents_analyzed=[dt.value for dt in doc_types],
            analysis_confidence=0.0  # No confidence in fallback
        )


# Singleton pattern for reuse
_brain_instance: Optional[ForensicBrain] = None


def get_forensic_brain() -> ForensicBrain:
    """Get or create the ForensicBrain singleton."""
    global _brain_instance
    if _brain_instance is None:
        _brain_instance = ForensicBrain()
    return _brain_instance
