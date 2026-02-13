"""
Admin Panel API Routes
Provides endpoints for monitoring all system activity
"""
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional
from core.db import get_db

router = APIRouter()


def _require_admin(authorization: Optional[str] = None):
    """Check that the caller is an admin user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "").strip()
    db = get_db()

    # Check session
    session = db.table("sessions").select("email").eq("token", token).eq("is_active", True).execute()
    if not session.data:
        raise HTTPException(status_code=401, detail="Invalid session")

    email = session.data[0]["email"]

    # Check admin role
    user = db.table("users").select("role").eq("email", email).execute()
    if not user.data or user.data[0]["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return email


@router.get("/dashboard")
async def admin_dashboard(authorization: Optional[str] = Header(None)):
    """Get dashboard stats — total users, sessions, OTPs, reconciliations"""
    _require_admin(authorization)
    db = get_db()

    users = db.table("users").select("id", count="exact").execute()
    active_sessions = db.table("sessions").select("id", count="exact").eq("is_active", True).execute()
    otps_today = db.table("otp_logs").select("id", count="exact").gte("created_at", "today").execute()
    reconciliations = db.table("reconciliation_runs").select("id", count="exact").execute()
    recent_activity = (
        db.table("activity_logs")
        .select("id", count="exact")
        .gte("created_at", "today")
        .execute()
    )

    return {
        "total_users": users.count or 0,
        "active_sessions": active_sessions.count or 0,
        "otps_today": otps_today.count or 0,
        "total_reconciliations": reconciliations.count or 0,
        "activity_today": recent_activity.count or 0
    }


@router.get("/activity")
async def get_activity_logs(
    authorization: Optional[str] = Header(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None)
):
    """Get paginated activity logs"""
    _require_admin(authorization)
    db = get_db()

    query = db.table("activity_logs").select("*", count="exact")

    if action:
        query = query.eq("action", action)

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    return {
        "data": result.data,
        "total": result.count or 0,
        "limit": limit,
        "offset": offset
    }


@router.get("/otps")
async def get_otp_logs(
    authorization: Optional[str] = Header(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Get all OTP logs — shows code, email, status, timestamps"""
    _require_admin(authorization)
    db = get_db()

    result = (
        db.table("otp_logs")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "data": result.data,
        "total": result.count or 0,
        "limit": limit,
        "offset": offset
    }


@router.get("/users")
async def get_users(
    authorization: Optional[str] = Header(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Get all registered users"""
    _require_admin(authorization)
    db = get_db()

    result = (
        db.table("users")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "data": result.data,
        "total": result.count or 0,
        "limit": limit,
        "offset": offset
    }


@router.get("/reconciliations")
async def get_reconciliations(
    authorization: Optional[str] = Header(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Get all reconciliation runs"""
    _require_admin(authorization)
    db = get_db()

    result = (
        db.table("reconciliation_runs")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "data": result.data,
        "total": result.count or 0,
        "limit": limit,
        "offset": offset
    }


@router.get("/sessions")
async def get_sessions(
    authorization: Optional[str] = Header(None),
    active_only: bool = Query(True)
):
    """Get all sessions"""
    _require_admin(authorization)
    db = get_db()

    query = db.table("sessions").select("*", count="exact")
    if active_only:
        query = query.eq("is_active", True)

    result = query.order("created_at", desc=True).limit(100).execute()

    return {
        "data": result.data,
        "total": result.count or 0
    }
