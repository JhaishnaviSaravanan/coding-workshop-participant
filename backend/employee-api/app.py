from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import psycopg
import jwt
import os

app = FastAPI(title="Employee API")

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


def get_connection():
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


class EmployeeCreate(BaseModel):
    name: str
    email: str
    department: str
    role: str
    team: str
    manager_id: int | None = None


@app.get("/employee-api")
def health():
    return {"message": "Employee API is running", "service": "employee-api"}


@app.get("/employee-api/employees")
def get_employees(authorization: str = Header(None)):
    user = get_current_user(authorization)
    role = user["role"]
    actor_employee_id = user["employee_id"]

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                if role == "admin":
                    cur.execute("""
                        SELECT id, name, email, department, role, team, manager_id
                        FROM employees
                        ORDER BY id
                    """)
                elif role == "hr":
                    cur.execute("""
                        SELECT id, name, email, department, role, team, manager_id
                        FROM employees
                        ORDER BY id
                    """)
                elif role == "manager":
                    cur.execute("""
                        SELECT id, name, email, department, role, team, manager_id
                        FROM employees
                        WHERE manager_id = %s OR id = %s
                        ORDER BY id
                    """, (actor_employee_id, actor_employee_id))
                elif role == "employee":
                    cur.execute("""
                        SELECT id, name, email, department, role, team, manager_id
                        FROM employees
                        WHERE id = %s
                    """, (actor_employee_id,))
                else:
                    raise HTTPException(status_code=403, detail="Access denied")

                rows = cur.fetchall()

        return [
            {
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "department": row[3],
                "role": row[4],
                "team": row[5],
                "manager_id": row[6],
            }
            for row in rows
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/employee-api/employees")
def create_employee(data: EmployeeCreate, authorization: str = Header(None)):
    user = get_current_user(authorization)

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create employees")

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO employees (name, email, department, role, team, manager_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    data.name,
                    data.email,
                    data.department,
                    data.role,
                    data.team,
                    data.manager_id
                ))
                employee_id = cur.fetchone()[0]
            conn.commit()

        return {"message": "Employee created successfully", "employee_id": employee_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")