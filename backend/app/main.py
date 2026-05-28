from fastapi import FastAPI

app = FastAPI(
    title="CRM VP API",
    version="0.1.0",
    description="Backend API for CRM VP"
)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "CRM VP API running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
