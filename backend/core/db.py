"""
Supabase Database Client
Lightweight wrapper around the Supabase Python client
"""
from supabase import create_client, Client
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

_client: Optional[Client] = None


def get_db() -> Client:
    """Get or create Supabase client singleton (using service_role key)"""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
        _client = create_client(url, key)
    return _client
