"""Optional Redis cache with graceful degradation when a cache service is unavailable."""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from time import monotonic
from typing import Any

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.config import get_settings

logger = logging.getLogger("brightnest.cache")
settings = get_settings()


class Cache:
    def __init__(self) -> None:
        self._client: Redis | None = Redis.from_url(settings.redis_url, decode_responses=True) if settings.redis_url else None
        self._local: dict[str, tuple[float, str]] = {}
        self._local_limits: dict[str, list[float]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def get_json(self, key: str) -> dict[str, Any] | None:
        if self._client:
            try:
                value = await self._client.get(key)
                return json.loads(value) if value else None
            except (RedisError, json.JSONDecodeError):
                logger.warning("Redis read failed; continuing without distributed cache")
        local = self._local.get(key)
        if local and local[0] > monotonic():
            return json.loads(local[1])
        return None

    async def set_json(self, key: str, value: dict[str, Any], ttl_seconds: int) -> None:
        serialized = json.dumps(value, default=str)
        if self._client:
            try:
                await self._client.set(key, serialized, ex=ttl_seconds)
                return
            except RedisError:
                logger.warning("Redis write failed; using process-local cache")
        self._local[key] = (monotonic() + ttl_seconds, serialized)

    async def get_booking_version(self) -> int:
        key = "bookings:cache-version"
        if self._client:
            try:
                value = await self._client.get(key)
                return int(value or 0)
            except (RedisError, ValueError):
                logger.warning("Redis version read failed; using local cache version")
        return 0

    async def bump_booking_version(self) -> None:
        if self._client:
            try:
                await self._client.incr("bookings:cache-version")
            except RedisError:
                logger.warning("Redis version increment failed")

    async def allow_request(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        if self._client:
            try:
                count = await self._client.incr(key)
                if count == 1:
                    await self._client.expire(key, window_seconds)
                ttl = await self._client.ttl(key)
                return count <= limit, max(ttl, 1)
            except RedisError:
                logger.warning("Redis rate limiter failed; using local fallback")
        now = monotonic()
        async with self._lock:
            bucket = [stamp for stamp in self._local_limits[key] if stamp > now - window_seconds]
            if len(bucket) >= limit:
                self._local_limits[key] = bucket
                retry = max(1, int(window_seconds - (now - bucket[0])))
                return False, retry
            bucket.append(now)
            self._local_limits[key] = bucket
        return True, window_seconds


cache = Cache()
