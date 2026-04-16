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
                    SELECT id, full_name, email, department, designation, location, manager_name
                    FROM employees
                    ORDER BY id;
                """)
                rows = cur.fetchall()

        return [
            {
                "id": row[0],
                "full_name": row[1],
                "email": row[2],
                "department": row[3],
                "designation": row[4],
                "location": row[5],
                "manager_name": row[6],
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")