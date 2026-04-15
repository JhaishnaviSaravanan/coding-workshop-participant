def validate_login_payload(data):
    if not isinstance(data, dict):
        return "Invalid request body"

    if not data.get("email"):
        return "email is required"

    if not data.get("password"):
        return "password is required"

    return None


def validate_review_payload(data):
    if not isinstance(data, dict):
        return "Invalid request body"

    required = ["employee_id", "review_date", "rating", "feedback", "goals"]

    for field in required:
        if field not in data or data[field] in ["", None]:
            return f"{field} is required"

    try:
        rating = int(data["rating"])
    except:
        return "rating must be integer"

    if rating < 1 or rating > 5:
        return "rating must be between 1 and 5"

    return None