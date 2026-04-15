"""
Employee API Lambda handler.
"""

import json
import logging
import os

from auth import generate_token, parse_body, verify_token
from postgres_service import (
    get_demo_user_by_email,
    fetch_employees,
    fetch_reviews,
    insert_review,
)
from responses import success_response, error_response
from validators import validate_login_payload, validate_review_payload

logger = logging.getLogger()
logger.setLevel(logging.INFO)

PG_CONFIG = (
    f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
    f"port={os.getenv('POSTGRES_PORT', '5432')} "
    f"user={os.getenv('POSTGRES_USER', 'postgres')} "
    f"password={os.getenv('POSTGRES_PASS', 'postgres')} "
    f"dbname={os.getenv('POSTGRES_NAME', 'employee_app')} "
    f"connect_timeout=15"
)


def _get_method(event):
    if not event:
        return None

    request_context = event.get("requestContext", {})
    http = request_context.get("http", {})
    return http.get("method") or event.get("httpMethod")


def _get_path(event):
    if not event:
        return ""

    path = event.get("rawPath") or event.get("path") or ""
    return path.rstrip("/")


def _health_response():
    return success_response(
        {
            "message": "Employee API is running",
            "service": "employee-api",
        },
        200,
    )


def _handle_login(event):
    data = parse_body(event)
    validation_error = validate_login_payload(data)
    if validation_error:
        return error_response(validation_error, 400)

    user = get_demo_user_by_email(data["email"])
    if not user or user["password"] != data["password"]:
        return error_response("Invalid credentials", 401)

    token = generate_token(user)

    return success_response(
        {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            },
        },
        200,
    )


def _handle_get_employees(event):
    auth_payload, auth_error = verify_token(event)
    if auth_error:
        return error_response(auth_error, 401)

    if auth_payload["role"] not in ["manager", "admin"]:
        return error_response("Forbidden", 403)

    employees = fetch_employees(PG_CONFIG)
    return success_response(employees, 200)


def _handle_get_reviews(event):
    auth_payload, auth_error = verify_token(event)
    if auth_error:
        return error_response(auth_error, 401)

    reviews = fetch_reviews(PG_CONFIG)

    if auth_payload["role"] in ["manager", "admin"]:
        return success_response(reviews, 200)

    filtered_reviews = [
        review for review in reviews
        if review["employee_id"] == auth_payload["user_id"]
    ]
    return success_response(filtered_reviews, 200)


def _handle_add_review(event):
    auth_payload, auth_error = verify_token(event)
    if auth_error:
        return error_response(auth_error, 401)

    if auth_payload["role"] not in ["manager", "admin"]:
        return error_response("Forbidden", 403)

    data = parse_body(event)
    validation_error = validate_review_payload(data)
    if validation_error:
        return error_response(validation_error, 400)

    review_id = insert_review(PG_CONFIG, data)
    return success_response(
        {
            "message": "Review added successfully",
            "id": review_id,
        },
        201,
    )


def handler(event=None, context=None):
    logger.info("Received event: %s", json.dumps(event or {}))
    logger.debug("Received context: %s", context)

    try:
        method = _get_method(event)
        path = _get_path(event)

        logger.info("Resolved method=%s path=%s", method, path)

        if method == "OPTIONS":
            return success_response({"message": "CORS preflight ok"}, 200)

        if path.endswith("/employee-api") and method == "GET":
            return _health_response()

        if path.endswith("/employee-api/login") and method == "POST":
            return _handle_login(event)

        if path.endswith("/employee-api/employees") and method == "GET":
            return _handle_get_employees(event)

        if path.endswith("/employee-api/reviews") and method == "GET":
            return _handle_get_reviews(event)

        if path.endswith("/employee-api/reviews") and method == "POST":
            return _handle_add_review(event)

        return error_response("Route not found", 404)

    except Exception as exc:
        logger.exception("Handler error: %s", str(exc))
        return error_response("Internal server error", 500)


if __name__ == "__main__":
    print(handler({
        "httpMethod": "GET",
        "path": "/api/employee-api",
        "headers": {},
    }))