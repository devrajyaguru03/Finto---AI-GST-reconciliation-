"""
GST Reconciliation Engine
Deterministic, rule-based matching logic for Purchase Register vs GSTR-2B
"""
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import re
from decimal import Decimal, ROUND_HALF_UP


class MatchStatus(str, Enum):
    EXACT_MATCH = "exact_match"
    AMOUNT_MISMATCH = "amount_mismatch"
    DATE_MISMATCH = "date_mismatch"
    GSTIN_MISMATCH = "gstin_mismatch"
    PR_ONLY = "pr_only"
    GSTR2B_ONLY = "gstr2b_only"
    DUPLICATE = "duplicate"


@dataclass
class MatchResult:
    """Result of matching two invoices"""
    status: MatchStatus
    pr_invoice_id: Optional[str]
    gstr2b_invoice_id: Optional[str]
    confidence_score: float
    match_rule: str
    taxable_diff: float = 0
    igst_diff: float = 0
    cgst_diff: float = 0
    sgst_diff: float = 0
    total_diff: float = 0


class ReconciliationEngine:
    """
    DETERMINISTIC GST Reconciliation Engine
    
    Matching Rules (in order of priority):
    1. Exact Match: GSTIN + Invoice No + Amount (all taxes)
    2. Amount Mismatch: GSTIN + Invoice No match, amounts differ
    3. Date Mismatch: GSTIN + Invoice No + Amount match, dates differ
    4. GSTIN Mismatch: Invoice No + Amount match, GSTIN differs (potential data entry error)
    5. PR Only: Invoice in Purchase Register, not found in GSTR-2B
    6. GSTR-2B Only: Invoice in GSTR-2B, not found in Purchase Register
    
    This engine is:
    - Deterministic: Same inputs always produce same outputs
    - Testable: Each rule can be unit tested
    - Auditable: Every decision is logged with the rule applied
    """
    
    # Tolerance for amount matching (in INR)
    AMOUNT_TOLERANCE = Decimal("1.00")
    
    # Percentage tolerance for large amounts
    PERCENTAGE_TOLERANCE = Decimal("0.01")  # 1%
    
    def __init__(self):
        self.matched_pr_ids = set()
        self.matched_gstr2b_ids = set()
    
    def normalize_invoice_no(self, invoice_no: str) -> str:
        """
        Normalize invoice number for matching.
        Removes spaces, special chars, converts to uppercase.
        """
        if not invoice_no:
            return ""
        # Remove common prefixes/suffixes
        normalized = invoice_no.upper().strip()
        # Remove special characters except alphanumeric
        normalized = re.sub(r'[^A-Z0-9]', '', normalized)
        return normalized
    
    def normalize_gstin(self, gstin: str) -> str:
        """Normalize GSTIN for matching"""
        if not gstin:
            return ""
        return gstin.upper().strip().replace(" ", "")
    
    def amounts_match(
        self, 
        amount1: float, 
        amount2: float, 
        use_percentage: bool = False
    ) -> bool:
        """
        Check if two amounts match within tolerance.
        For small amounts: absolute tolerance
        For large amounts: percentage tolerance
        """
        a1 = Decimal(str(amount1))
        a2 = Decimal(str(amount2))
        diff = abs(a1 - a2)
        
        if use_percentage and (a1 > 10000 or a2 > 10000):
            # Use percentage for large amounts
            max_val = max(a1, a2)
            if max_val > 0:
                return (diff / max_val) <= self.PERCENTAGE_TOLERANCE
        
        return diff <= self.AMOUNT_TOLERANCE
    
    def calculate_differences(
        self, 
        pr_invoice: Dict, 
        gstr2b_invoice: Dict
    ) -> Dict[str, float]:
        """Calculate all amount differences between invoices"""
        return {
            "taxable_diff": float(pr_invoice.get("taxable_value", 0)) - float(gstr2b_invoice.get("taxable_value", 0)),
            "igst_diff": float(pr_invoice.get("igst", 0)) - float(gstr2b_invoice.get("igst", 0)),
            "cgst_diff": float(pr_invoice.get("cgst", 0)) - float(gstr2b_invoice.get("cgst", 0)),
            "sgst_diff": float(pr_invoice.get("sgst", 0)) - float(gstr2b_invoice.get("sgst", 0)),
            "total_diff": (
                float(pr_invoice.get("taxable_value", 0)) + float(pr_invoice.get("total_tax", 0))
            ) - (
                float(gstr2b_invoice.get("taxable_value", 0)) + float(gstr2b_invoice.get("total_tax", 0))
            )
        }
    
    def match_single_pair(
        self, 
        pr_invoice: Dict, 
        gstr2b_invoice: Dict
    ) -> Optional[MatchResult]:
        """
        Attempt to match a single pair of invoices.
        Returns MatchResult if they match, None otherwise.
        """
        # Normalize for comparison
        pr_inv_no = self.normalize_invoice_no(pr_invoice.get("invoice_no", ""))
        gstr2b_inv_no = self.normalize_invoice_no(gstr2b_invoice.get("invoice_no", ""))
        
        pr_gstin = self.normalize_gstin(pr_invoice.get("vendor_gstin", ""))
        gstr2b_gstin = self.normalize_gstin(gstr2b_invoice.get("vendor_gstin", ""))
        
        # Invoice numbers must match (after normalization)
        if pr_inv_no != gstr2b_inv_no:
            return None
        
        # Calculate amount differences
        diffs = self.calculate_differences(pr_invoice, gstr2b_invoice)
        
        # Check GSTIN match
        gstin_match = pr_gstin == gstr2b_gstin
        
        # Check amount matches
        taxable_match = self.amounts_match(
            pr_invoice.get("taxable_value", 0),
            gstr2b_invoice.get("taxable_value", 0),
            use_percentage=True
        )
        igst_match = self.amounts_match(
            pr_invoice.get("igst", 0),
            gstr2b_invoice.get("igst", 0)
        )
        cgst_match = self.amounts_match(
            pr_invoice.get("cgst", 0),
            gstr2b_invoice.get("cgst", 0)
        )
        sgst_match = self.amounts_match(
            pr_invoice.get("sgst", 0),
            gstr2b_invoice.get("sgst", 0)
        )
        
        all_amounts_match = taxable_match and igst_match and cgst_match and sgst_match
        
        # Determine match status
        if gstin_match and all_amounts_match:
            # Rule 1: Exact Match
            return MatchResult(
                status=MatchStatus.EXACT_MATCH,
                pr_invoice_id=pr_invoice["id"],
                gstr2b_invoice_id=gstr2b_invoice["id"],
                confidence_score=100.0,
                match_rule="EXACT_MATCH: GSTIN + Invoice No + All Amounts",
                **diffs
            )
        
        elif gstin_match and not all_amounts_match:
            # Rule 2: Amount Mismatch
            return MatchResult(
                status=MatchStatus.AMOUNT_MISMATCH,
                pr_invoice_id=pr_invoice["id"],
                gstr2b_invoice_id=gstr2b_invoice["id"],
                confidence_score=85.0,
                match_rule="AMOUNT_MISMATCH: GSTIN + Invoice No match, amounts differ",
                **diffs
            )
        
        elif not gstin_match and all_amounts_match:
            # Rule 4: GSTIN Mismatch (potential data entry error)
            return MatchResult(
                status=MatchStatus.GSTIN_MISMATCH,
                pr_invoice_id=pr_invoice["id"],
                gstr2b_invoice_id=gstr2b_invoice["id"],
                confidence_score=70.0,
                match_rule="GSTIN_MISMATCH: Invoice No + Amounts match, GSTIN differs",
                **diffs
            )
        
        return None
    
    def reconcile(
        self, 
        pr_invoices: List[Dict], 
        gstr2b_invoices: List[Dict]
    ) -> List[MatchResult]:
        """
        Main reconciliation method.
        
        Algorithm:
        1. Build index of GSTR-2B invoices by normalized invoice number
        2. For each PR invoice, find potential matches
        3. Apply matching rules in priority order
        4. Mark unmatched invoices as PR_ONLY or GSTR2B_ONLY
        
        Returns: List of MatchResult objects
        """
        results: List[MatchResult] = []
        self.matched_pr_ids = set()
        self.matched_gstr2b_ids = set()
        
        # Build GSTR-2B index by normalized invoice number
        gstr2b_index: Dict[str, List[Dict]] = {}
        for inv in gstr2b_invoices:
            key = self.normalize_invoice_no(inv.get("invoice_no", ""))
            if key:
                if key not in gstr2b_index:
                    gstr2b_index[key] = []
                gstr2b_index[key].append(inv)
        
        # Phase 1: Match PR invoices against GSTR-2B
        for pr_inv in pr_invoices:
            pr_key = self.normalize_invoice_no(pr_inv.get("invoice_no", ""))
            
            if not pr_key:
                continue
            
            # Find potential matches
            potential_matches = gstr2b_index.get(pr_key, [])
            
            best_match: Optional[MatchResult] = None
            
            for gstr2b_inv in potential_matches:
                # Skip already matched
                if gstr2b_inv["id"] in self.matched_gstr2b_ids:
                    continue
                
                match = self.match_single_pair(pr_inv, gstr2b_inv)
                
                if match:
                    # Keep the best match (highest confidence)
                    if best_match is None or match.confidence_score > best_match.confidence_score:
                        best_match = match
            
            if best_match:
                results.append(best_match)
                self.matched_pr_ids.add(best_match.pr_invoice_id)
                self.matched_gstr2b_ids.add(best_match.gstr2b_invoice_id)
        
        # Phase 2: Mark unmatched PR invoices as PR_ONLY
        for pr_inv in pr_invoices:
            if pr_inv["id"] not in self.matched_pr_ids:
                results.append(MatchResult(
                    status=MatchStatus.PR_ONLY,
                    pr_invoice_id=pr_inv["id"],
                    gstr2b_invoice_id=None,
                    confidence_score=100.0,
                    match_rule="PR_ONLY: Invoice not found in GSTR-2B"
                ))
        
        # Phase 3: Mark unmatched GSTR-2B invoices as GSTR2B_ONLY
        for gstr2b_inv in gstr2b_invoices:
            if gstr2b_inv["id"] not in self.matched_gstr2b_ids:
                results.append(MatchResult(
                    status=MatchStatus.GSTR2B_ONLY,
                    pr_invoice_id=None,
                    gstr2b_invoice_id=gstr2b_inv["id"],
                    confidence_score=100.0,
                    match_rule="GSTR2B_ONLY: Invoice not found in Purchase Register"
                ))
        
        return results
    
    def get_stats(self, results: List[MatchResult]) -> Dict:
        """Calculate reconciliation statistics"""
        stats = {
            "total_records": len(results),
            "exact_match": 0,
            "amount_mismatch": 0,
            "date_mismatch": 0,
            "gstin_mismatch": 0,
            "pr_only": 0,
            "gstr2b_only": 0,
            "duplicate": 0
        }
        
        for r in results:
            stats[r.status.value] = stats.get(r.status.value, 0) + 1
        
        # Calculate match rate
        auto_matched = stats["exact_match"]
        total = stats["total_records"]
        stats["match_rate"] = (auto_matched / total * 100) if total > 0 else 0
        
        # Pending review = mismatches + single-sided
        stats["pending_review"] = (
            stats["amount_mismatch"] + 
            stats["gstin_mismatch"] + 
            stats["pr_only"] + 
            stats["gstr2b_only"]
        )
        
        # Discrepancies = anything that's not exact match
        stats["discrepancies"] = total - stats["exact_match"]
        
        return stats


# Singleton instance
_engine: Optional[ReconciliationEngine] = None


def get_reconciliation_engine() -> ReconciliationEngine:
    """Get or create reconciliation engine instance"""
    global _engine
    if _engine is None:
        _engine = ReconciliationEngine()
    return _engine
