"""
Authentication Middleware
Validates JWT tokens from Supabase and extracts user info
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from pydantic import BaseModel
from typing import Optional
from config import get_settings

security = HTTPBearer()


class User(BaseModel):
    """Authenticated user model"""
    id: str
    email: str
    role: str = "junior_ca"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Validate JWT token and return current user.
    In production, this validates the Supabase JWT.
    """
    token = credentials.credentials
    settings = get_settings()
    
    try:
        # Create Supabase client with the user's token
        client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
        
        # Verify the token and get user
        user_response = client.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user = user_response.user
        
        # Get user role from user_roles table
        role_response = client.table("user_roles").select("role").eq("user_id", user.id).single().execute()
        role = role_response.data.get("role", "junior_ca") if role_response.data else "junior_ca"
        
        return User(
            id=user.id,
            email=user.email,
            role=role
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # For development, allow bypass with a mock user
        if settings.debug:
            return User(
                id="dev-user-id",
                email="dev@finto.in",
                role="admin"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )


def require_role(allowed_roles: list):
    """Dependency factory to require specific roles"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


# Convenience dependencies
require_admin = require_role(["admin"])
require_senior = require_role(["senior_ca", "admin"])
require_ca = require_role(["junior_ca", "senior_ca", "admin"])
