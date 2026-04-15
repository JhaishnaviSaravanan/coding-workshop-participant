import json


def _headers():
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }


def success_response(body=None, status_code=200):
    return {
        "statusCode": status_code,
        "headers": _headers(),
        "body": json.dumps(body if body is not None else {}),
    }


def error_response(message, status_code=400):
    return {
        "statusCode": status_code,
        "headers": _headers(),
        "body": json.dumps({"error": message}),
    }