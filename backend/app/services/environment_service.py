from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.schemas.care import EnvironmentContext


CITY_COORDINATES: dict[str, tuple[float, float]] = {
    "москва": (55.7558, 37.6173),
    "moscow": (55.7558, 37.6173),
    "санкт-петербург": (59.9311, 30.3609),
    "saint petersburg": (59.9311, 30.3609),
    "new york": (40.7128, -74.0060),
    "сан-франциско": (37.7749, -122.4194),
    "san francisco": (37.7749, -122.4194),
}


@dataclass(frozen=True)
class Coordinates:
    latitude: float
    longitude: float


def resolve_coordinates(city: str | None) -> Coordinates:
    normalized = (city or "Москва").strip().lower()
    lat, lon = CITY_COORDINATES.get(normalized, CITY_COORDINATES["москва"])
    return Coordinates(latitude=lat, longitude=lon)


def build_spf_hint(uv_index: int, humidity_percent: int) -> str:
    if uv_index >= 8:
        return "UV очень высокий: SPF лучше обновлять каждые 2 часа на улице."
    if uv_index >= 6:
        return "UV высокий, SPF лучше обновить днём."
    if humidity_percent < 35:
        return "Воздух сухой: держи SPF, но добавь мягкое увлажнение."
    return "SPF остаётся базовым дневным шагом."


def fallback_environment(city: str | None, reason: str = "fallback") -> EnvironmentContext:
    uv_index = 7
    humidity_percent = 48
    return EnvironmentContext(
        city=city or "Москва",
        temperature_c=26,
        uv_index=uv_index,
        humidity_percent=humidity_percent,
        spf_hint=build_spf_hint(uv_index, humidity_percent),
        source=reason,
    )


async def get_environment_context(city: str | None) -> EnvironmentContext:
    if settings.weather_provider != "open-meteo":
        return fallback_environment(city, "disabled_provider")

    coordinates = resolve_coordinates(city)
    params = {
        "latitude": coordinates.latitude,
        "longitude": coordinates.longitude,
        "current": "temperature_2m,relative_humidity_2m",
        "daily": "uv_index_max",
        "forecast_days": 1,
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=settings.weather_timeout_seconds) as client:
            response = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
            response.raise_for_status()
        payload = response.json()
        current = payload.get("current", {})
        daily = payload.get("daily", {})
        temperature = round(float(current.get("temperature_2m", 26)))
        humidity = round(float(current.get("relative_humidity_2m", 48)))
        uv_values = daily.get("uv_index_max") or [7]
        uv_index = round(float(uv_values[0] if uv_values else 7))
        return EnvironmentContext(
            city=city or "Москва",
            temperature_c=temperature,
            uv_index=uv_index,
            humidity_percent=humidity,
            spf_hint=build_spf_hint(uv_index, humidity),
            source="open-meteo",
        )
    except Exception:
        return fallback_environment(city, "open-meteo_fallback")
