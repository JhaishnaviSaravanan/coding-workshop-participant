from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg
import jwt
import os
from datetime import datetime, timedelta

app = FastAPI(title="Auth API")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 8


def get_db():
    return psycopg.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASS", "postgres"),
        dbname=os.getenv("POSTGRES_NAME", "postgres")
    )


class LoginRequest(BaseModel):
    email: str
    password: str


@app.get("/auth-api")
def root():
    return {"message": "Auth API working"}


@app.post("/auth-api/login")
def login(data: LoginRequest):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        u.employee_id,
                        u.password,
                        u.role,
                        e.name,
                        e.email,
                        e.manager_id,
                        e.team
                    FROM users u
                    JOIN employees e ON u.employee_id = e.id
                    WHERE e.email = %s
                """, (data.email,))
                row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        employee_id, stored_password, role, name, email, manager_id, team = row

        if data.password != stored_password:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        payload = {
            "employee_id": employee_id,
            "role": role,
            "name": name,
            "email": email,
            "manager_id": manager_id,
            "team": team,
            "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "employee_id": employee_id,
                "name": name,
                "email": email,
                "role": role,
                "manager_id": manager_id,
                "team": team
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))