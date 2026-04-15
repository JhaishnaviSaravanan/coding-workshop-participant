from psycopg import connect

PG_CONN = None


def get_connection(config):
    global PG_CONN

    try:
        if PG_CONN is None or PG_CONN.closed:
            PG_CONN = connect(config)
        return PG_CONN
    except Exception:
        PG_CONN = None
        raise


def fetch_employees(config):
    conn = get_connection(config)

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, full_name, email, department, designation, location, manager_name
                FROM employees
                ORDER BY id;
            """)
            rows = cur.fetchall()

        return [
            {
                "id": r[0],
                "full_name": r[1],
                "email": r[2],
                "department": r[3],
                "designation": r[4],
                "location": r[5],
                "manager_name": r[6],
            }
            for r in rows
        ]

    except Exception:
        global PG_CONN
        PG_CONN = None
        raise


def fetch_reviews(config):
    conn = get_connection(config)

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, employee_id, review_date, rating, feedback, goals
                FROM performance_reviews
                ORDER BY review_date DESC;
            """)
            rows = cur.fetchall()

        return [
            {
                "id": r[0],
                "employee_id": r[1],
                "review_date": str(r[2]),
                "rating": r[3],
                "feedback": r[4],
                "goals": r[5],
            }
            for r in rows
        ]

    except Exception:
        global PG_CONN
        PG_CONN = None
        raise


def insert_review(config, data):
    conn = get_connection(config)

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO performance_reviews (employee_id, review_date, rating, feedback, goals)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                int(data["employee_id"]),
                data["review_date"],
                int(data["rating"]),
                data["feedback"],
                data["goals"],
            ))

            review_id = cur.fetchone()[0]

        conn.commit()
        return review_id

    except Exception:
        conn.rollback()
        global PG_CONN
        PG_CONN = None
        raise


def get_demo_user_by_email(email):
    demo_users = {
        "manager@acme.com": {
            "id": 1,
            "name": "Manager",
            "email": "manager@acme.com",
            "password": "password",
            "role": "manager",
        },
        "employee@acme.com": {
            "id": 2,
            "name": "Employee",
            "email": "employee@acme.com",
            "password": "password",
            "role": "employee",
        },
    }

    return demo_users.get(email)