"""
AI API Routes - Groq LLM Integration
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models.schemas import (
    AIExplanationRequest, AIExplanationResponse,
    AIClassificationSuggestion, AIBatchExplanationRequest
)
from services.supabase_service import get_supabase_service, SupabaseService
from core.groq_client import get_groq_client, GroqClient

from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []


@router.post("/chat")
async def chat_with_agent(
    request: ChatRequest,
    groq: GroqClient = Depends(get_groq_client)
):
    """
    Chat with the AI agent.
    """
    try:
        response = await groq.chat_with_agent(request.message, request.history)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/explain", response_model=AIExplanationResponse)
async def explain_discrepancy(
    request: AIExplanationRequest,
    supabase: SupabaseService = Depends(get_supabase_service),
    groq: GroqClient = Depends(get_groq_client)
):
    """
    Generate an AI explanation for a match result discrepancy.
    Uses Groq Llama 3.3 70B to explain in CA-friendly terms.
    """
    try:
        # Get match result with invoices
        match_result = await supabase.get_match_result(request.match_result_id)
        if not match_result:
            raise HTTPException(status_code=404, detail="Match result not found")
        
        # Get invoice data
        pr_invoice = match_result.get("pr_invoice", {})
        gstr2b_invoice = match_result.get("gstr2b_invoice")
        
        # Calculate differences
        differences = {
            "taxable_diff": match_result.get("taxable_diff", 0),
            "igst_diff": match_result.get("igst_diff", 0),
            "cgst_diff": match_result.get("cgst_diff", 0),
            "sgst_diff": match_result.get("sgst_diff", 0),
            "total_diff": match_result.get("total_diff", 0)
        }
        
        # Generate explanation
        result = await groq.explain_discrepancy(
            pr_invoice=pr_invoice,
            gstr2b_invoice=gstr2b_invoice,
            match_status=match_result.get("match_status"),
            differences=differences
        )
        
        # Save explanation to database
        await supabase.update_match_result(request.match_result_id, {
            "ai_explanation": result["explanation"],
            "ai_suggestion": result["suggestion"]
        })
        
        return AIExplanationResponse(
            match_result_id=request.match_result_id,
            explanation=result["explanation"],
            suggestion=result["suggestion"],
            confidence=0.85  # Default confidence for Llama 3.3
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-explain")
async def batch_explain_discrepancies(
    request: AIBatchExplanationRequest,
    supabase: SupabaseService = Depends(get_supabase_service),
    groq: GroqClient = Depends(get_groq_client)
):
    """
    Generate AI explanations for multiple match results.
    Useful for processing all discrepancies in a run.
    """
    results = []
    errors = []
    
    for match_id in request.match_result_ids:
        try:
            match_result = await supabase.get_match_result(match_id)
            if not match_result:
                errors.append({"match_result_id": match_id, "error": "Not found"})
                continue
            
            pr_invoice = match_result.get("pr_invoice", {})
            gstr2b_invoice = match_result.get("gstr2b_invoice")
            
            differences = {
                "taxable_diff": match_result.get("taxable_diff", 0),
                "igst_diff": match_result.get("igst_diff", 0),
                "cgst_diff": match_result.get("cgst_diff", 0),
                "sgst_diff": match_result.get("sgst_diff", 0),
                "total_diff": match_result.get("total_diff", 0)
            }
            
            result = await groq.explain_discrepancy(
                pr_invoice=pr_invoice,
                gstr2b_invoice=gstr2b_invoice,
                match_status=match_result.get("match_status"),
                differences=differences
            )
            
            await supabase.update_match_result(match_id, {
                "ai_explanation": result["explanation"],
                "ai_suggestion": result["suggestion"]
            })
            
            results.append({
                "match_result_id": match_id,
                "explanation": result["explanation"],
                "suggestion": result["suggestion"]
            })
            
        except Exception as e:
            errors.append({"match_result_id": match_id, "error": str(e)})
    
    return {
        "processed": len(results),
        "errors": len(errors),
        "results": results,
        "error_details": errors
    }


@router.post("/classify", response_model=AIClassificationSuggestion)
async def suggest_classification(
    request: AIExplanationRequest,
    supabase: SupabaseService = Depends(get_supabase_service),
    groq: GroqClient = Depends(get_groq_client)
):
    """
    Get AI-suggested classification for a discrepancy.
    """
    try:
        match_result = await supabase.get_match_result(request.match_result_id)
        if not match_result:
            raise HTTPException(status_code=404, detail="Match result not found")
        
        pr_invoice = match_result.get("pr_invoice", {})
        gstr2b_invoice = match_result.get("gstr2b_invoice")
        
        result = await groq.suggest_classification(
            pr_invoice=pr_invoice,
            gstr2b_invoice=gstr2b_invoice,
            match_status=match_result.get("match_status")
        )
        
        return AIClassificationSuggestion(
            match_result_id=request.match_result_id,
            suggested_category=result["category"],
            reason=result["reason"],
            confidence=result["confidence"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize/{run_id}")
async def summarize_reconciliation(
    run_id: str,
    supabase: SupabaseService = Depends(get_supabase_service),
    groq: GroqClient = Depends(get_groq_client)
):
    """
    Generate an executive summary of reconciliation results.
    """
    try:
        run = await supabase.get_reconciliation_run(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # Get client info
        client = await supabase.get_client(run["client_id"])
        client_name = client.get("name", "Unknown") if client else "Unknown"
        
        # Build stats
        stats = {
            "total_records": run["total_pr_invoices"] + run["total_gstr2b_invoices"],
            "exact_match": run["matched_count"],
            "amount_mismatch": run["mismatch_count"],
            "gstin_mismatch": 0,  # Would need to query match_results for this
            "pr_only": run["pr_only_count"],
            "gstr2b_only": run["gstr2b_only_count"],
            "discrepancies": run["mismatch_count"] + run["pr_only_count"] + run["gstr2b_only_count"],
            "match_rate": (run["matched_count"] / max(run["total_pr_invoices"], 1)) * 100
        }
        
        summary = await groq.summarize_reconciliation(
            stats=stats,
            client_name=client_name,
            return_period=run["return_period"]
        )
        
        return {
            "run_id": run_id,
            "summary": summary,
            "stats": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client-risk/{client_id}")
async def get_client_risk_analysis(
    client_id: str,
    groq: GroqClient = Depends(get_groq_client)
):
    """
    Generate an AI risk analysis for a client based on their profile and
    available reconciliation run data.
    """
    from core.db import get_db
    try:
        db = get_db()

        # Fetch client from manage-clients table (same core/db layer)
        client_res = db.table("clients").select("*").eq("id", client_id).execute()
        if not client_res.data:
            raise HTTPException(status_code=404, detail="Client not found")
        client = client_res.data[0]

        # Fetch all reconciliation runs (no client_id link — use existing runs table)
        # We pull all runs and use aggregate stats from them for overall analysis
        runs_res = db.table("reconciliation_runs").select(
            "match_rate, exact_match, amount_mismatch, date_mismatch, gstin_mismatch, pr_only, gstr2b_only, total_records, itc_at_risk, itc_claimable"
        ).execute()
        runs = runs_res.data or []

        # Build aggregate stats from available run data
        total_runs = len(runs)
        client_status = client.get("status", "not_started")
        last_reconciled = client.get("last_reconciled")

        # For new/unstarted clients, show empty state
        # Show dashboard if: status is completed/pending OR last_reconciled is set
        is_new_client = client_status == "not_started" and not last_reconciled
        if is_new_client:
            return {
                "client_id": client_id,
                "client_name": client.get("name"),
                "analysis": None,
                "stats": {"total_runs": 0}
            }

        # Aggregate stats from all available runs as a proxy
        if total_runs > 0:
            avg_match_rate = sum(r.get("match_rate", 0) or 0 for r in runs) / total_runs
            total_discrepancies = sum(
                (r.get("amount_mismatch", 0) or 0) +
                (r.get("pr_only", 0) or 0) +
                (r.get("gstr2b_only", 0) or 0)
                for r in runs
            )
            max_mismatch = max((r.get("amount_mismatch", 0) or 0) for r in runs) if runs else 0
            total_itc_at_risk = sum(r.get("itc_at_risk", 0) or 0 for r in runs)
        else:
            avg_match_rate = 0.0
            total_discrepancies = 0
            max_mismatch = 0
            total_itc_at_risk = 0.0

        stats = {
            "total_runs": max(total_runs, 1),  # at least 1 since status is completed/pending
            "avg_match_rate": round(avg_match_rate, 1),
            "total_discrepancies": total_discrepancies,
            "avg_discrepancies": round(total_discrepancies / max(total_runs, 1), 1),
            "max_mismatch": max_mismatch,
            "most_common_issue": "Amount Mismatches" if total_runs > 0 else "No data",
            "last_reconciled": last_reconciled,
            "status": client_status,
            "total_itc_at_risk": round(total_itc_at_risk, 2),
        }

        analysis = await groq.analyze_client_risk(
            client_name=client.get("name", "Unknown Client"),
            stats=stats
        )

        return {
            "client_id": client_id,
            "client_name": client.get("name", "Unknown Client"),
            "analysis": analysis,
            "stats": stats
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



