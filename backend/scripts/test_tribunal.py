#!/usr/bin/env python3
"""
USALAMA Tribunal Test Script
Tests the ForensicBrain with mock corrupt tender documents.

Usage:
    cd backend
    source venv/bin/activate
    python -m scripts.test_tribunal

Expected Output:
- CorruptionFlag for material grade mismatch (Grade B vs Grade A)
- ClarificationRequest for missing/vague data (TBD items, road width)
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.services.brain import ForensicBrain
from app.schemas.intelligence import TenderDocument, DocumentType


# Mock Documents - Designed to trigger corruption detection
# These documents have deliberate discrepancies that the AI should catch

MOCK_BOQ = """
BILL OF QUANTITIES
Project: Narok-Kilgoris Road Upgrade
Contractor: FastBuild Construction Ltd
Date: 15th January 2026

Item | Description | Quantity | Unit Price (KES) | Total (KES)
-----|-------------|----------|------------------|------------
1    | Gravel (Grade B) | 500 tons | 2,000 | 1,000,000
2    | Cement (Generic Brand) | 100 bags | 800 | 80,000
3    | Labor (Casual workers) | 50 days | 5,000 | 250,000
4    | Equipment Hire (Grader) | 30 days | 10,000 | 300,000
5    | Road Marking Paint | TBD | TBD | TBD
6    | Drainage Pipes | To be confirmed | - | -

SUBTOTAL: KES 1,630,000 (Provisional)
VAT (16%): KES 260,800
GRAND TOTAL: KES 1,890,800

Notes:
- Road width to be confirmed during site visit
- Final quantities subject to site survey
- Cement supplier to be determined
"""

MOCK_SPECS = """
TECHNICAL SPECIFICATIONS
Project: Narok-Kilgoris Road Upgrade
Ministry of Roads and Infrastructure
Reference: MoRI/2026/NK-001

1. SCOPE OF WORK
   Construction of 2km access road connecting Narok town to Kilgoris junction.

2. MATERIALS SPECIFICATIONS
   2.1 Road Base Material:
       - SHALL be Grade A Crusite aggregate conforming to KS-02-70
       - Minimum CBR value: 80%
       - NOT acceptable: Grade B gravel, murram, or substandard materials

   2.2 Cement:
       - SHALL be Portland Cement Type I from KEBS-approved manufacturers
       - Brands accepted: Bamburi, Mombasa Cement, or equivalent
       - NOT acceptable: Generic or unlabeled cement

   2.3 Steel Reinforcement:
       - High yield deformed bars Y12 and Y16
       - Must have valid mill certificates

3. CONSTRUCTION STANDARDS
   3.1 Road Geometry:
       - Carriageway width: MINIMUM 6.0 meters (two-lane standard)
       - Shoulder width: 1.5 meters each side
       - Camber: 3% crown

   3.2 Surface Requirements:
       - Final surface SHALL be hot-mix asphalt/tarmac finish
       - Thickness: 50mm wearing course over 75mm base course

   3.3 Drainage:
       - Concrete culverts (600mm diameter) every 500 meters
       - Side drains: V-shaped, 600mm depth

4. QUALITY ASSURANCE
   4.1 Contractor must provide material test certificates for each batch
   4.2 Weekly progress reports with timestamped photographic evidence
   4.3 Final inspection and certification by Ministry engineer required

5. TIMELINE AND PENALTIES
   5.1 Completion: Within 90 calendar days of contract signing
   5.2 Liquidated Damages: 1% of contract value per week of delay
   5.3 Maximum LD: 10% of contract value

6. PAYMENT TERMS
   - 20% advance upon contract signing
   - 70% upon satisfactory completion
   - 10% retention for 12-month defects liability period
"""


def print_separator(char: str = "=", width: int = 70):
    """Print a visual separator."""
    print(char * width)


def print_header(title: str):
    """Print a section header."""
    print_separator()
    print(f"  {title}")
    print_separator()


async def run_tribunal_test():
    """Run the ForensicBrain test with mock documents."""
    print_header("USALAMA TRIBUNAL TEST")
    print("Testing ForensicBrain with deliberately flawed tender documents")
    print()

    # Step 1: Initialize the brain
    print("[1/4] Initializing ForensicBrain...")
    try:
        brain = ForensicBrain()
        print("      [OK] ForensicBrain initialized successfully")
        print(f"      Model: {brain.llm.model}")
    except Exception as e:
        print(f"      [FAILED] {e}")
        print()
        print("Make sure Ollama is running with llama3.1 model:")
        print("  $ ollama serve")
        print("  $ ollama pull llama3.1")
        return False

    # Step 2: Test document classification
    print()
    print("[2/4] Testing document classification...")

    boq_type = await brain.classify_document(MOCK_BOQ)
    specs_type = await brain.classify_document(MOCK_SPECS)

    print(f"      BoQ document classified as: {boq_type.value}")
    print(f"      Specs document classified as: {specs_type.value}")

    boq_correct = boq_type == DocumentType.BOQ
    specs_correct = specs_type == DocumentType.SPECS

    if boq_correct and specs_correct:
        print("      [OK] Both documents correctly classified")
    else:
        print("      [WARN] Classification may be imprecise, proceeding anyway")

    # Step 3: Run full forensic audit
    print()
    print("[3/4] Running forensic audit (this may take a moment)...")

    documents = [
        TenderDocument(content=MOCK_BOQ, doc_type=DocumentType.BOQ, filename="boq.txt"),
        TenderDocument(content=MOCK_SPECS, doc_type=DocumentType.SPECS, filename="specs.txt"),
    ]

    verdict = await brain.audit_tender_package(
        documents=documents,
        project_title="Narok-Kilgoris Road Upgrade",
        contractor_name="FastBuild Construction Ltd"
    )

    # Step 4: Display and verify results
    print()
    print_header("FORENSIC VERDICT")

    print(f"Project:       {verdict.project_title}")
    print(f"Contractor:    {verdict.contractor_name}")
    print(f"Risk Score:    {verdict.contractor_risk_score}/100")
    print(f"Compliant:     {'Yes' if verdict.is_compliant else 'NO'}")
    print(f"Confidence:    {verdict.analysis_confidence:.0%}")
    print(f"Docs Analyzed: {', '.join(verdict.documents_analyzed)}")

    print()
    print_separator("-")
    print("CORRUPTION FLAGS DETECTED:")
    print_separator("-")

    if verdict.flags:
        for i, flag in enumerate(verdict.flags, 1):
            print(f"\n  Flag #{i}")
            print(f"  Severity:    {flag.severity.value}")
            print(f"  Rule Broken: {flag.rule_broken}")
            print(f"  Evidence:    {flag.evidence[:150]}{'...' if len(flag.evidence) > 150 else ''}")
            if flag.legal_implication:
                print(f"  Legal Ref:   {flag.legal_implication}")
    else:
        print("  (No corruption flags detected)")

    print()
    print_separator("-")
    print("CLARIFICATION REQUESTS:")
    print_separator("-")

    if verdict.clarifications_needed:
        for i, clar in enumerate(verdict.clarifications_needed, 1):
            print(f"\n  Request #{i}")
            print(f"  Question:    {clar.question}")
            print(f"  Context:     {clar.context}")
            print(f"  Data Needed: {clar.data_point_needed}")
            print(f"  Priority:    {clar.priority.value}")
    else:
        print("  (No clarifications needed)")

    print()
    print_separator("-")
    print("EXECUTIVE SUMMARY:")
    print_separator("-")
    print(f"  {verdict.executive_summary}")

    # Verification checks
    print()
    print_header("TEST VERIFICATION")

    # Check 1: Material mismatch should be detected
    # BoQ says "Grade B gravel" but Specs require "Grade A Crushed aggregate"
    has_material_flag = any(
        any(keyword in flag.rule_broken.lower() or keyword in flag.evidence.lower()
            for keyword in ["grade", "material", "gravel", "aggregate", "mismatch"])
        for flag in verdict.flags
    )

    # Check 2: TBD items should trigger clarification
    # BoQ has "TBD" for road marking paint and unspecified items
    has_clarification = len(verdict.clarifications_needed) > 0

    # Check 3: Non-compliant verdict expected
    is_non_compliant = not verdict.is_compliant

    # Check 4: Risk score should be elevated (>0)
    has_risk = verdict.contractor_risk_score > 0

    print(f"  [{'PASS' if has_material_flag else 'FAIL'}] Material grade mismatch detected")
    print(f"  [{'PASS' if has_clarification else 'FAIL'}] Clarification request generated")
    print(f"  [{'PASS' if is_non_compliant else 'FAIL'}] Non-compliant verdict issued")
    print(f"  [{'PASS' if has_risk else 'FAIL'}] Risk score elevated ({verdict.contractor_risk_score}/100)")

    all_passed = all([has_material_flag, has_clarification, is_non_compliant, has_risk])

    print()
    print_separator("=")
    if all_passed:
        print("  [SUCCESS] ForensicBrain is detecting corruption patterns correctly!")
        print("            The system asked clarifying questions when it found gaps.")
    elif has_clarification:
        print("  [PARTIAL] ForensicBrain generated clarification requests.")
        print("            Some detection patterns may need tuning.")
    else:
        print("  [REVIEW] Some expected detections were missed.")
        print("           Review LLM output and consider prompt adjustments.")
    print_separator("=")

    return all_passed


if __name__ == "__main__":
    print()
    success = asyncio.run(run_tribunal_test())
    print()
    sys.exit(0 if success else 1)
