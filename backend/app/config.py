"""
Central configuration, loaded from environment variables (.env file).
Never hardcode secrets or the DB URL directly in code.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "student_helpdesk"

    JWT_SECRET_KEY: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # ---- Optional AI assistance (off by default) -------------------------
    # With AI_ENABLED=false (or no key) the chatbot behaves exactly as before:
    # pure NLP FAQ matching. See AI_SETUP.md.
    AI_ENABLED: bool = False
    AI_PROVIDER: str = "anthropic"      # "anthropic" or "openai" (OpenAI-compatible)
    AI_API_KEY: str = ""                # secret: lives only in backend/.env
    AI_MODEL: str = ""                  # empty = a sensible default per provider
    AI_BASE_URL: str = ""               # empty = the provider's official URL
    AI_TIMEOUT_SECONDS: float = 15.0
    AI_MAX_CALLS_PER_MINUTE: int = 10   # per client IP; protects your API credit
    AI_CONTEXT_FAQS: int = 25           # max FAQ entries sent to the AI per question

    class Config:
        env_file = ".env"


settings = Settings()
