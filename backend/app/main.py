"""Application entry point for the BrightNest FastAPI service."""
from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.rate_limit import RateLimitMiddleware
from app.routers import auth, bookings

settings = get_settings()
logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("brightnest.api")


def create_app() -> FastAPI:
    app = FastAPI(
        title="BrightNest Booking API",
        version="1.0.0",
        docs_url="/docs" if settings.enable_docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.enable_docs else None,
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled server error request_id=%s", request_id)
            response = JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store" if request.url.path.startswith(settings.api_prefix) else "public, max-age=60"
        return response

    @app.exception_handler(RequestValidationError)
    async def request_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": "Request validation failed", "errors": exc.errors()},
        )

    @app.get("/health", tags=["operational"])
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "brightnest-api"}

    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(bookings.router, prefix=settings.api_prefix)

    return app


app = create_app()
