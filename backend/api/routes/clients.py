"""
Clients API Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models.schemas import (
    ClientCreate, ClientResponse,
    GSTINCreate, GSTINResponse
)
from services.supabase_service import get_supabase_service, SupabaseService


router = APIRouter()


@router.get("/", response_model=List[ClientResponse])
async def list_clients(
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get all clients accessible by the current user"""
    # TODO: Get user_id from auth
    user_id = "system"
    clients = await supabase.get_clients(user_id)
    return [ClientResponse(**c) for c in clients]


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get a single client by ID"""
    client = await supabase.get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return ClientResponse(**client)


@router.post("/", response_model=ClientResponse)
async def create_client(
    data: ClientCreate,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Create a new client"""
    try:
        # TODO: Get user_id from auth
        user_id = "system"
        client = await supabase.create_client(data.model_dump(), user_id)
        return ClientResponse(**client)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{client_id}/gstins", response_model=List[GSTINResponse])
async def list_client_gstins(
    client_id: str,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get all GSTINs for a client"""
    gstins = await supabase.get_gstins_for_client(client_id)
    return [GSTINResponse(**g) for g in gstins]


@router.post("/{client_id}/gstins", response_model=GSTINResponse)
async def create_gstin(
    client_id: str,
    data: GSTINCreate,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Add a GSTIN to a client"""
    try:
        gstin_data = data.model_dump()
        gstin_data["client_id"] = client_id
        gstin = await supabase.create_gstin(gstin_data)
        return GSTINResponse(**gstin)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
