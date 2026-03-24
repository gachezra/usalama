"""
USALAMA Document Parser
Extracts text and tables from PDF documents for forensic analysis.
Tables are output as structured JSON (for AI engine) and Markdown (for audit logs).
"""
import hashlib
import io
import logging
import re
from typing import Any, Tuple

import pdfplumber

logger = logging.getLogger(__name__)

# Keywords that identify subtotal/total rows in BoQ tables
TOTAL_KEYWORDS = re.compile(
    r"\b(sub[\s-]?total|grand[\s-]?total|total|vat|tax|contingency|provisional\s+sum|carried\s+forward|summary)\b",
    re.IGNORECASE,
)

# Table extraction settings tuned for nested BoQ sub-tables
BOQ_TABLE_SETTINGS = {
    "vertical_strategy": "lines_strict",
    "horizontal_strategy": "lines_strict",
    "intersection_tolerance": 5,
    "snap_tolerance": 5,
    "edge_min_length": 10,
}

# Fallback settings for less structured documents
FALLBACK_TABLE_SETTINGS = {
    "vertical_strategy": "text",
    "horizontal_strategy": "text",
    "snap_tolerance": 5,
}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text and tables from a PDF document.

    Tables are converted to Markdown format for LLM consumption.

    Args:
        file_bytes: Raw PDF file bytes

    Returns:
        Extracted text with tables in Markdown format

    Raises:
        ValueError: If the PDF cannot be parsed
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        extracted_parts = []

        with pdfplumber.open(pdf_file) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_text_parts = []
                page_text_parts.append(f"\n--- Page {page_num} ---\n")

                # Extract tables with tuned settings (try strict lines first, fall back to text)
                tables = page.extract_tables(table_settings=BOQ_TABLE_SETTINGS)
                if not tables:
                    tables = page.extract_tables(table_settings=FALLBACK_TABLE_SETTINGS)

                if tables:
                    for table_idx, table in enumerate(tables, 1):
                        if table and len(table) > 0:
                            md_table = _table_to_markdown(table)
                            if md_table:
                                page_text_parts.append(f"\n[TABLE {table_idx}]\n{md_table}\n")

                # Extract regular text
                text = page.extract_text()
                if text:
                    page_text_parts.append(text)

                extracted_parts.append("\n".join(page_text_parts))

        full_text = "\n".join(extracted_parts)

        if not full_text.strip():
            logger.warning("PDF extraction returned empty text")
            raise ValueError("PDF appears to be empty or contains only images")

        logger.info(f"Extracted {len(full_text)} characters from PDF ({len(pdf.pages)} pages)")
        return full_text

    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def extract_structured_tables(file_bytes: bytes) -> dict[str, Any]:
    """
    Extract tables from a PDF as structured JSON for the AI engine.

    Returns hierarchical table data with row-type classification,
    table type detection, and merged-cell context preservation.

    Args:
        file_bytes: Raw PDF file bytes

    Returns:
        Dict with 'pages' containing structured table data and raw text.
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        result = {"pages": [], "table_count": 0, "total_rows": 0}

        with pdfplumber.open(pdf_file) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_data = {"page": page_num, "tables": [], "text": ""}

                # Extract tables with tuned settings
                tables = page.extract_tables(table_settings=BOQ_TABLE_SETTINGS)
                if not tables:
                    tables = page.extract_tables(table_settings=FALLBACK_TABLE_SETTINGS)

                if tables:
                    for table_idx, raw_table in enumerate(tables, 1):
                        if raw_table and len(raw_table) > 0:
                            structured = _table_to_structured_json(raw_table, table_idx)
                            if structured:
                                page_data["tables"].append(structured)
                                result["table_count"] += 1
                                result["total_rows"] += len(structured.get("rows", []))

                # Extract raw text
                text = page.extract_text()
                if text:
                    page_data["text"] = text

                result["pages"].append(page_data)

        logger.info(
            f"Structured extraction: {result['table_count']} tables, "
            f"{result['total_rows']} rows from {len(result['pages'])} pages"
        )
        return result

    except Exception as e:
        logger.error(f"Structured PDF extraction failed: {e}")
        raise ValueError(f"Failed to parse PDF for structured extraction: {str(e)}")


def _table_to_structured_json(table: list, table_idx: int) -> dict[str, Any] | None:
    """
    Convert a pdfplumber table to structured JSON with row-type classification.

    Detects:
    - header vs item vs subtotal vs total rows
    - Table type (boq, spec, schedule) based on header content
    - Merged-cell context (carries forward last non-empty value)

    Args:
        table: List of rows from pdfplumber
        table_idx: Table index on the page

    Returns:
        Structured dict or None if table is empty
    """
    if not table or len(table) < 2:
        return None

    # Clean and extract headers
    headers = _clean_row(table[0])
    if not any(h for h in headers):
        return None

    # Classify table type from headers
    table_type = _classify_table(headers)

    # Process data rows with merged-cell context and row-type detection
    rows = []
    # Track last non-empty values per column for merged-cell carry-forward
    last_values = [""] * len(headers)

    for raw_row in table[1:]:
        cells = _clean_row(raw_row, preserve_newlines=True)

        # Pad or trim to match header length
        while len(cells) < len(headers):
            cells.append("")
        cells = cells[:len(headers)]

        # Carry forward merged-cell context
        filled_cells = []
        for col_idx, cell in enumerate(cells):
            if cell.strip():
                last_values[col_idx] = cell
                filled_cells.append(cell)
            else:
                # Empty cell — carry forward context from previous row
                filled_cells.append(last_values[col_idx] if last_values[col_idx] else "")

        # Determine row type
        row_type = _classify_row(cells, headers)

        rows.append({
            "cells": filled_cells,
            "raw_cells": cells,
            "row_type": row_type,
        })

    return {
        "table_index": table_idx,
        "type": table_type,
        "headers": headers,
        "rows": rows,
        "row_count": len(rows),
    }


def _classify_table(headers: list[str]) -> str:
    """
    Classify a table as boq, spec, or schedule based on header content.

    Args:
        headers: Cleaned header strings

    Returns:
        One of 'boq', 'spec', 'schedule', 'unknown'
    """
    header_text = " ".join(headers).lower()

    # BoQ indicators: quantity, rate, amount, unit price
    boq_keywords = ["quantity", "qty", "rate", "amount", "unit price", "unit rate", "total", "item no"]
    if sum(1 for kw in boq_keywords if kw in header_text) >= 2:
        return "boq"

    # Specification indicators
    spec_keywords = ["specification", "standard", "requirement", "material", "grade", "class"]
    if sum(1 for kw in spec_keywords if kw in header_text) >= 2:
        return "spec"

    # Payment schedule indicators
    schedule_keywords = ["date", "payment", "milestone", "phase", "period", "invoice"]
    if sum(1 for kw in schedule_keywords if kw in header_text) >= 2:
        return "schedule"

    return "unknown"


def _classify_row(cells: list[str], headers: list[str]) -> str:
    """
    Classify a row as item, subtotal, total, or header based on content.

    Args:
        cells: Row cell values
        headers: Header values for context

    Returns:
        One of 'item', 'subtotal', 'total', 'section_header'
    """
    combined_text = " ".join(cells)

    # Check for total/subtotal keywords
    if TOTAL_KEYWORDS.search(combined_text):
        # Distinguish subtotal from grand total
        lower = combined_text.lower()
        if "grand" in lower or (lower.count("total") > 0 and "sub" not in lower):
            return "total"
        return "subtotal"

    # Section headers: only first 1-2 cells have content, rest are empty
    non_empty = sum(1 for c in cells if c.strip())
    if non_empty <= 2 and len(cells) > 3:
        # Likely a section header row
        first_cell = cells[0].strip()
        if first_cell and not _looks_like_number(first_cell):
            return "section_header"

    return "item"


def _looks_like_number(text: str) -> bool:
    """Check if text looks like a number or item reference."""
    cleaned = text.replace(",", "").replace(".", "").replace(" ", "").strip()
    return cleaned.isdigit()


def _clean_row(row: list, preserve_newlines: bool = False) -> list[str]:
    """
    Clean a table row's cell values.

    Args:
        row: Raw row from pdfplumber
        preserve_newlines: If True, keep newlines (for structured JSON).
                          If False, collapse to spaces (for Markdown).

    Returns:
        List of cleaned strings
    """
    cleaned = []
    for cell in row:
        if cell is None:
            cleaned.append("")
        else:
            text = str(cell).strip()
            if not preserve_newlines:
                text = text.replace("\n", " ")
            cleaned.append(text)
    return cleaned


def _table_to_markdown(table: list) -> str:
    """
    Convert a pdfplumber table to Markdown format.

    Args:
        table: List of rows, where each row is a list of cell values

    Returns:
        Markdown-formatted table string
    """
    if not table or len(table) == 0:
        return ""

    cleaned_rows = []
    for row in table:
        cleaned_rows.append(_clean_row(row, preserve_newlines=False))

    if len(cleaned_rows) == 0:
        return ""

    # Build markdown table
    lines = []

    # Header row
    header = cleaned_rows[0]
    lines.append("| " + " | ".join(header) + " |")

    # Separator
    lines.append("| " + " | ".join(["---"] * len(header)) + " |")

    # Data rows
    for row in cleaned_rows[1:]:
        # Ensure row has same number of columns as header
        while len(row) < len(header):
            row.append("")
        lines.append("| " + " | ".join(row[:len(header)]) + " |")

    return "\n".join(lines)


def compute_file_hash(file_bytes: bytes) -> str:
    """
    Compute SHA-256 hash of file bytes.

    This hash is used for:
    1. Blockchain verification (immutability proof)
    2. Duplicate detection
    3. Evidence integrity verification

    Args:
        file_bytes: Raw file bytes

    Returns:
        Hexadecimal SHA-256 hash string (64 characters)
    """
    return hashlib.sha256(file_bytes).hexdigest()


def extract_and_hash(file_bytes: bytes) -> Tuple[str, str]:
    """
    Extract text from PDF and compute its hash in one operation.

    Args:
        file_bytes: Raw PDF bytes

    Returns:
        Tuple of (extracted_text, sha256_hash)
    """
    file_hash = compute_file_hash(file_bytes)
    text = extract_text_from_pdf(file_bytes)
    return text, file_hash


def extract_structured_and_hash(file_bytes: bytes) -> Tuple[dict[str, Any], str, str]:
    """
    Extract structured tables, markdown text, and hash in one operation.

    Args:
        file_bytes: Raw PDF bytes

    Returns:
        Tuple of (structured_data, markdown_text, sha256_hash)
    """
    file_hash = compute_file_hash(file_bytes)
    text = extract_text_from_pdf(file_bytes)
    structured = extract_structured_tables(file_bytes)
    return structured, text, file_hash
