"""BrightNest service-area validation helpers."""
from __future__ import annotations

import re


def normalize_postcode(value: str) -> str:
    return re.sub(r"\s+", "", value or "").upper()


def is_postcode_covered(value: str, prefixes: list[str]) -> bool:
    postcode = normalize_postcode(value)
    normalized_prefixes = [normalize_postcode(prefix) for prefix in prefixes if prefix.strip()]
    return bool(postcode) and any(postcode.startswith(prefix) for prefix in normalized_prefixes)
