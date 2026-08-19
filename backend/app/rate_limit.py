"""Endpoint-specific abuse protection with Redis coordination and a local safety fallback."""
from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.cache import cache


class RateLimitMiddleware(BaseHTTPMiddleware):
    policies = {
        "/api/v1/bookings": (8, 600),
        "/api/v1/admin/auth/login": (5, 600),
        "/api/v1/admin/auth/refresh": (10, 600),
    }

    async def dispatch(self, request: Request, call_next):
        policy = self.policies.get(request.url.path)
        if request.method == "OPTIONS" or policy is None:
            return await call_next(request)
        client_ip = request.client.host if request.client else "unknown"
        limit, window = policy
        allowed, retry_after = await cache.allow_request(f"rate:{request.url.path}:{client_ip}", limit, window)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)
