"""
USALAMA Market Rate Reference
Hardcoded benchmark prices for common government procurement items.
Used for price anomaly detection (The Inflated Tender crime scene).

TODO: Replace with database table in future batch.
"""
from typing import Optional, Dict, Any
from app.schemas.intelligence import CorruptionFlag, Severity


# Market rates in KES (Kenyan Shillings)
# Format: item_key -> {min, max, unit, description}
MARKET_RATES: Dict[str, Dict[str, Any]] = {
    # Infrastructure
    "borehole": {
        "min": 2_000_000,
        "max": 4_000_000,
        "unit": "per unit",
        "description": "Standard community borehole with pump"
    },
    "classroom_construction": {
        "min": 1_500_000,
        "max": 3_000_000,
        "unit": "per classroom",
        "description": "Standard classroom block"
    },
    "road_tarmac_per_km": {
        "min": 15_000_000,
        "max": 35_000_000,
        "unit": "per kilometer",
        "description": "Tarmac road construction"
    },
    "road_gravel_per_km": {
        "min": 3_000_000,
        "max": 8_000_000,
        "unit": "per kilometer",
        "description": "Gravel road construction"
    },
    # Medical Equipment
    "ct_scanner": {
        "min": 30_000_000,
        "max": 80_000_000,
        "unit": "per unit",
        "description": "CT Scanner machine"
    },
    "hospital_bed": {
        "min": 50_000,
        "max": 200_000,
        "unit": "per bed",
        "description": "Standard hospital bed"
    },
    # Materials
    "cement_bag": {
        "min": 700,
        "max": 1_200,
        "unit": "per 50kg bag",
        "description": "Portland cement"
    },
    "steel_rebar_ton": {
        "min": 90_000,
        "max": 150_000,
        "unit": "per ton",
        "description": "Steel reinforcement bars"
    },
    "gravel_ton": {
        "min": 1_500,
        "max": 3_000,
        "unit": "per ton",
        "description": "Construction gravel"
    },
}

# Inflation threshold - flag if price exceeds max by this percentage
INFLATION_THRESHOLD = 0.5  # 50%


def check_price_anomaly(
    item_key: str,
    claimed_price: float,
    quantity: int = 1
) -> Optional[CorruptionFlag]:
    """
    Check if a claimed price significantly exceeds market rates.

    Args:
        item_key: Key from MARKET_RATES dictionary
        claimed_price: Total claimed price in KES
        quantity: Number of units

    Returns:
        CorruptionFlag if anomaly detected, None otherwise
    """
    item_key_normalized = item_key.lower().replace(" ", "_")

    if item_key_normalized not in MARKET_RATES:
        return None  # Unknown item, cannot compare

    rate = MARKET_RATES[item_key_normalized]
    unit_price = claimed_price / quantity if quantity > 0 else claimed_price

    max_acceptable = rate["max"] * (1 + INFLATION_THRESHOLD)

    if unit_price > max_acceptable:
        inflation_pct = ((unit_price - rate["max"]) / rate["max"]) * 100

        severity = Severity.MEDIUM
        if inflation_pct > 100:
            severity = Severity.HIGH
        if inflation_pct > 200:
            severity = Severity.CRITICAL

        return CorruptionFlag(
            rule_broken=f"Price inflation detected for {item_key}",
            severity=severity,
            evidence=(
                f"Claimed price: KES {claimed_price:,.2f} for {quantity} {rate['unit']}. "
                f"Unit price: KES {unit_price:,.2f}. "
                f"Market range: KES {rate['min']:,.2f} - {rate['max']:,.2f} {rate['unit']}. "
                f"Inflation: {inflation_pct:.1f}% above market maximum."
            ),
            legal_implication="Section 68 - Fraudulent pricing in public procurement",
            document_sources=["bill_of_quantities"]
        )

    return None


def get_market_rate(item_key: str) -> Optional[Dict[str, Any]]:
    """Get market rate info for an item."""
    return MARKET_RATES.get(item_key.lower().replace(" ", "_"))
