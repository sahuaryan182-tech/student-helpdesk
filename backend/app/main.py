"""
FastAPI application entrypoint.

Run with:  uvicorn app.main:app --reload
"""
import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.models.collections import create_indexes
from app.utils.seed_data import seed_faqs_if_empty
from app.routes import auth, faqs, chat, admin, ai

logger = logging.getLogger("student_helpdesk")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await create_indexes()
    await seed_faqs_if_empty()
    if settings.AI_ENABLED and not settings.AI_API_KEY.strip():
        logger.warning("AI_ENABLED is true but AI_API_KEY is empty - AI features stay OFF.")
    yield
    await close_mongo_connection()


app = FastAPI(
    title="AI-Based Student Helpdesk Chatbot API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = [err["msg"] for err in exc.errors()]
    return JSONResponse(status_code=422, content={"error": "Invalid request data", "details": messages})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    return JSONResponse(status_code=500, content={"error": "Something went wrong on the server. Please try again."})


@app.get("/")
def root():
    return {"message": "Student Helpdesk API is running"}


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "student-helpdesk-backend"}


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(faqs.router, prefix="/api/faqs", tags=["faqs"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
