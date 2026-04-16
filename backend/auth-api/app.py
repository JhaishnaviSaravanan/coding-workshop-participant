from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import psycopg
import jwt
import os
from datetime import datetime, timedelta

app = FastAPI(title="Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    employee_id: int
    role: str
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

@app.post("/auth-api/users")
def create_user(data: UserCreate, authorization: str = Header(None)):
    user = get_current_user(authorization)

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create users")

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Check employee exists
                cur.execute(
                    "SELECT id FROM employees WHERE id = %s",
                    (data.employee_id,)
                )
                employee_row = cur.fetchone()

                if not employee_row:
                    raise HTTPException(status_code=404, detail="Employee not found")

                # Check if user already exists for this employee
                cur.execute(
                    "SELECT employee_id FROM users WHERE employee_id = %s",
                    (data.employee_id,)
                )
                existing_user = cur.fetchone()

                if existing_user:
                    raise HTTPException(
                        status_code=400,
                        detail="User already exists for this employee"
                    )

                # Insert user
                cur.execute("""
                    INSERT INTO users (employee_id, password, role)
                    VALUES (%s, %s, %s)
                    RETURNING employee_id
                """, (
                    data.employee_id,
                    data.password,
                    data.role
                ))
                created_employee_id = cur.fetchone()[0]

            conn.commit()

        return {
            "message": "User created successfully",
            "employee_id": created_employee_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))