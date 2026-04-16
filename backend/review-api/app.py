from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import psycopg
import jwt
import os

app = FastAPI(title="Review API")

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


def get_db():
    return psycopg.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASS", "postgres"),
        dbname=os.getenv("POSTGRES_NAME", "postgres")
    )


class ReviewCreate(BaseModel):
    employee_id: int
    review_date: str
    rating: int
    feedback: str
    goals: str


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


@app.get("/review-api")
def root():
    return {"message": "Review API working"}


@app.get("/review-api/reviews")
def get_reviews(authorization: str = Header(None)):
    user = get_current_user(authorization)
    role = user["role"]
    actor_employee_id = user["employee_id"]

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                if role == "admin":
                    cur.execute("""
                        SELECT id, employee_id, review_date, rating, feedback, goals
                        FROM performance_reviews
                        ORDER BY review_date DESC, id DESC
                    """)
                elif role == "hr":
                    cur.execute("""
                        SELECT id, employee_id, review_date, rating, feedback, goals
                        FROM performance_reviews
                        ORDER BY review_date DESC, id DESC
                    """)
                elif role == "manager":
                    cur.execute("""
                        SELECT pr.id, pr.employee_id, pr.review_date, pr.rating, pr.feedback, pr.goals
                        FROM performance_reviews pr
                        JOIN employees e ON pr.employee_id = e.id
                        WHERE e.manager_id = %s
                        ORDER BY pr.review_date DESC, pr.id DESC
                    """, (actor_employee_id,))
                elif role == "employee":
                    cur.execute("""
                        SELECT id, employee_id, review_date, rating, feedback, goals
                        FROM performance_reviews
                        WHERE employee_id = %s
                        ORDER BY review_date DESC, id DESC
                    """, (actor_employee_id,))
                else:
                    raise HTTPException(status_code=403, detail="Access denied")

                rows = cur.fetchall()

        return [
            {
                "id": r[0],
                "employee_id": r[1],
                "review_date": str(r[2]),
                "rating": r[3],
                "feedback": r[4],
                "goals": r[5]
            }
            for r in rows
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/review-api/reviews")
def add_review(data: ReviewCreate, authorization: str = Header(None)):
    user = get_current_user(authorization)
    role = user["role"]
    actor_employee_id = user["employee_id"]

    # Matrix: admin full, hr read only, manager team rw, employee self read only
    if role == "hr":
        raise HTTPException(status_code=403, detail="HR has read-only access to reviews")

    if role == "employee":
        raise HTTPException(status_code=403, detail="Employees cannot create reviews")

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                if role == "manager":
                    cur.execute("""
                        SELECT manager_id
                        FROM employees
                        WHERE id = %s
                    """, (data.employee_id,))
                    row = cur.fetchone()

                    if not row:
                        raise HTTPException(status_code=404, detail="Employee not found")

                    if row[0] != actor_employee_id:
                        raise HTTPException(status_code=403, detail="Managers can only review their own team")

                cur.execute("""
                    INSERT INTO performance_reviews
                    (employee_id, review_date, rating, feedback, goals)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    data.employee_id,
                    data.review_date,
                    data.rating,
                    data.feedback,
                    data.goals
                ))
                review_id = cur.fetchone()[0]
            conn.commit()

        return {"message": "Review added successfully", "id": review_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))