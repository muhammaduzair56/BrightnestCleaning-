from app.coverage import is_postcode_covered, is_valid_uk_postcode


def test_accepts_valid_postcodes_from_different_uk_regions() -> None:
    for postcode in ("B1 1AA", "SW1A 1AA", "M1 1AA", "BT1 1AA", "AB10 1AA", "GIR 0AA"):
        assert is_valid_uk_postcode(postcode)
        assert is_postcode_covered(postcode, ["ALL"])


def test_rejects_invalid_postcode_even_in_full_uk_mode() -> None:
    assert not is_postcode_covered("NOT A POSTCODE", ["ALL"])
    assert not is_postcode_covered("12345", ["ALL"])


def test_prefix_mode_remains_available_for_limited_rollouts() -> None:
    assert is_postcode_covered("B1 1AA", ["B"])
    assert not is_postcode_covered("SW1A 1AA", ["B"])
