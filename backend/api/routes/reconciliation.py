"""
Reconciliation API Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime

from models.schemas import (
    ReconciliationRunCreate, ReconciliationRunResponse,
    ReconciliationStartRequest, ReconciliationStats,
    MatchResultResponse, MatchStatus
)
from services.supabase_service import get_supabase_service, SupabaseService
from core.reconciliation_engine import get_reconciliation_engine, ReconciliationEngine


router = APIRouter()


@router.post("/runs", response_model=ReconciliationRunResponse)
async def create_reconciliation_run(
    data: ReconciliationRunCreate,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Create a new reconciliation run"""
    try:
        # TODO: Get user_id from auth
        user_id = "system"
        
        run = await supabase.create_reconciliation_run(
            data.model_dump(),
            user_id
        )
        
        return ReconciliationRunResponse(**run)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}", response_model=ReconciliationRunResponse)
async def get_reconciliation_run(
    run_id: str,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get a reconciliation run by ID"""
    run = await supabase.get_reconciliation_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return ReconciliationRunResponse(**run)


@router.post("/runs/{run_id}/start")
async def start_reconciliation(
    run_id: str,
    supabase: SupabaseService = Depends(get_supabase_service),
    engine: ReconciliationEngine = Depends(get_reconciliation_engine)
):
    """
    Start the reconciliation process for a run.
    Assumes files have already been uploaded and parsed.
    """
    try:
        # Update status to matching
        await supabase.update_reconciliation_run(run_id, {
            "status": "matching",
            "started_at": datetime.utcnow().isoformat()
        })
        
        # Get invoices
        pr_invoices = await supabase.get_invoices_for_run(run_id, "purchase_register")
        gstr2b_invoices = await supabase.get_invoices_for_run(run_id, "gstr2b")
        
        # Run reconciliation
        results = engine.reconcile(pr_invoices, gstr2b_invoices)
        stats = engine.get_stats(results)
        
        # Save results to database
        match_results = []
        for r in results:
            match_results.append({
                "run_id": run_id,
                "pr_invoice_id": r.pr_invoice_id,
                "gstr2b_invoice_id": r.gstr2b_invoice_id,
                "match_status": r.status.value,
                "confidence_score": r.confidence_score,
                "match_rule_applied": r.match_rule,
                "taxable_diff": r.taxable_diff,
                "igst_diff": r.igst_diff,
                "cgst_diff": r.cgst_diff,
                "sgst_diff": r.sgst_diff,
                "total_diff": r.total_diff
            })
        
        if match_results:
            await supabase.bulk_insert_match_results(match_results)
        
        # Calculate totals
        total_pr_taxable = sum(inv.get("taxable_value", 0) for inv in pr_invoices)
        total_gstr2b_taxable = sum(inv.get("taxable_value", 0) for inv in gstr2b_invoices)
        
        # Update run with results
        await supabase.update_reconciliation_run(run_id, {
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "total_pr_invoices": len(pr_invoices),
            "total_gstr2b_invoices": len(gstr2b_invoices),
            "matched_count": stats["exact_match"],
            "mismatch_count": stats["amount_mismatch"] + stats["gstin_mismatch"],
            "pr_only_count": stats["pr_only"],
            "gstr2b_only_count": stats["gstr2b_only"],
            "total_pr_taxable": total_pr_taxable,
            "total_gstr2b_taxable": total_gstr2b_taxable
        })
        
        return {
            "run_id": run_id,
            "status": "completed",
            "stats": stats
        }
        
    except Exception as e:
        await supabase.update_reconciliation_run(run_id, {"status": "failed"})
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}/stats", response_model=ReconciliationStats)
async def get_reconciliation_stats(
    run_id: str,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get statistics for a reconciliation run"""
    run = await supabase.get_reconciliation_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return ReconciliationStats(
        total_records=run["total_pr_invoices"] + run["total_gstr2b_invoices"],
        auto_matched=run["matched_count"],
        pending_review=run["mismatch_count"] + run["pr_only_count"] + run["gstr2b_only_count"],
        discrepancies=run["mismatch_count"],
        match_rate=(run["matched_count"] / max(run["total_pr_invoices"], 1)) * 100
    )


@router.get("/runs/{run_id}/results", response_model=List[MatchResultResponse])
async def get_match_results(
    run_id: str,
    status: Optional[str] = None,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get all match results for a run, optionally filtered by status"""
    results = await supabase.get_match_results_for_run(run_id, status)
    return [MatchResultResponse(**r) for r in results]


@router.get("/runs/{run_id}/results/{result_id}", response_model=MatchResultResponse)
async def get_match_result(
    run_id: str,
    result_id: str,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get a single match result with invoice details"""
    result = await supabase.get_match_result(result_id)
    if not result or result["run_id"] != run_id:
        raise HTTPException(status_code=404, detail="Result not found")
    return MatchResultResponse(**result)


@router.get("/clients/{client_id}/runs", response_model=List[ReconciliationRunResponse])
async def get_client_runs(
    client_id: str,
    supabase: SupabaseService = Depends(get_supabase_service)
):
    """Get all reconciliation runs for a client"""
    runs = await supabase.get_runs_for_client(client_id)
    return [ReconciliationRunResponse(**r) for r in runs]
