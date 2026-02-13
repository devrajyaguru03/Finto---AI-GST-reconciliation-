"""
Unified Reconciliation API
Accepts two file uploads, parses, reconciles, returns full results
Now logs to Supabase for admin visibility
"""
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Request
from typing import List, Dict, Any, Optional

from core.file_parser import get_file_parser
from core.reconciliation_engine import ReconciliationEngine
from core.db import get_db


router = APIRouter()


@router.post("/reconcile")
async def reconcile_files(
    pr_file: UploadFile = File(..., description="Purchase Register file (Excel/CSV)"),
    gstr2b_file: UploadFile = File(..., description="GSTR-2B file (Excel/CSV)"),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """
    Upload Purchase Register + GSTR-2B files, parse & reconcile in one step.
    Returns full results including stats, matched/mismatched invoices, and summary.
    """
    parser = get_file_parser()
    engine = ReconciliationEngine()
    
    try:
        # Read file contents
        pr_content = await pr_file.read()
        gstr2b_content = await gstr2b_file.read()
        
        pr_filename = pr_file.filename or "purchase_register.xlsx"
        gstr2b_filename = gstr2b_file.filename or "gstr2b.xlsx"
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading files: {str(e)}")
    
    # Parse Purchase Register
    try:
        pr_invoices, pr_columns = parser.parse_purchase_register(pr_content, pr_filename)
        pr_errors = parser.get_errors()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing Purchase Register: {str(e)}")
    
    # Parse GSTR-2B
    try:
        gstr2b_invoices, gstr2b_columns = parser.parse_gstr2b(gstr2b_content, gstr2b_filename)
        gstr2b_errors = parser.get_errors()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing GSTR-2B file: {str(e)}")
    
    if not pr_invoices:
        raise HTTPException(status_code=400, detail="No valid invoices found in Purchase Register file. Check column names.")
    
    if not gstr2b_invoices:
        raise HTTPException(status_code=400, detail="No valid invoices found in GSTR-2B file. Check column names.")
    
    # Assign IDs to invoices for matching
    for i, inv in enumerate(pr_invoices):
        inv["id"] = f"pr_{i}"
    for i, inv in enumerate(gstr2b_invoices):
        inv["id"] = f"gstr2b_{i}"
    
    # Run reconciliation
    match_results = engine.reconcile(pr_invoices, gstr2b_invoices)
    stats = engine.get_stats(match_results)
    
    # Build results with full invoice details
    results_with_details = []
    pr_map = {inv["id"]: inv for inv in pr_invoices}
    gstr2b_map = {inv["id"]: inv for inv in gstr2b_invoices}
    
    for r in match_results:
        result = {
            "id": str(uuid.uuid4()),
            "status": r.status.value,
            "confidence_score": r.confidence_score,
            "match_rule": r.match_rule,
            "taxable_diff": r.taxable_diff,
            "igst_diff": r.igst_diff,
            "cgst_diff": r.cgst_diff,
            "sgst_diff": r.sgst_diff,
            "total_diff": r.total_diff,
            "pr_invoice": _serialize_invoice(pr_map.get(r.pr_invoice_id)) if r.pr_invoice_id else None,
            "gstr2b_invoice": _serialize_invoice(gstr2b_map.get(r.gstr2b_invoice_id)) if r.gstr2b_invoice_id else None,
        }
        results_with_details.append(result)
    
    # Calculate ITC summary
    total_pr_taxable = sum(inv.get("taxable_value", 0) for inv in pr_invoices)
    total_gstr2b_taxable = sum(inv.get("taxable_value", 0) for inv in gstr2b_invoices)
    total_pr_tax = sum(inv.get("total_tax", 0) for inv in pr_invoices)
    total_gstr2b_tax = sum(inv.get("total_tax", 0) for inv in gstr2b_invoices)
    
    # ITC that can be claimed (exact matches)
    itc_claimable = 0
    itc_at_risk = 0
    for r in match_results:
        if r.status.value == "exact_match":
            gstr2b_inv = gstr2b_map.get(r.gstr2b_invoice_id, {})
            itc_claimable += gstr2b_inv.get("total_tax", 0)
        elif r.status.value in ["amount_mismatch", "date_mismatch", "gstin_mismatch"]:
            gstr2b_inv = gstr2b_map.get(r.gstr2b_invoice_id, {})
            itc_at_risk += gstr2b_inv.get("total_tax", 0)
    
    # Log to Supabase
    try:
        db = get_db()
        # Identify user
        user_email = "anonymous"
        if authorization:
            token = authorization.replace("Bearer ", "").strip()
            sess = db.table("sessions").select("email").eq("token", token).execute()
            if sess.data:
                user_email = sess.data[0]["email"]

        db.table("reconciliation_runs").insert({
            "user_email": user_email,
            "pr_filename": pr_filename,
            "gstr2b_filename": gstr2b_filename,
            "pr_invoices_count": len(pr_invoices),
            "gstr2b_invoices_count": len(gstr2b_invoices),
            "total_records": stats["total_records"],
            "exact_match": stats["exact_match"],
            "amount_mismatch": stats["amount_mismatch"],
            "date_mismatch": stats.get("date_mismatch", 0),
            "gstin_mismatch": stats.get("gstin_mismatch", 0),
            "pr_only": stats["pr_only"],
            "gstr2b_only": stats["gstr2b_only"],
            "match_rate": round(stats["match_rate"], 1),
            "itc_claimable": round(itc_claimable, 2),
            "itc_at_risk": round(itc_at_risk, 2),
            "total_itc_available": round(total_gstr2b_tax, 2),
        }).execute()

        client_ip = request.client.host if request and request.client else None
        db.table("activity_logs").insert({
            "action": "reconciliation",
            "email": user_email,
            "details": {
                "pr_file": pr_filename,
                "gstr2b_file": gstr2b_filename,
                "total_records": stats["total_records"],
                "match_rate": round(stats["match_rate"], 1)
            },
            "ip_address": client_ip
        }).execute()
    except Exception as e:
        print(f"⚠️ Supabase logging error: {e}")

    return {
        "success": True,
        "parsing": {
            "pr_file": pr_filename,
            "pr_invoices_parsed": len(pr_invoices),
            "pr_columns": pr_columns,
            "pr_errors": pr_errors,
            "gstr2b_file": gstr2b_filename,
            "gstr2b_invoices_parsed": len(gstr2b_invoices),
            "gstr2b_columns": gstr2b_columns,
            "gstr2b_errors": gstr2b_errors,
        },
        "stats": {
            "total_records": stats["total_records"],
            "exact_match": stats["exact_match"],
            "amount_mismatch": stats["amount_mismatch"],
            "date_mismatch": stats.get("date_mismatch", 0),
            "gstin_mismatch": stats.get("gstin_mismatch", 0),
            "pr_only": stats["pr_only"],
            "gstr2b_only": stats["gstr2b_only"],
            "match_rate": round(stats["match_rate"], 1),
            "pending_review": stats["pending_review"],
            "discrepancies": stats["discrepancies"],
        },
        "itc_summary": {
            "itc_claimable": round(itc_claimable, 2),
            "itc_at_risk": round(itc_at_risk, 2),
            "total_itc_available": round(total_gstr2b_tax, 2),
            "total_pr_taxable": round(total_pr_taxable, 2),
            "total_gstr2b_taxable": round(total_gstr2b_taxable, 2),
        },
        "results": results_with_details,
    }


def _serialize_invoice(inv: Dict | None) -> Dict | None:
    """Convert invoice dict to JSON-serializable format"""
    if not inv:
        return None
    return {
        "id": inv.get("id", ""),
        "invoice_no": inv.get("invoice_no", ""),
        "invoice_date": str(inv.get("invoice_date", "")) if inv.get("invoice_date") else None,
        "vendor_gstin": inv.get("vendor_gstin", ""),
        "vendor_name": inv.get("vendor_name", ""),
        "taxable_value": float(inv.get("taxable_value", 0)),
        "igst": float(inv.get("igst", 0)),
        "cgst": float(inv.get("cgst", 0)),
        "sgst": float(inv.get("sgst", 0)),
        "cess": float(inv.get("cess", 0)),
        "total_tax": float(inv.get("total_tax", 0)),
        "invoice_value": float(inv.get("invoice_value", 0)),
        "source": inv.get("source", ""),
        "row_number": inv.get("row_number"),
    }
