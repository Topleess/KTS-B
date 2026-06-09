import os
from datetime import UTC, datetime, timedelta
from hashlib import sha256
import hmac
import json
from urllib.parse import urlencode
from uuid import UUID

os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ALLOW_DEV_AUTH"] = "true"
os.environ["WEATHER_PROVIDER"] = "disabled"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["STORAGE_LOCAL_ROOT"] = "../.data/test-uploads"

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import Base, engine
from app.models import PendingAction
from app.core import runtime
from app.services.scheduler_service import ScheduledJob, due_jobs, run_due_jobs
from app.main import app
from app.services.assistant_service import normalize_action_proposal
from app.services.seed import ensure_demo_data
from app.core.database import SessionLocal


def signed_telegram_init_data(bot_token: str, user: dict, auth_date: datetime | None = None) -> str:
    pairs = {
        "auth_date": str(int((auth_date or datetime.now(UTC)).timestamp())),
        "query_id": "AAE-test-query",
        "user": json.dumps(user, separators=(",", ":")),
    }
    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(pairs.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), sha256).digest()
    payload_hash = hmac.new(secret_key, data_check_string.encode(), sha256).hexdigest()
    return urlencode({**pairs, "hash": payload_hash})


@pytest.fixture(autouse=True)
async def database():
    runtime.settings.telegram_bot_token = None
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with SessionLocal() as session:
        await ensure_demo_data(session)
    yield
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", headers={"X-Dev-User": "demo"}) as http:
        yield http


async def test_profile_and_routine(client: AsyncClient):
    profile = await client.get("/api/v1/profile")
    assert profile.status_code == 200
    assert profile.json()["skin_type"] == "Комбинированная кожа"

    routine = await client.get("/api/v1/routines/active")
    assert routine.status_code == 200
    assert len(routine.json()["steps"]) >= 4


async def test_routine_current_session_progress_and_history(client: AsyncClient):
    active = await client.get("/api/v1/routines/active")
    assert active.status_code == 200
    morning_steps = [step for step in active.json()["steps"] if step["period"] == "morning"]
    assert len(morning_steps) >= 1

    initial_progress = await client.get("/api/v1/routines/progress", params={"period": "morning"})
    assert initial_progress.status_code == 200
    assert initial_progress.json()["session"] is None
    assert initial_progress.json()["completed_steps"] == 0
    assert initial_progress.json()["next_step"]["id"] == morning_steps[0]["id"]

    current = await client.post("/api/v1/routines/sessions/current", json={"period": "morning"})
    assert current.status_code == 200
    current_payload = current.json()

    duplicate = await client.post("/api/v1/routines/sessions/current", json={"period": "morning"})
    assert duplicate.status_code == 200
    assert duplicate.json()["id"] == current_payload["id"]

    invalid_step = await client.post(
        f"/api/v1/routines/sessions/{current_payload['id']}/steps",
        json={"step_id": str(UUID(int=0))},
    )
    assert invalid_step.status_code == 404

    completed = current_payload
    for step in morning_steps:
        response = await client.post(f"/api/v1/routines/sessions/{current_payload['id']}/steps", json={"step_id": step["id"]})
        assert response.status_code == 200
        completed = response.json()

    assert completed["status"] == "completed"
    assert set(completed["completed_step_ids"]) == {step["id"] for step in morning_steps}

    history = await client.get("/api/v1/routines/sessions", params={"limit": 5})
    assert history.status_code == 200
    assert current_payload["id"] in {item["id"] for item in history.json()}

    after_complete = await client.get("/api/v1/routines/sessions/current", params={"period": "morning"})
    assert after_complete.status_code == 200
    assert after_complete.json() is None


async def test_routine_plan_step_editing(client: AsyncClient):
    products = await client.get("/api/v1/products")
    assert products.status_code == 200
    spf = next(item for item in products.json() if item["external_key"] == "spf")
    serum = next(item for item in products.json() if item["external_key"] == "serum")

    created = await client.post(
        "/api/v1/routines/steps",
        json={
            "period": "day",
            "sequence_order": 1,
            "step_type": "spf_reapply",
            "purpose": "обновить SPF",
            "rationale": "Высокий UV требует обновления защиты.",
            "instructions": "Обнови SPF перед выходом.",
            "schedule_rule": {"days": "daily", "time": "afternoon"},
            "product_id": spf["id"],
        },
    )
    assert created.status_code == 200
    step = created.json()
    assert step["product"]["id"] == spf["id"]
    assert step["is_active"] is True
    assert step["schedule_rule"]["time"] == "afternoon"

    patched = await client.patch(
        f"/api/v1/routines/steps/{step['id']}",
        json={"purpose": "мягкий дневной шаг", "product_id": serum["id"], "sequence_order": 2},
    )
    assert patched.status_code == 200
    assert patched.json()["purpose"] == "мягкий дневной шаг"
    assert patched.json()["product"]["id"] == serum["id"]

    progress = await client.get("/api/v1/routines/progress", params={"period": "day"})
    assert progress.status_code == 200
    assert progress.json()["total_steps"] >= 1
    assert progress.json()["next_step"]["id"] == step["id"]

    disabled = await client.delete(f"/api/v1/routines/steps/{step['id']}")
    assert disabled.status_code == 200
    assert disabled.json()["is_active"] is False

    progress_after_disable = await client.get("/api/v1/routines/progress", params={"period": "day"})
    assert progress_after_disable.status_code == 200
    assert progress_after_disable.json()["total_steps"] == 0

    missing_product = await client.post(
        "/api/v1/routines/steps",
        json={"period": "day", "sequence_order": 1, "step_type": "test", "product_id": str(UUID(int=0))},
    )
    assert missing_product.status_code == 404


async def test_profile_permissions_and_notification_settings(client: AsyncClient):
    permissions = await client.get("/api/v1/profile/permissions")
    assert permissions.status_code == 200
    assert permissions.json()["camera"] == "not_requested"
    assert permissions.json()["geolocation"] == "manual"

    updated_permissions = await client.patch(
        "/api/v1/profile/permissions",
        json={"camera": "granted", "geolocation": "granted", "notifications": "denied"},
    )
    assert updated_permissions.status_code == 200
    assert updated_permissions.json()["camera"] == "granted"
    assert updated_permissions.json()["geolocation"] == "granted"
    assert updated_permissions.json()["notifications"] == "denied"

    profile = await client.get("/api/v1/profile")
    assert profile.status_code == 200
    assert profile.json()["location_mode"] == "telegram"
    assert profile.json()["restrictions"]["permissions"]["camera"] == "granted"
    assert "permissions_updated_at" in profile.json()["restrictions"]

    invalid = await client.patch("/api/v1/profile/permissions", json={"camera": "maybe"})
    assert invalid.status_code == 422

    notification_settings = await client.patch(
        "/api/v1/profile/notification-settings",
        json={"uv_alerts": False, "price_alerts": True},
    )
    assert notification_settings.status_code == 200
    assert notification_settings.json()["uv_alerts"] is False
    assert notification_settings.json()["price_alerts"] is True


async def test_profile_consents_accept_revoke_and_export(client: AsyncClient):
    consents = await client.get("/api/v1/profile/consents")
    assert consents.status_code == 200
    by_key = {item["key"]: item for item in consents.json()["consents"]}
    assert by_key["data_processing"]["status"] == "not_requested"
    assert by_key["privacy_policy"]["version"] == "v0.1"

    accepted = await client.patch("/api/v1/profile/consents/data_processing", json={"status": "accepted", "version": "v0.1"})
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"
    assert accepted.json()["updated_at"] is not None

    revoked = await client.patch("/api/v1/profile/consents/data_processing", json={"status": "revoked", "version": "v0.1"})
    assert revoked.status_code == 200
    assert revoked.json()["status"] == "revoked"

    invalid_key = await client.patch("/api/v1/profile/consents/unknown", json={"status": "accepted"})
    assert invalid_key.status_code == 404
    invalid_status = await client.patch("/api/v1/profile/consents/privacy_policy", json={"status": "maybe"})
    assert invalid_status.status_code == 422

    profile = await client.get("/api/v1/profile")
    assert profile.status_code == 200
    restrictions = profile.json()["restrictions"]
    assert restrictions["consents"]["data_processing"]["status"] == "revoked"
    assert len(restrictions["consent_history"]) >= 2

    export = await client.get("/api/v1/profile/data/export")
    assert export.status_code == 200
    assert export.json()["profile"]["restrictions"]["consents"]["data_processing"]["status"] == "revoked"


async def test_ready_endpoint_checks_database(client: AsyncClient):
    response = await client.get("/ready")
    assert response.status_code == 200
    assert response.json()["checks"]["database"] == "ok"


async def test_integrations_status_reports_config_without_secrets(client: AsyncClient):
    response = await client.get("/api/v1/integrations/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["app_env"] == "test"
    assert payload["overall_status"] == "degraded"
    by_name = {item["name"]: item for item in payload["integrations"]}
    assert by_name["database"]["status"] == "configured"
    assert by_name["telegram_auth"]["status"] == "missing_config"
    assert by_name["telegram_auth"]["required_for_production"] is True
    assert by_name["telegram_notifications"]["status"] == "dry_run"
    assert by_name["openai"]["status"] == "fallback"
    assert by_name["weather"]["status"] == "fallback"
    serialized = str(payload)
    assert "secret" not in serialized.lower()
    assert "sk-" not in serialized


def test_production_runtime_settings_validation(monkeypatch):
    monkeypatch.setattr(runtime.settings, "app_env", "production")
    monkeypatch.setattr(runtime.settings, "jwt_secret", "change-me-in-production")
    monkeypatch.setattr(runtime.settings, "allow_dev_auth", True)
    monkeypatch.setattr(runtime.settings, "telegram_bot_token", None)
    with pytest.raises(RuntimeError) as error:
        runtime.validate_runtime_settings()
    assert "JWT_SECRET" in str(error.value)
    assert "ALLOW_DEV_AUTH" in str(error.value)
    assert "TELEGRAM_BOT_TOKEN" in str(error.value)

    monkeypatch.setattr(runtime.settings, "jwt_secret", "x" * 48)
    monkeypatch.setattr(runtime.settings, "allow_dev_auth", False)
    monkeypatch.setattr(runtime.settings, "telegram_bot_token", "token")
    runtime.validate_runtime_settings()


async def test_generate_routine_from_questionnaire(client: AsyncClient):
    generated = await client.post(
        "/api/v1/routines/generate",
        json={
            "category": ["face", "spf"],
            "focus": ["Постакне", "Ровный тон", "Чувствительность"],
            "skinType": "Чувствительная",
            "restrictions": {
                "sensitivity": {"Кожа легко раздражается": True},
                "exclude": ["Отдушки"],
            },
            "age": "25–34",
            "experience": "Знаю базу",
            "budget": "b2",
            "stores": ["ЗЯ", "Ozon"],
        },
    )
    assert generated.status_code == 200
    payload = generated.json()
    assert payload["version"] == 2
    assert payload["is_active"] is True
    assert any(step["step_type"] == "spf" for step in payload["steps"])
    periods = [step["period"] for step in payload["steps"]]
    assert periods == sorted(periods, key=lambda period: {"morning": 0, "day": 1, "evening": 2}.get(period, 99))

    profile = await client.get("/api/v1/profile")
    assert profile.status_code == 200
    profile_payload = profile.json()
    assert profile_payload["skin_type"] == "Чувствительная"
    assert profile_payload["sensitivity_level"] == "high"
    assert profile_payload["budget_limit"] == 4000
    assert profile_payload["goals"] == ["Постакне", "Ровный тон", "Чувствительность"]
    assert profile_payload["restrictions"]["onboarding"]["budget"] == "b2"

    active = await client.get("/api/v1/routines/active")
    assert active.status_code == 200
    assert active.json()["id"] == payload["id"]


async def test_dev_login_cookie_me_and_logout():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://testserver") as http:
        login = await http.post("/api/v1/auth/dev-login")
        assert login.status_code == 200
        assert "cosmeto_session" in http.cookies

        me = await http.get("/api/v1/me")
        assert me.status_code == 200
        assert me.json()["user"]["telegram_user_id"] == 1000001

        logout = await http.post("/api/v1/auth/logout")
        assert logout.status_code == 200


async def test_telegram_auth_valid_init_data_creates_user(monkeypatch):
    monkeypatch.setattr(runtime.settings, "telegram_bot_token", "test-bot-token")
    init_data = signed_telegram_init_data(
        "test-bot-token",
        {"id": 424242, "first_name": "Nika", "username": "nika_cosmeto", "language_code": "ru"},
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://testserver") as http:
        login = await http.post("/api/v1/auth/telegram", json={"init_data": init_data})
        assert login.status_code == 200
        assert "cosmeto_session" in http.cookies
        payload = login.json()
        assert payload["user"]["telegram_user_id"] == 424242
        assert payload["user"]["telegram_username"] == "nika_cosmeto"
        assert payload["user"]["display_name"] == "Nika"

        me = await http.get("/api/v1/me")
        assert me.status_code == 200
        assert me.json()["user"]["telegram_user_id"] == 424242


async def test_telegram_auth_rejects_invalid_hash(monkeypatch):
    monkeypatch.setattr(runtime.settings, "telegram_bot_token", "test-bot-token")
    init_data = signed_telegram_init_data("test-bot-token", {"id": 424243, "first_name": "Invalid"})
    init_data = init_data.replace("hash=", "hash=bad")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        response = await http.post("/api/v1/auth/telegram", json={"init_data": init_data})
        assert response.status_code == 401


async def test_telegram_auth_rejects_expired_auth_date(monkeypatch):
    monkeypatch.setattr(runtime.settings, "telegram_bot_token", "test-bot-token")
    init_data = signed_telegram_init_data(
        "test-bot-token",
        {"id": 424244, "first_name": "Expired"},
        auth_date=datetime.now(UTC) - timedelta(days=2),
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        response = await http.post("/api/v1/auth/telegram", json={"init_data": init_data})
        assert response.status_code == 401


async def test_telegram_auth_requires_bot_token(monkeypatch):
    monkeypatch.setattr(runtime.settings, "telegram_bot_token", None)
    init_data = signed_telegram_init_data("test-bot-token", {"id": 424245, "first_name": "NoToken"})
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        response = await http.post("/api/v1/auth/telegram", json={"init_data": init_data})
        assert response.status_code == 500


async def test_action_confirmation_flow(client: AsyncClient):
    products = await client.get("/api/v1/products")
    product_id = products.json()[0]["id"]
    preview = await client.post(
        "/api/v1/actions/preview",
        json={"action_type": "start_price_tracking", "payload": {"product_id": product_id, "threshold_price": 1100}},
    )
    assert preview.status_code == 200
    action_id = preview.json()["id"]

    confirm = await client.post(f"/api/v1/actions/{action_id}/confirm")
    assert confirm.status_code == 200
    assert confirm.json()["action"]["status"] == "confirmed"

    actions = await client.get("/api/v1/actions", params={"status": "confirmed"})
    assert actions.status_code == 200
    assert action_id in {action["id"] for action in actions.json()}

    summary = await client.get("/api/v1/actions/summary")
    assert summary.status_code == 200
    assert summary.json()["by_status"]["confirmed"] >= 1


async def test_action_reject_and_expiry(client: AsyncClient):
    preview = await client.post(
        "/api/v1/actions/preview",
        json={"action_type": "update_budget", "payload": {"budget_limit": 2500}},
    )
    assert preview.status_code == 200
    rejected = await client.post(f"/api/v1/actions/{preview.json()['id']}/reject", json={"reason": "не сейчас"})
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"

    expired_preview = await client.post(
        "/api/v1/actions/preview",
        json={"action_type": "update_budget", "payload": {"budget_limit": 3000}},
    )
    assert expired_preview.status_code == 200
    async with SessionLocal() as session:
        action = await session.get(PendingAction, UUID(expired_preview.json()["id"]))
        action.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        await session.commit()

    expired = await client.post(f"/api/v1/actions/{expired_preview.json()['id']}/confirm")
    assert expired.status_code == 409

    expired_actions = await client.get("/api/v1/actions", params={"status": "expired"})
    assert expired_actions.status_code == 200
    assert expired_preview.json()["id"] in {action["id"] for action in expired_actions.json()}


async def test_action_undo_rolls_back_profile_and_created_records(client: AsyncClient):
    profile_before = await client.get("/api/v1/profile")
    assert profile_before.status_code == 200
    original_budget = profile_before.json()["budget_limit"]

    budget_preview = await client.post(
        "/api/v1/actions/preview",
        json={"action_type": "update_budget", "payload": {"budget_limit": 1234}},
    )
    assert budget_preview.status_code == 200
    budget_confirm = await client.post(f"/api/v1/actions/{budget_preview.json()['id']}/confirm")
    assert budget_confirm.status_code == 200
    assert budget_confirm.json()["receipt"]["previous_budget_limit"] == original_budget

    profile_after = await client.get("/api/v1/profile")
    assert profile_after.json()["budget_limit"] == 1234

    budget_undo = await client.post(f"/api/v1/actions/{budget_preview.json()['id']}/undo")
    assert budget_undo.status_code == 200
    assert budget_undo.json()["receipt"]["restored"] == "budget"
    restored_profile = await client.get("/api/v1/profile")
    assert restored_profile.json()["budget_limit"] == original_budget

    observation_preview = await client.post(
        "/api/v1/actions/preview",
        json={"action_type": "add_observation", "payload": {"feeling": "undo-test", "severity": 2, "notes": "temporary"}},
    )
    assert observation_preview.status_code == 200
    observation_confirm = await client.post(f"/api/v1/actions/{observation_preview.json()['id']}/confirm")
    assert observation_confirm.status_code == 200
    observation_id = observation_confirm.json()["receipt"]["id"]

    observations = await client.get("/api/v1/observations")
    assert observation_id in {item["id"] for item in observations.json()}

    observation_undo = await client.post(f"/api/v1/actions/{observation_preview.json()['id']}/undo")
    assert observation_undo.status_code == 200
    assert observation_undo.json()["receipt"]["removed"] == "observation"
    observations_after_undo = await client.get("/api/v1/observations")
    assert observation_id not in {item["id"] for item in observations_after_undo.json()}


async def test_recommendations_scan_care_and_alerts(client: AsyncClient):
    care = await client.get("/api/v1/care/today")
    assert care.status_code == 200
    assert care.json()["environment"]["uv_index"] >= 0
    assert care.json()["environment"]["source"] == "disabled_provider"

    timeline = await client.get("/api/v1/care/timeline")
    assert timeline.status_code == 200
    timeline_items = timeline.json()
    item_types = {item["item_type"] for item in timeline_items}
    assert "routine" in item_types
    assert "environment" in item_types
    assert "product_low" in item_types
    assert all(item["action"] is None or {"type", "label", "payload"} <= set(item["action"]) for item in timeline_items)

    recommendations = await client.get("/api/v1/recommendations")
    assert recommendations.status_code == 200
    product_id = recommendations.json()[0]["product"]["id"]

    alert = await client.post("/api/v1/price-alerts", json={"product_id": product_id, "threshold_price": 900})
    assert alert.status_code == 200
    assert alert.json()["is_active"] is True

    candidates = await client.post("/api/v1/scans/identify", json={"query": "spf"})
    assert candidates.status_code == 200
    candidate_id = candidates.json()[0]["id"]
    confirmed = await client.post(f"/api/v1/scans/{candidate_id}/confirm")
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "confirmed"

    upload_without_consent = await client.post(
        "/api/v1/scans/uploads",
        files={"file": ("product.txt", b"demo", "text/plain")},
        data={"photo_type": "product", "consent_status": "granted"},
    )
    assert upload_without_consent.status_code == 403

    consent = await client.patch("/api/v1/profile/consents/photo_analysis", json={"status": "accepted", "version": "v0.1"})
    assert consent.status_code == 200

    upload = await client.post(
        "/api/v1/scans/uploads",
        files={"file": ("product.txt", b"demo", "text/plain")},
        data={"photo_type": "product", "consent_status": "granted"},
    )
    assert upload.status_code == 200
    uploaded_photo = upload.json()
    assert uploaded_photo["storage_path"].endswith(".txt")

    access = await client.get(f"/api/v1/scans/uploads/{uploaded_photo['id']}/access")
    assert access.status_code == 200
    assert access.json()["access_type"] == "backend_stream"

    content = await client.get(access.json()["url"])
    assert content.status_code == 200
    assert content.content == b"demo"

    deleted = await client.delete(f"/api/v1/profile/photos/{uploaded_photo['id']}")
    assert deleted.status_code == 200
    denied = await client.get(f"/api/v1/scans/uploads/{uploaded_photo['id']}/access")
    assert denied.status_code == 404


async def test_price_collection_creates_history_and_summary(client: AsyncClient):
    products = await client.get("/api/v1/products")
    serum = next(item for item in products.json() if item["external_key"] == "serum")

    job = await client.post("/api/v1/jobs/price-collection")
    assert job.status_code == 200
    assert job.json()["upserted"] >= 1

    history = await client.get(f"/api/v1/prices/products/{serum['id']}/history")
    assert history.status_code == 200
    assert len(history.json()) >= 1
    assert all(item["product_id"] == serum["id"] for item in history.json())

    summary = await client.get(f"/api/v1/prices/products/{serum['id']}/summary")
    assert summary.status_code == 200
    payload = summary.json()
    assert payload["offers_count"] >= 1
    assert payload["history_count"] >= 1
    assert payload["best_offer"]["price"] == payload["min_price"]
    assert payload["last_collected_at"] is not None


async def test_owned_products_crud(client: AsyncClient):
    products = await client.get("/api/v1/products")
    cleanser = next(item for item in products.json() if item["external_key"] == "cleanser")

    created = await client.post(
        "/api/v1/products/owned",
        json={"product_id": cleanser["id"], "status": "used", "note": "добавлено вручную", "amount_left_percent": 80},
    )
    assert created.status_code == 200
    owned = created.json()
    assert owned["product"]["external_key"] == "cleanser"
    assert owned["amount_left_percent"] == 80

    upserted = await client.post(
        "/api/v1/products/owned",
        json={"product_id": cleanser["id"], "status": "repeat", "note": "обновлено", "amount_left_percent": 40},
    )
    assert upserted.status_code == 200
    assert upserted.json()["id"] == owned["id"]
    assert upserted.json()["status"] == "repeat"

    patched = await client.patch(f"/api/v1/products/owned/{owned['id']}", json={"amount_left_percent": None})
    assert patched.status_code == 200
    assert patched.json()["amount_left_percent"] is None

    deleted = await client.delete(f"/api/v1/products/owned/{owned['id']}")
    assert deleted.status_code == 200

    missing = await client.patch(f"/api/v1/products/owned/{owned['id']}", json={"status": "used"})
    assert missing.status_code == 404


async def test_owned_product_summary_and_detail(client: AsyncClient):
    owned_products = await client.get("/api/v1/products/owned")
    assert owned_products.status_code == 200
    serum_owned = next(item for item in owned_products.json() if item["product"]["external_key"] == "serum")

    observation = await client.post(
        "/api/v1/observations",
        json={"product_id": serum_owned["product"]["id"], "feeling": "нормально", "severity": 1, "notes": "без реакции"},
    )
    assert observation.status_code == 200
    alert = await client.post(
        "/api/v1/price-alerts",
        json={"product_id": serum_owned["product"]["id"], "threshold_price": 1200, "retailers": ["golden-apple"]},
    )
    assert alert.status_code == 200

    summary = await client.get("/api/v1/products/owned/summary")
    assert summary.status_code == 200
    summary_payload = summary.json()
    assert summary_payload["total"] >= 4
    assert summary_payload["by_status"]["used"] >= 1
    assert summary_payload["low_amount_count"] >= 1
    assert summary_payload["tracked_count"] >= 1

    detail = await client.get(f"/api/v1/products/owned/{serum_owned['id']}")
    assert detail.status_code == 200
    detail_payload = detail.json()
    assert detail_payload["owned"]["id"] == serum_owned["id"]
    assert detail_payload["price_summary"]["offers_count"] >= 1
    assert detail_payload["active_price_alerts"][0]["threshold_price"] == 1200
    assert detail_payload["recent_observations"][0]["notes"] == "без реакции"
    assert detail_payload["next_action"] == "keep_in_routine"

    missing = await client.get(f"/api/v1/products/owned/{str(UUID(int=0))}")
    assert missing.status_code == 404


async def test_recommendation_actions_can_be_confirmed(client: AsyncClient):
    recommendations = await client.get("/api/v1/recommendations")
    assert recommendations.status_code == 200
    serum = next(item for item in recommendations.json() if item["product"]["external_key"] == "serum")
    product_id = serum["product"]["id"]

    add_action = await client.post(f"/api/v1/recommendations/{product_id}/actions/add-owned")
    assert add_action.status_code == 200
    assert add_action.json()["action_type"] == "add_owned_product"
    add_receipt = await client.post(f"/api/v1/actions/{add_action.json()['id']}/confirm")
    assert add_receipt.status_code == 200
    assert add_receipt.json()["receipt"]["created"] == "owned_product"

    owned = await client.get("/api/v1/products/owned")
    assert owned.status_code == 200
    assert any(item["product"]["id"] == product_id for item in owned.json())

    price_action = await client.post(f"/api/v1/recommendations/{product_id}/actions/track-price")
    assert price_action.status_code == 200
    assert price_action.json()["action_type"] == "start_price_tracking"
    assert price_action.json()["payload"]["product_id"] == product_id

    price_receipt = await client.post(f"/api/v1/actions/{price_action.json()['id']}/confirm")
    assert price_receipt.status_code == 200
    assert price_receipt.json()["receipt"]["created"] == "price_alert"


async def test_product_check_uses_profile_restrictions(client: AsyncClient):
    generated = await client.post(
        "/api/v1/routines/generate",
        json={
            "category": ["face"],
            "focus": ["Чувствительность"],
            "skinType": "Чувствительная",
            "restrictions": {"sensitivity": {"Кожа легко раздражается": True}, "exclude": ["Отдушки"]},
            "age": "25–34",
            "experience": "Знаю базу",
            "budget": "b2",
            "stores": ["ЗЯ"],
        },
    )
    assert generated.status_code == 200

    check = await client.post(
        "/api/v1/products/check",
        json={"query": "unknown", "inci": "Aqua, Glycerin, Niacinamide, Parfum, Linalool."},
    )
    assert check.status_code == 200
    payload = check.json()
    assert payload["verdict"] == "avoid"
    assert "Glycerin" in payload["useful_ingredients"]
    assert "Parfum" in payload["caution_ingredients"]
    assert payload["product"] is None


async def test_product_check_action_previews_can_be_confirmed(client: AsyncClient):
    check = await client.post("/api/v1/products/check", json={"query": "spf"})
    assert check.status_code == 200
    product_id = check.json()["product"]["id"]

    add_owned = await client.post(f"/api/v1/products/check/actions/add-owned/{product_id}")
    assert add_owned.status_code == 200
    assert add_owned.json()["action_type"] == "add_owned_product"
    assert add_owned.json()["payload"]["product_id"] == product_id

    add_receipt = await client.post(f"/api/v1/actions/{add_owned.json()['id']}/confirm")
    assert add_receipt.status_code == 200
    assert add_receipt.json()["receipt"]["created"] == "owned_product"

    track_price = await client.post(f"/api/v1/products/check/actions/track-price/{product_id}")
    assert track_price.status_code == 200
    assert track_price.json()["action_type"] == "start_price_tracking"
    assert track_price.json()["payload"]["product_id"] == product_id

    observation = await client.post(
        "/api/v1/products/check/actions/add-observation",
        json={"product_id": product_id, "notes": "Патч-тест после проверки"},
    )
    assert observation.status_code == 200
    assert observation.json()["action_type"] == "add_observation"
    observation_receipt = await client.post(f"/api/v1/actions/{observation.json()['id']}/confirm")
    assert observation_receipt.status_code == 200
    assert observation_receipt.json()["receipt"]["created"] == "observation"

    missing = await client.post(f"/api/v1/products/check/actions/add-owned/{str(UUID(int=0))}")
    assert missing.status_code == 404


async def test_worker_jobs_create_events(client: AsyncClient):
    products = await client.get("/api/v1/products")
    serum = next(item for item in products.json() if item["external_key"] == "serum")
    alert = await client.post("/api/v1/price-alerts", json={"product_id": serum["id"], "threshold_price": 1300})
    assert alert.status_code == 200

    jobs = await client.post("/api/v1/jobs/run")
    assert jobs.status_code == 200
    payload = jobs.json()
    assert payload["price_collection"]["upserted"] >= 1
    assert payload["price_alerts"]["checked"] >= 1
    assert payload["product_low"]["checked"] >= 1
    assert payload["notification_dispatch"]["dry_run"] >= 1

    events = await client.get("/api/v1/events")
    assert events.status_code == 200
    event_types = {event["event_type"] for event in events.json()}
    assert "price_drop" in event_types
    assert "product_low" in event_types
    assert any((event["payload"].get("notification") or {}).get("status") == "dry_run" for event in events.json())

    timeline = await client.get("/api/v1/care/timeline")
    assert timeline.status_code == 200
    event_items = [item for item in timeline.json() if item["item_type"].startswith("event:")]
    assert event_items
    assert any(item["action"] for item in event_items)


async def test_events_inbox_summary_filters_and_bulk_actions(client: AsyncClient):
    summary = await client.get("/api/v1/events/summary")
    assert summary.status_code == 200
    assert summary.json()["total"] >= 3
    assert summary.json()["unread"] >= 1

    unread = await client.get("/api/v1/events", params={"status": "unread"})
    assert unread.status_code == 200
    assert unread.json()
    assert {event["status"] for event in unread.json()} == {"unread"}
    event_id = unread.json()[0]["id"]

    marked = await client.patch(f"/api/v1/events/{event_id}/read")
    assert marked.status_code == 200
    read = await client.get("/api/v1/events", params={"status": "read"})
    assert read.status_code == 200
    assert event_id in {event["id"] for event in read.json()}

    dismissed = await client.patch(f"/api/v1/events/{event_id}/dismiss")
    assert dismissed.status_code == 200
    dismissed_list = await client.get("/api/v1/events", params={"status": "dismissed"})
    assert dismissed_list.status_code == 200
    assert event_id in {event["id"] for event in dismissed_list.json()}

    all_read = await client.patch("/api/v1/events/read-all")
    assert all_read.status_code == 200
    after_read_summary = await client.get("/api/v1/events/summary")
    assert after_read_summary.json()["unread"] == 0

    all_dismissed = await client.patch("/api/v1/events/dismiss-all")
    assert all_dismissed.status_code == 200
    after_dismiss_summary = await client.get("/api/v1/events/summary")
    assert after_dismiss_summary.json()["dismissed"] == after_dismiss_summary.json()["total"]


async def test_production_job_endpoints_require_admin_token(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(runtime.settings, "app_env", "production")
    monkeypatch.setattr(runtime.settings, "jobs_admin_token", None)
    disabled = await client.post("/api/v1/jobs/notifications")
    assert disabled.status_code == 403

    monkeypatch.setattr(runtime.settings, "jobs_admin_token", "secret-token")
    wrong = await client.post("/api/v1/jobs/notifications", headers={"Authorization": "Bearer wrong"})
    assert wrong.status_code == 403

    allowed = await client.post("/api/v1/jobs/notifications", headers={"Authorization": "Bearer secret-token"})
    assert allowed.status_code == 200
    assert "checked" in allowed.json()


async def test_scheduler_due_jobs_runs_only_due_items():
    calls: list[str] = []

    async def runner(_session):
        calls.append("fast")
        return {"status": "ok"}

    async def slow_runner(_session):
        calls.append("slow")
        return {"status": "ok"}

    schedule = [
        ScheduledJob("fast", 10, runner),
        ScheduledJob("slow", 100, slow_runner),
        ScheduledJob("disabled", 0, slow_runner),
    ]
    last_run_at = {"slow": 50}
    assert [job.name for job in due_jobs(schedule, last_run_at, now=120)] == ["fast"]

    async with SessionLocal() as session:
        result = await run_due_jobs(session, schedule=schedule, last_run_at=last_run_at, now=120)

    assert calls == ["fast"]
    assert result["ran"]["fast"] == {"status": "ok"}
    assert set(result["skipped"]) == {"slow", "disabled"}
    assert last_run_at["fast"] == 120


async def test_observation_followup_job(client: AsyncClient):
    products = await client.get("/api/v1/products")
    product_id = products.json()[0]["id"]
    observation = await client.post(
        "/api/v1/observations",
        json={"product_id": product_id, "feeling": "покраснение", "severity": 3, "notes": "после сыворотки"},
    )
    assert observation.status_code == 200

    job = await client.post("/api/v1/jobs/observation-followups")
    assert job.status_code == 200
    assert job.json()["created_events"] == 1

    repeat = await client.post("/api/v1/jobs/observation-followups")
    assert repeat.status_code == 200
    assert repeat.json()["created_events"] == 0

    events = await client.get("/api/v1/events")
    assert events.status_code == 200
    assert "followup" in {event["event_type"] for event in events.json()}


async def test_assistant_stream_fallback(client: AsyncClient):
    response = await client.post("/api/v1/assistant/stream", json={"message": "кожа стянута после умывания"})
    assert response.status_code == 200
    assert "event: block" in response.text
    assert "action_id" in response.text
    thread_line = next(line for line in response.text.splitlines() if line.startswith("data:") and "thread_id" in line)
    thread_id = __import__("json").loads(thread_line.removeprefix("data: "))["thread_id"]

    thread = await client.get(f"/api/v1/assistant/threads/{thread_id}")
    assert thread.status_code == 200
    messages = thread.json()["messages"]
    assert [message["role"] for message in messages] == ["user", "assistant"]
    text_block = messages[1]["blocks"][0]
    assert text_block["type"] == "text"
    assert text_block["segments"][1]["type"] == "inline_action"
    assert messages[1]["blocks"][1]["type"] == "action_card"
    assert text_block["segments"][1]["payload"]["action_id"] == messages[1]["blocks"][1]["action_id"]


async def test_assistant_does_not_call_external_ai_without_personalization_consent(client: AsyncClient, monkeypatch):
    monkeypatch.setattr("app.services.assistant_service.settings.openai_api_key", "sk-test")
    response = await client.post("/api/v1/assistant/stream", json={"message": "обнови цели ухода"})
    assert response.status_code == 200
    assert "privacy_notice" in response.text
    assert "action_card" in response.text

    thread_line = next(line for line in response.text.splitlines() if line.startswith("data:") and "thread_id" in line)
    thread_id = __import__("json").loads(thread_line.removeprefix("data: "))["thread_id"]
    thread = await client.get(f"/api/v1/assistant/threads/{thread_id}")
    blocks = thread.json()["messages"][1]["blocks"]
    assert blocks[1]["type"] == "privacy_notice"
    assert blocks[1]["payload"]["consent_key"] == "ai_personalization"
    assert blocks[2]["type"] == "action_card"


async def test_assistant_openai_proposal_normalization_resolves_product():
    async with SessionLocal() as session:
        action = await normalize_action_proposal(
            session,
            {
                "action_type": "start_price_tracking",
                "payload": {"product_external_key": "serum", "threshold_price": 1000},
            },
            "отслеживай цену сыворотки",
        )

    assert action.action_type == "start_price_tracking"
    assert action.payload["product_id"]
    assert action.payload["threshold_price"] == 1000
    assert "product_external_key" not in action.payload


async def test_user_data_export_and_account_delete(client: AsyncClient):
    export = await client.get("/api/v1/profile/data/export")
    assert export.status_code == 200
    payload = export.json()
    assert payload["user"]["telegram_user_id"] == 1000001
    assert payload["profile"]["skin_type"] == "Комбинированная кожа"
    assert len(payload["routine_plans"]) >= 1
    assert "pending_actions" in payload

    deleted = await client.delete("/api/v1/profile/account")
    assert deleted.status_code == 200
    assert deleted.json()["status"] == "deleted"

    me = await client.get("/api/v1/me")
    assert me.status_code == 401

    products = await client.get("/api/v1/products")
    assert products.status_code == 200
    assert len(products.json()) >= 1
