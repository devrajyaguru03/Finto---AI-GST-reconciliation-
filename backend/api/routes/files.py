"""
File Processing API Routes
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List

from models.schemas import (
    FileUploadResponse, ParsedInvoicesResponse, InvoiceCreate
)
from services.supabase_service import get_supabase_service, SupabaseService
from core.file_parser import get_file_parser, FileParser


router = APIRouter()


@router.post("/upload/purchase-register")
async def upload_purchase_register(
    run_id: str = Form(...),
    file: UploadFile = File(...),
    supabase: SupabaseService = Depends(get_supabase_service),
    parser: FileParser = Depends(get_file_parser)
):
    """
    Upload and parse a Purchase Register file (Excel/CSV).
    Parses the file and inserts invoices into the database.
    """
    try:
        # Read file content
        content = await file.read()
        file_name = file.filename or "purchase_register.xlsx"
        
        # Update run status
        await supabase.update_reconciliation_run(run_id, {
            "status": "parsing",
            "purchase_register_file": file_name
        })
        
        # Parse the file
        invoices, columns = parser.parse_purchase_register(content, file_name)
        errors = parser.get_errors()
        
        # Add run_id to invoices
        for inv in invoices:
            inv["run_id"] = run_id
        
        # Insert invoices into database
        if invoices:
            await supabase.bulk_insert_invoices(invoices)
        
        return {
            "file_name": file_name,
            "file_size": len(content),
            "rows_parsed": len(invoices),
            "columns_found": columns,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/gstr2b")
async def upload_gstr2b(
    run_id: str = Form(...),
    file: UploadFile = File(...),
    supabase: SupabaseService = Depends(get_supabase_service),
    parser: FileParser = Depends(get_file_parser)
):
    """
    Upload and parse a GSTR-2B file (Excel/CSV).
    Parses the file and inserts invoices into the database.
    """
    try:
        # Read file content
        content = await file.read()
        file_name = file.filename or "gstr2b.xlsx"
        
        # Update run status
        await supabase.update_reconciliation_run(run_id, {
            "status": "parsing",
            "gstr2b_file": file_name
        })
        
        # Parse the file
        invoices, columns = parser.parse_gstr2b(content, file_name)
        errors = parser.get_errors()
        
        # Add run_id to invoices
        for inv in invoices:
            inv["run_id"] = run_id
        
        # Insert invoices into database
        if invoices:
            await supabase.bulk_insert_invoices(invoices)
        
        return {
            "file_name": file_name,
            "file_size": len(content),
            "rows_parsed": len(invoices),
            "columns_found": columns,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preview/purchase-register")
async def preview_purchase_register(
    file: UploadFile = File(...),
    parser: FileParser = Depends(get_file_parser)
):
    """
    Preview parsing of a Purchase Register file without saving.
    Useful for column mapping verification.
    """
    try:
        content = await file.read()
        file_name = file.filename or "purchase_register.xlsx"
        
        invoices, columns = parser.parse_purchase_register(content, file_name)
        errors = parser.get_errors()
        
        # Return preview (first 10 rows)
        return {
            "columns_found": columns,
            "sample_invoices": invoices[:10],
            "total_rows": len(invoices),
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preview/gstr2b")
async def preview_gstr2b(
    file: UploadFile = File(...),
    parser: FileParser = Depends(get_file_parser)
):
    """
    Preview parsing of a GSTR-2B file without saving.
    Useful for column mapping verification.
    """
    try:
        content = await file.read()
        file_name = file.filename or "gstr2b.xlsx"
        
        invoices, columns = parser.parse_gstr2b(content, file_name)
        errors = parser.get_errors()
        
        # Return preview (first 10 rows)
        return {
            "columns_found": columns,
            "sample_invoices": invoices[:10],
            "total_rows": len(invoices),
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
