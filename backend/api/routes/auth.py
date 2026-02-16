"""
Email OTP Authentication Routes — backed by Supabase
Persists OTPs, sessions, users, and activity logs to database
"""
import random
import time
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, Dict

from core.db import get_db
from core.email_service import send_otp_email

router = APIRouter()

OTP_EXPIRY_SECONDS = 300  # 5 minutes


class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class AuthResponse(BaseModel):
    token: str
    email: str


def _log_activity(action: str, email: str = None, details: dict = None, ip: str = None):
    """Log activity to Supabase"""
    try:
        db = get_db()
        db.table("activity_logs").insert({
            "action": action,
            "email": email,
            "details": details or {},
            "ip_address": ip
        }).execute()
    except Exception as e:
        print(f"⚠️ Activity log error: {e}")


@router.post("/send-otp")
async def send_otp(data: SendOTPRequest, request: Request):
    """Send OTP to email — persists to Supabase and emails the user"""
    db = get_db()
    email = data.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=OTP_EXPIRY_SECONDS)
    client_ip = request.client.host if request.client else None

    # Store OTP in database
    db.table("otp_logs").insert({
        "email": email,
        "otp_code": otp,
        "status": "sent",
        "ip_address": client_ip,
        "expires_at": expires_at.isoformat()
    }).execute()

    # Send OTP via email (falls back to console if SMTP not configured)
    email_sent = send_otp_email(email, otp)

    # Always print to console as backup
    print("\n" + "=" * 50)
    print(f"📧 OTP for {email}: {otp}")
    print(f"✉️  Email sent: {'Yes' if email_sent else 'No (SMTP not configured)'}")
    print(f"⏰ Expires in {OTP_EXPIRY_SECONDS // 60} minutes")
    print("=" * 50 + "\n")

    _log_activity("otp_sent", email, {"otp_code": otp, "email_sent": email_sent}, client_ip)

    if not email_sent:
         raise HTTPException(status_code=500, detail="Failed to send email. Please contact support or try again later.")

    return {
        "success": True,
        "message": f"OTP sent to {email}"
    }


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(data: VerifyOTPRequest, request: Request):
    """Verify OTP and return session token — persists to Supabase"""
    db = get_db()
    email = data.email.strip().lower()
    otp = data.otp.strip()
    client_ip = request.client.host if request.client else None

    # Find latest OTP for this email
    result = (
        db.table("otp_logs")
        .select("*")
        .eq("email", email)
        .eq("status", "sent")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        _log_activity("otp_verify_failed", email, {"reason": "no_otp_found"}, client_ip)
        raise HTTPException(status_code=400, detail="No OTP found for this email. Please request a new one.")

    otp_record = result.data[0]
    otp_id = otp_record["id"]

    # Check expiry
    expires_at = datetime.fromisoformat(otp_record["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        db.table("otp_logs").update({"status": "expired"}).eq("id", otp_id).execute()
        _log_activity("otp_verify_failed", email, {"reason": "expired"}, client_ip)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Check OTP match
    if otp_record["otp_code"] != otp:
        _log_activity("otp_verify_failed", email, {"reason": "invalid_code"}, client_ip)
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    # Mark OTP as verified
    db.table("otp_logs").update({
        "status": "verified",
        "verified_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", otp_id).execute()

    # Upsert user
    user_result = db.table("users").select("*").eq("email", email).execute()
    if user_result.data:
        user = user_result.data[0]
        db.table("users").update({
            "login_count": user["login_count"] + 1,
            "last_login_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", user["id"]).execute()
        user_id = user["id"]
    else:
        new_user = db.table("users").insert({
            "email": email,
            "role": "user",
            "login_count": 1,
            "last_login_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        user_id = new_user.data[0]["id"]

    # Create session
    token = str(uuid.uuid4())
    db.table("sessions").insert({
        "user_id": user_id,
        "token": token,
        "email": email,
        "ip_address": client_ip,
        "is_active": True,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    }).execute()

    _log_activity("login", email, {"user_id": user_id}, client_ip)

    return AuthResponse(token=token, email=email)


@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user from session token — reads from Supabase"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "").strip()
    db = get_db()

    result = db.table("sessions").select("*").eq("token", token).eq("is_active", True).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    session = result.data[0]
    
    # Check expiry
    expires_at = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        db.table("sessions").update({"is_active": False}).eq("id", session["id"]).execute()
        raise HTTPException(status_code=401, detail="Session expired")

    # Update last activity
    db.table("sessions").update({
        "last_activity_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session["id"]).execute()

    # Get user role
    user_result = db.table("users").select("role").eq("email", session["email"]).execute()
    role = user_result.data[0]["role"] if user_result.data else "user"

    return {
        "email": session["email"],
        "role": role,
        "authenticated": True
    }


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None), request: Request = None):
    """Logout — deactivate session in Supabase"""
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        db = get_db()

        result = db.table("sessions").select("email").eq("token", token).execute()
        email = result.data[0]["email"] if result.data else None

        db.table("sessions").update({"is_active": False}).eq("token", token).execute()

        client_ip = request.client.host if request and request.client else None
        _log_activity("logout", email, {}, client_ip)

    return {"success": True, "message": "Logged out"}
