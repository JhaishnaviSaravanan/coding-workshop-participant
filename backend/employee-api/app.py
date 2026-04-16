from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Employee API running (root)"}


@app.get("/employee-api")
def health():
    return {"message": "Employee API is running", "service": "employee-api"}


@app.get("/employees")
def get_employees():
    return [
        {"id": 1, "name": "Manager User"},
        {"id": 2, "name": "Employee User"}
    ]