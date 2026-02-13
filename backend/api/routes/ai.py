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


router = APIRouter()


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
