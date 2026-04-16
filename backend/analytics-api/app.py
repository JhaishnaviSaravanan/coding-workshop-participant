from fastapi import FastAPI, HTTPException
import psycopg
import os

app = FastAPI(title="Analytics API")


def get_db():
    return psycopg.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASS", "postgres"),
        dbname=os.getenv("POSTGRES_NAME", "postgres")
    )


@app.get("/analytics-api")
def root():
    return {"message": "Analytics API working"}


@app.get("/analytics-api/high-potential")
def get_high_potential():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        e.id,
                        e.name,
                        AVG(pr.rating) AS avg_rating,
                        COUNT(pr.id) AS review_count
                    FROM employees e
                    JOIN performance_reviews pr ON e.id = pr.employee_id
                    GROUP BY e.id, e.name
                    HAVING AVG(pr.rating) >= 4
                    ORDER BY avg_rating DESC
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
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics-api/skill-gaps")
def get_skill_gaps():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        e.id,
                        e.name,
                        c.skill,
                        c.current_level,
                        c.required_level
                    FROM employees e
                    JOIN competencies c ON e.id = c.employee_id
                    WHERE c.current_level < c.required_level
                    ORDER BY e.id, c.skill
                """)
                rows = cur.fetchall()

        return [
            {
                "employee_id": row[0],
                "name": row[1],
                "skill": row[2],
                "current_level": row[3],
                "required_level": row[4],
                "gap": row[4] - row[3]
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics-api/attrition-risk")
def get_attrition_risk():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        e.id,
                        e.name,
                        MIN(pr.rating) AS lowest_rating,
                        MAX(pr.rating) AS highest_rating,
                        AVG(pr.rating) AS avg_rating
                    FROM employees e
                    JOIN performance_reviews pr ON e.id = pr.employee_id
                    GROUP BY e.id, e.name
                    HAVING MIN(pr.rating) <= 2
                    ORDER BY avg_rating ASC
                """)
                rows = cur.fetchall()

        return [
            {
                "employee_id": row[0],
                "name": row[1],
                "lowest_rating": row[2],
                "highest_rating": row[3],
                "avg_rating": float(row[4]),
                "risk_status": "At Risk"
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics-api/skill-distribution")
def get_skill_distribution():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        skill,
                        COUNT(*) AS employee_count
                    FROM competencies
                    GROUP BY skill
                    ORDER BY employee_count DESC, skill
                """)
                rows = cur.fetchall()

        return [
            {
                "skill": row[0],
                "employee_count": row[1]
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics-api/team-performance")
def get_team_performance():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        e.team,
                        AVG(pr.rating) AS avg_team_rating,
                        COUNT(pr.id) AS total_reviews
                    FROM employees e
                    JOIN performance_reviews pr ON e.id = pr.employee_id
                    GROUP BY e.team
                    ORDER BY avg_team_rating DESC
                """)
                rows = cur.fetchall()

        return [
            {
                "team": row[0],
                "avg_team_rating": float(row[1]),
                "total_reviews": row[2]
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))