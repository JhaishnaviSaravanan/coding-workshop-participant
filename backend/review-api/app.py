from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg
import os

app = FastAPI(title="Review API")


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


@app.get("/review-api")
def root():
    return {"message": "Review API working"}


@app.get("/review-api/reviews")
def get_reviews():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, employee_id, review_date, rating, feedback, goals
                    FROM performance_reviews
                    ORDER BY review_date DESC
                """)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/review-api/reviews")
def add_review(data: ReviewCreate):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
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

        return {"message": "Review added", "id": review_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))