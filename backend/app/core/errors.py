"""Shared API error shape."""

from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def error_body(code: str, message: str) -> dict[str, Any]:
    return {"error": {"code": code, "message": message}}


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(exc.code, exc.message),
    )


async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    messages = []
    for err in exc.errors():
        loc = ".".join(str(part) for part in err.get("loc", ()))
        messages.append(f"{loc}: {err.get('msg')}")
    detail = "; ".join(messages) if messages else "Validation failed."
    return JSONResponse(
        status_code=422,
        content=error_body("VALIDATION_ERROR", detail),
    )
