"""
Finto GST Reconciliation Backend Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App
    app_name: str = "Finto GST Reconciliation API"
    debug: bool = False
    
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""  # Service role key for backend
    supabase_anon_key: str = ""  # Anon key for frontend
    
    # PostgreSQL Direct Connection
    database_url: str = "postgresql://postgres:Rajyaguru@2004@db.tijxtoodrtzdvawdrxnz.supabase.co:5432/postgres"
    
    # Groq AI
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    
    # Redis (for Celery)
    redis_url: str = "redis://localhost:6379/0"
    
    # Email / SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Finto"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "https://finto-ai-gst-reconciliation.vercel.app"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
