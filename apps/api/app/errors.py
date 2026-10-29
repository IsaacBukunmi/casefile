"""One error format for every failure, so the frontend handles all errors the same way."""

import logging
import secrets

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas import ApiError, ErrorCode, FieldError

logger = logging.getLogger("casefile.api")

# Documents the error responses in the OpenAPI schema, so generated types know their shape.
ERROR_RESPONSES: dict[int | str, dict[str, object]] = {
    404: {"model": ApiError, "description": "Not found"},
    422: {"model": ApiError, "description": "Validation error"},
    500: {"model": ApiError, "description": "Unexpected error"},
}

_CODES_BY_STATUS = {
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    422: ErrorCode.VALIDATION_ERROR,
}


class ApiException(Exception):
    """Raise from any endpoint to return a specific error."""

    def __init__(self, status_code: int, code: ErrorCode, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class NotFound(ApiException):
    def __init__(self, resource: str) -> None:
        super().__init__(404, ErrorCode.NOT_FOUND, f"{resource} not found")


def new_reference() -> str:
    token = secrets.token_hex(3).upper()  # 6 random hex characters, e.g. "4F1A02"
    return f"CF-{token[:4]}-{token[4:]}"


def _error_response(
    status_code: int,
    code: ErrorCode,
    message: str,
    details: list[FieldError] | None = None,
    reference: str | None = None,
) -> JSONResponse:
    body = ApiError(
        code=code,
        message=message,
        reference=reference or new_reference(),
        details=details,
    )
    return JSONResponse(status_code=status_code, content=jsonable_encoder(body))


async def handle_api_exception(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, ApiException)
    return _error_response(exc.status_code, exc.code, exc.message)


async def handle_validation_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    details = [
        FieldError(field=".".join(str(part) for part in error["loc"]), message=error["msg"])
        for error in exc.errors()
    ]
    return _error_response(422, ErrorCode.VALIDATION_ERROR, "Some fields are invalid", details)


async def handle_http_exception(_: Request, exc: Exception) -> JSONResponse:
    # Raised by FastAPI itself, e.g. an unknown URL (404) or the wrong HTTP method (405).
    assert isinstance(exc, StarletteHTTPException)
    code = _CODES_BY_STATUS.get(exc.status_code, ErrorCode.BAD_REQUEST)
    return _error_response(exc.status_code, code, str(exc.detail))


async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    # Full details go to the server log; the client only gets a generic message and a reference.
    # Logging the same reference lets support find this exact error from a user's screenshot.
    reference = new_reference()
    logger.exception("Unhandled error %s", reference, exc_info=exc)
    return _error_response(
        500, ErrorCode.INTERNAL_ERROR, "Something went wrong", reference=reference
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ApiException, handle_api_exception)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    app.add_exception_handler(Exception, handle_unexpected_error)
