"""Tests for alert recipient management and targeted SMS alert dispatching."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient

from app.alert_engine import get_recipients_for_alert
from app.database import Base, engine, session_scope
from app.main import app
from app.models import AlertRecipient, Zone
from app.seed_data import seed_alert_recipients, seed_database


@pytest.fixture(autouse=True)
def setup_test_db():
    """Ensure database has tables and seed data for recipient tests."""
    Base.metadata.create_all(bind=engine)
    with session_scope() as db:
        seed_database(db)
        seed_alert_recipients(db)
    yield


def test_recipients_are_seeded():
    with session_scope() as db:
        recipients = db.query(AlertRecipient).all()
        assert len(recipients) > 0
        names = [r.name for r in recipients]
        assert any("Raini" in n for n in names)
        assert any("DEOC" in n for n in names)


def test_get_recipients_for_alert_targets_village_and_district():
    with session_scope() as db:
        raini_zone = db.get(Zone, "chamoli_raini")
        assert raini_zone is not None

        # At Watch level: Chamoli DEOC (district-wide) and Raini Pradhan (zone-specific) match
        watch_recipients = get_recipients_for_alert(db, raini_zone, "Watch")
        watch_roles = {r.role for r in watch_recipients}
        assert "DEOC Officer" in watch_roles
        assert "Gram Pradhan" in watch_roles

        # Joshimath SDRF has min_alert_level=Warning and zone_id=chamoli_joshimath,
        # so it should NOT be in Raini recipients.
        assert not any(r.id == "rec_chamoli_sdrf_joshimath" for r in watch_recipients)


def test_get_recipients_respects_severity_threshold():
    with session_scope() as db:
        joshimath_zone = db.get(Zone, "chamoli_joshimath")
        assert joshimath_zone is not None

        # At Watch level, SDRF (min_alert_level=Warning) should NOT trigger
        watch_recipients = get_recipients_for_alert(db, joshimath_zone, "Watch")
        assert not any(r.id == "rec_chamoli_sdrf_joshimath" for r in watch_recipients)

        # At Warning level, SDRF SHOULD trigger
        warning_recipients = get_recipients_for_alert(db, joshimath_zone, "Warning")
        assert any(r.id == "rec_chamoli_sdrf_joshimath" for r in warning_recipients)


def test_api_list_recipients():
    client = TestClient(app)
    resp = client.get("/api/alerts/recipients?district=Chamoli")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 3
    assert all(r["district"].lower() == "chamoli" for r in data)


def test_api_create_and_delete_recipient():
    client = TestClient(app)
    new_rec = {
        "name": "Test Rescue Officer",
        "phone_number": "+919999988888",
        "role": "Emergency Services",
        "district": "Chamoli",
        "zone_id": "chamoli_raini",
        "min_alert_level": "Watch",
        "is_active": True,
    }
    create_resp = client.post("/api/alerts/recipients", json=new_rec)
    assert create_resp.status_code == 201
    created_id = create_resp.json()["id"]
    assert create_resp.json()["name"] == "Test Rescue Officer"

    # Delete recipient
    del_resp = client.delete(f"/api/alerts/recipients/{created_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True


def test_api_test_targeted_sms_simulation():
    client = TestClient(app)
    resp = client.post("/api/alerts/test-targeted-sms?zone_id=chamoli_raini&alert_level=Warning")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["zone_id"] == "chamoli_raini"
    assert len(data["recipients_targeted"]) >= 2
