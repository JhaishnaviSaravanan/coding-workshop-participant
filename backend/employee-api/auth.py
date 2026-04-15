import os
import time
import json
import jwt

JWT_SECRET = os.getenv("JWT_SECRET", "secret")
JWT_ALGORITHM = "HS256"


def parse_body(event):
    body = event.get("body")

    if not body:
        return {}

    if isinstance(body, dict):
        return body

    try:
        return json.loads(body)
    except:
        return {}


def generate_token(user):
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + 3600 * 8,
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def extract_token(event):
    headers = event.get("headers") or {}
    auth = headers.get("Authorization") or headers.get("authorization")

    if not auth or not auth.startswith("Bearer "):
        return None

    return auth.split(" ")[1]


def verify_token(event):
    token = extract_token(event)

    if not token:
        return None, "Missing token"

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload, None
    except Exception:
        return None, "Invalid or expired token"