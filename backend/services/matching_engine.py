"""
Invoice Matching Engine
Matches Purchase Register invoices with GSTR-2B invoices
"""
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from models.schemas import MatchStatus


class MatchingEngine:
    """Engine for matching invoices between PR and GSTR-2B"""
    
    def __init__(
        self,
        amount_tolerance: float = 1.0,  # ₹1 tolerance for rounding
        date_tolerance_days: int = 30,  # Days tolerance for date matching
        fuzzy_invoice_match: bool = True
    ):
        self.amount_tolerance = amount_tolerance
        self.date_tolerance_days = date_tolerance_days
        self.fuzzy_invoice_match = fuzzy_invoice_match
    
    def match_invoices(
        self, 
        pr_invoices: List[Dict], 
        gstr2b_invoices: List[Dict]
    ) -> List[Dict]:
        """
        Match invoices from both sources and return match results.
        
        Returns list of match results with:
        - match_status
        - pr_invoice_id (nullable)
        - gstr2b_invoice_id (nullable)
        - differences
        """
        results = []
        
        # Create lookup maps
        pr_map = self._create_invoice_map(pr_invoices)
        gstr2b_map = self._create_invoice_map(gstr2b_invoices)
        
        # Track matched invoices
        matched_pr = set()
        matched_gstr2b = set()
        
        # Phase 1: Exact matching (GSTIN + Invoice No)
        for key, pr_inv in pr_map.items():
            if key in gstr2b_map:
                gstr2b_inv = gstr2b_map[key]
                result = self._compare_invoices(pr_inv, gstr2b_inv)
                results.append(result)
                matched_pr.add(key)
                matched_gstr2b.add(key)
        
        # Phase 2: Fuzzy matching for unmatched
        if self.fuzzy_invoice_match:
            unmatched_pr = {k: v for k, v in pr_map.items() if k not in matched_pr}
            unmatched_gstr2b = {k: v for k, v in gstr2b_map.items() if k not in matched_gstr2b}
            
            for pr_key, pr_inv in unmatched_pr.items():
                best_match = self._find_fuzzy_match(pr_inv, unmatched_gstr2b)
                if best_match:
                    gstr2b_key, gstr2b_inv, score = best_match
                    result = self._compare_invoices(pr_inv, gstr2b_inv)
                    result["confidence_score"] = score
                    result["match_rule_applied"] = "fuzzy_match"
                    results.append(result)
                    matched_pr.add(pr_key)
                    matched_gstr2b.add(gstr2b_key)
        
        # Phase 3: Mark unmatched as PR-only or GSTR2B-only
        for key, pr_inv in pr_map.items():
            if key not in matched_pr:
                results.append({
                    "pr_invoice_id": pr_inv["id"],
                    "gstr2b_invoice_id": None,
                    "match_status": MatchStatus.PR_ONLY.value,
                    "confidence_score": 100,
                    "match_rule_applied": "unmatched",
                    "taxable_diff": pr_inv.get("taxable_value", 0),
                    "igst_diff": pr_inv.get("igst", 0),
                    "cgst_diff": pr_inv.get("cgst", 0),
                    "sgst_diff": pr_inv.get("sgst", 0),
                    "total_diff": pr_inv.get("total_tax", 0)
                })
        
        for key, gstr2b_inv in gstr2b_map.items():
            if key not in matched_gstr2b:
                results.append({
                    "pr_invoice_id": None,
                    "gstr2b_invoice_id": gstr2b_inv["id"],
                    "match_status": MatchStatus.GSTR2B_ONLY.value,
                    "confidence_score": 100,
                    "match_rule_applied": "unmatched",
                    "taxable_diff": -gstr2b_inv.get("taxable_value", 0),
                    "igst_diff": -gstr2b_inv.get("igst", 0),
                    "cgst_diff": -gstr2b_inv.get("cgst", 0),
                    "sgst_diff": -gstr2b_inv.get("sgst", 0),
                    "total_diff": -gstr2b_inv.get("total_tax", 0)
                })
        
        return results
    
    def _create_invoice_map(self, invoices: List[Dict]) -> Dict[str, Dict]:
        """Create lookup map keyed by normalized GSTIN + Invoice No"""
        invoice_map = {}
        for inv in invoices:
            gstin = self._normalize_gstin(inv.get("vendor_gstin", ""))
            inv_no = self._normalize_invoice_no(inv.get("invoice_no", ""))
            key = f"{gstin}_{inv_no}"
            
            # Handle duplicates by keeping first occurrence
            if key not in invoice_map:
                invoice_map[key] = inv
        
        return invoice_map
    
    def _normalize_gstin(self, gstin: str) -> str:
        """Normalize GSTIN for matching"""
        if not gstin:
            return ""
        return str(gstin).strip().upper()
    
    def _normalize_invoice_no(self, inv_no: str) -> str:
        """Normalize invoice number for matching"""
        if not inv_no:
            return ""
        # Remove common separators and whitespace, uppercase
        normalized = str(inv_no).strip().upper()
        normalized = normalized.replace("-", "").replace("/", "").replace(" ", "")
        return normalized
    
    def _compare_invoices(self, pr_inv: Dict, gstr2b_inv: Dict) -> Dict:
        """Compare two invoices and determine match status"""
        
        # Calculate differences
        taxable_diff = abs(pr_inv.get("taxable_value", 0) - gstr2b_inv.get("taxable_value", 0))
        igst_diff = abs(pr_inv.get("igst", 0) - gstr2b_inv.get("igst", 0))
        cgst_diff = abs(pr_inv.get("cgst", 0) - gstr2b_inv.get("cgst", 0))
        sgst_diff = abs(pr_inv.get("sgst", 0) - gstr2b_inv.get("sgst", 0))
        total_diff = taxable_diff + igst_diff + cgst_diff + sgst_diff
        
        # Determine match status
        if total_diff <= self.amount_tolerance:
            status = MatchStatus.EXACT_MATCH.value
            confidence = 100
        elif total_diff <= 100:  # Minor mismatch
            status = MatchStatus.AMOUNT_MISMATCH.value
            confidence = 90
        else:
            status = MatchStatus.AMOUNT_MISMATCH.value
            confidence = max(50, 100 - (total_diff / 100))
        
        # Check date mismatch
        pr_date = pr_inv.get("invoice_date")
        gstr2b_date = gstr2b_inv.get("invoice_date")
        if pr_date and gstr2b_date and pr_date != gstr2b_date:
            if status == MatchStatus.EXACT_MATCH.value:
                status = MatchStatus.DATE_MISMATCH.value
                confidence = 85
        
        return {
            "pr_invoice_id": pr_inv["id"],
            "gstr2b_invoice_id": gstr2b_inv["id"],
            "match_status": status,
            "confidence_score": confidence,
            "match_rule_applied": "exact_match",
            "taxable_diff": pr_inv.get("taxable_value", 0) - gstr2b_inv.get("taxable_value", 0),
            "igst_diff": pr_inv.get("igst", 0) - gstr2b_inv.get("igst", 0),
            "cgst_diff": pr_inv.get("cgst", 0) - gstr2b_inv.get("cgst", 0),
            "sgst_diff": pr_inv.get("sgst", 0) - gstr2b_inv.get("sgst", 0),
            "total_diff": total_diff
        }
    
    def _find_fuzzy_match(
        self, 
        pr_inv: Dict, 
        candidates: Dict[str, Dict]
    ) -> Optional[Tuple[str, Dict, float]]:
        """Find best fuzzy match for an invoice"""
        
        pr_gstin = self._normalize_gstin(pr_inv.get("vendor_gstin", ""))
        pr_amount = pr_inv.get("taxable_value", 0)
        
        best_match = None
        best_score = 0
        
        for key, gstr2b_inv in candidates.items():
            gstr2b_gstin = self._normalize_gstin(gstr2b_inv.get("vendor_gstin", ""))
            gstr2b_amount = gstr2b_inv.get("taxable_value", 0)
            
            # Must have same GSTIN
            if pr_gstin != gstr2b_gstin:
                continue
            
            # Calculate similarity score
            amount_diff = abs(pr_amount - gstr2b_amount)
            if amount_diff > pr_amount * 0.1:  # More than 10% difference
                continue
            
            score = 100 - (amount_diff / max(pr_amount, 1) * 100)
            
            if score > best_score and score >= 70:
                best_score = score
                best_match = (key, gstr2b_inv, score)
        
        return best_match
    
    def get_summary_stats(self, results: List[Dict]) -> Dict:
        """Calculate summary statistics from match results"""
        stats = {
            "total": len(results),
            "exact_match": 0,
            "amount_mismatch": 0,
            "date_mismatch": 0,
            "pr_only": 0,
            "gstr2b_only": 0,
            "total_diff_amount": 0
        }
        
        for r in results:
            status = r.get("match_status", "")
            if status == MatchStatus.EXACT_MATCH.value:
                stats["exact_match"] += 1
            elif status == MatchStatus.AMOUNT_MISMATCH.value:
                stats["amount_mismatch"] += 1
            elif status == MatchStatus.DATE_MISMATCH.value:
                stats["date_mismatch"] += 1
            elif status == MatchStatus.PR_ONLY.value:
                stats["pr_only"] += 1
            elif status == MatchStatus.GSTR2B_ONLY.value:
                stats["gstr2b_only"] += 1
            
            stats["total_diff_amount"] += abs(r.get("total_diff", 0))
        
        stats["match_rate"] = (stats["exact_match"] / stats["total"] * 100) if stats["total"] > 0 else 0
        
        return stats
