"""BrightNest service-area validation helpers."""
from __future__ import annotations

import re


def normalize_postcode(value: str) -> str:
    return re.sub(r"\s+", "", value or "").upper()


def is_valid_uk_postcode(value: str) -> bool:
    """Accept standard UK outward/inward postcode formats after whitespace removal."""
    postcode = normalize_postcode(value)
    return bool(re.fullmatch(r"(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})", postcode))


def is_postcode_covered(value: str, prefixes: list[str]) -> bool:
    postcode = normalize_postcode(value)
    normalized_prefixes = [normalize_postcode(prefix) for prefix in prefixes if prefix.strip()]
    if not is_valid_uk_postcode(postcode):
        return False
    if any(prefix in {"ALL", "UK", "*"} for prefix in normalized_prefixes):
        return True
    return any(postcode.startswith(prefix) for prefix in normalized_prefixes)
