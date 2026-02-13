"""
Simple Clients API using core/db.py
List, create, and delete clients stored in Supabase 'clients' table
"""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from core.db import get_db

router = APIRouter()


class ClientCreateRequest(BaseModel):
    name: str
    email: Optional[str] = None
    gstin: Optional[str] = None


@router.get("/")
async def list_clients():
    """Get all clients"""
    db = get_db()
    result = db.table("clients").select("*").eq("is_active", True).order("created_at", desc=True).execute()
    return result.data


@router.post("/")
async def create_client(
    data: ClientCreateRequest,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new client"""
    db = get_db()

    # Identify user
    user_email = "anonymous"
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        sess = db.table("sessions").select("email").eq("token", token).execute()
        if sess.data:
            user_email = sess.data[0]["email"]

    insert_data = {
        "name": data.name,
        "email": data.email,
        "gstin": data.gstin,
        "status": "not_started",
        "pending_month": "July 2024",
        "created_by": user_email,
    }

    result = db.table("clients").insert(insert_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create client")

    # Log activity
    try:
        client_ip = request.client.host if request and request.client else None
        db.table("activity_logs").insert({
            "action": "client_created",
            "email": user_email,
            "details": {"client_name": data.name, "gstin": data.gstin},
            "ip_address": client_ip
        }).execute()
    except Exception:
        pass

    return result.data[0]


@router.delete("/{client_id}")
async def delete_client(client_id: str, authorization: Optional[str] = Header(None)):
    """Soft-delete a client"""
    db = get_db()

    result = db.table("clients").update({"is_active": False}).eq("id", client_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Client not found")

    return {"success": True, "message": "Client deleted"}
