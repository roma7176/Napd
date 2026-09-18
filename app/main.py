import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.api.endpoints import router as evaluation_router

app = FastAPI(
    title="Nabd Backend API",
    description="Backend service for Nabd Clinical Reasoning Evaluation Engine",
    version="1.0.0"
)

origins = [
    "https://nabd-app.vercel.app",  # رابط الفرونت إند على Vercel
    "http://localhost:3000",
    "http://localhost:5173",
    "*",                            # للسماح بجميع المصادر أثناء التست
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "حدث خطأ غير متوقع في السيرفر الداخلي",
            "detail": str(exc)
        },
    )

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "Nabd Backend"}

app.include_router(evaluation_router, prefix="/api/v1")
