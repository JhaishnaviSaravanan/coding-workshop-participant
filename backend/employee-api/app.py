import os
from fastapi import FastAPI, HTTPException
from psycopg import connect

app = FastAPI(title="Employee API")

PG_CONFIG = (
    f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
    f"port={os.getenv('POSTGRES_PORT', '5432')} "
    f"user={os.getenv('POSTGRES_USER', 'postgres')} "
    f"password={os.getenv('POSTGRES_PASS', 'postgres')} "
    f"dbname={os.getenv('POSTGRES_NAME', 'employee_app')} "
    f"connect_timeout=15"
)

def get_connection():
    return connect(PG_CONFIG)

@app.get("/")
def root():
    return {"message": "Employee API is running", "service": "employee-api"}

@app.get("/employee-api")
def health():
    return {"message": "Employee API is running", "service": "employee-api"}

@app.get("/employee-api/employees")
def get_employees():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, name, email, department, role, team, manager_id
                    FROM employees
                    ORDER BY id;
                """)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/employee-api/debug-db")
def debug_db():
    return {
        "POSTGRES_HOST": os.getenv("POSTGRES_HOST"),
        "POSTGRES_PORT": os.getenv("POSTGRES_PORT"),
        "POSTGRES_NAME": os.getenv("POSTGRES_NAME"),
        "POSTGRES_USER": os.getenv("POSTGRES_USER"),
    }
    
@app.get("/employee-api/reviews")
def get_reviews():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, employee_id, review_date, rating, feedback, goals
                    FROM performance_reviews
                    ORDER BY review_date DESC;
                """)
                rows = cur.fetchall()

        return [
            {
                "id": row[0],
                "employee_id": row[1],
                "review_date": str(row[2]),
                "rating": row[3],
                "feedback": row[4],
                "goals": row[5],
            }
            for row in rows
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/employee-api/analytics/high-potential")
def get_high_potential():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        e.id,
                        e.full_name,
                        AVG(pr.rating) AS avg_rating,
                        COUNT(pr.id) AS review_count
                    FROM employees e
                    JOIN performance_reviews pr ON e.id = pr.employee_id
                    GROUP BY e.id, e.full_name
                    HAVING AVG(pr.rating) >= 4
                    ORDER BY avg_rating DESC;
                """)
                rows = cur.fetchall()

        return [
            {
                "employee_id": row[0],
                "name": row[1],
                "avg_rating": float(row[2]),
                "review_count": row[3],
                "status": "High Potential"
            }
            for row in rows
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")