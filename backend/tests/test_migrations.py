import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text


MIGRATION_PATH = (
    Path(__file__).parents[1]
    / "migrations"
    / "versions"
    / "20261011_0009_booking_additional_services.py"
)
SPEC = importlib.util.spec_from_file_location("booking_additional_services_migration", MIGRATION_PATH)
assert SPEC is not None and SPEC.loader is not None
MIGRATION = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MIGRATION)


def test_additional_services_migration_preserves_legacy_booking_data():
    engine = create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE TABLE bookings ("
                    "id TEXT PRIMARY KEY, service_type TEXT NOT NULL, "
                    "bin_cleaning BOOLEAN NOT NULL, notes TEXT, currency TEXT, "
                    "subtotal_pence INTEGER, tax_rate_basis_points INTEGER, "
                    "tax_pence INTEGER, total_pence INTEGER)"
                )
            )
            connection.execute(
                text(
                    "INSERT INTO bookings (id, service_type, bin_cleaning, notes, currency, "
                    "subtotal_pence, tax_rate_basis_points, tax_pence, total_pence) "
                    "VALUES (:id, :service_type, :bin_cleaning, :notes, :currency, "
                    ":subtotal, :tax_rate, :tax, :total)"
                ),
                {
                    "id": "legacy-booking-001",
                    "service_type": "Deep cleaning",
                    "bin_cleaning": True,
                    "notes": "Keep the existing customer note.",
                    "currency": "GBP",
                    "subtotal": 12000,
                    "tax_rate": 2000,
                    "tax": 2400,
                    "total": 14400,
                },
            )
            before = dict(connection.execute(text("SELECT * FROM bookings")).mappings().one())

            with Operations.context(MigrationContext.configure(connection)):
                MIGRATION.upgrade()

            after = dict(connection.execute(text("SELECT * FROM bookings")).mappings().one())
            columns = inspect(connection).get_columns("bookings")

        old_fields = set(before)
        assert {field: after[field] for field in old_fields} == before
        assert set(after) == old_fields | {"additional_services"}
        assert after["additional_services"] is None
        additional_services_column = next(column for column in columns if column["name"] == "additional_services")
        assert additional_services_column["nullable"] is True
    finally:
        engine.dispose()
