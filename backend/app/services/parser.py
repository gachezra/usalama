"""
USALAMA Document Parser
Extracts text and tables from PDF documents for forensic analysis.
Tables are converted to Markdown format for LLM consumption.
"""
import hashlib
import io
import logging
from typing import Tuple

import pdfplumber

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text and tables from a PDF document.

    Tables are converted to Markdown format for better LLM understanding.

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

                # Extract tables first
                tables = page.extract_tables()
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

    # Clean cell values
    cleaned_rows = []
    for row in table:
        cleaned_row = []
        for cell in row:
            if cell is None:
                cleaned_row.append("")
            else:
                # Clean whitespace and newlines
                cleaned = str(cell).replace("\n", " ").strip()
                cleaned_row.append(cleaned)
        cleaned_rows.append(cleaned_row)

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
