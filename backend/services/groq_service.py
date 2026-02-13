"""
Groq AI Service
Provides AI-powered explanations and classification suggestions
"""
from groq import Groq
from typing import Dict, List, Optional
from config import get_settings


class GroqService:
    """Service for AI-powered mismatch analysis using Groq"""
    
    def __init__(self):
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
        self.model = settings.groq_model
    
    async def explain_mismatch(
        self,
        match_result: Dict,
        pr_invoice: Optional[Dict],
        gstr2b_invoice: Optional[Dict],
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Generate AI explanation for a mismatch.
        
        Returns:
            Dict with explanation, suggestion, and confidence
        """
        if not self.client:
            return self._fallback_explanation(match_result, pr_invoice, gstr2b_invoice)
        
        prompt = self._build_explanation_prompt(match_result, pr_invoice, gstr2b_invoice, context)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a GST expert assistant helping CAs reconcile GSTR-2B with Purchase Registers.
                        Analyze the mismatch and provide:
                        1. A clear explanation of why the mismatch occurred
                        2. A practical suggestion for resolution
                        Be concise and actionable. Focus on Indian GST regulations."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            
            # Parse response
            explanation, suggestion = self._parse_ai_response(content)
            
            return {
                "explanation": explanation,
                "suggestion": suggestion,
                "confidence": 0.85
            }
            
        except Exception as e:
            print(f"Groq API error: {e}")
            return self._fallback_explanation(match_result, pr_invoice, gstr2b_invoice)
    
    async def suggest_classification(
        self,
        match_result: Dict,
        pr_invoice: Optional[Dict],
        gstr2b_invoice: Optional[Dict]
    ) -> Dict:
        """
        Suggest classification category for a mismatch.
        
        Returns:
            Dict with category, reason, and confidence
        """
        if not self.client:
            return self._fallback_classification(match_result)
        
        prompt = self._build_classification_prompt(match_result, pr_invoice, gstr2b_invoice)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a GST expert. Classify this mismatch into one of these categories:
                        - recoverable: ITC can be claimed with vendor follow-up
                        - irrecoverable: ITC cannot be claimed (invoice not in GSTR-2B)
                        - pending_vendor: Waiting on vendor to file/amend
                        - data_entry_error: Our data entry mistake
                        - timing_difference: Will reconcile next period
                        - under_review: Need more investigation
                        
                        Respond with just the category name and a brief reason."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=200
            )
            
            content = response.choices[0].message.content.lower()
            
            # Extract category
            category = self._extract_category(content)
            
            return {
                "category": category,
                "reason": content,
                "confidence": 0.80
            }
            
        except Exception as e:
            print(f"Groq API error: {e}")
            return self._fallback_classification(match_result)
    
    async def generate_summary(
        self,
        run: Dict,
        results: List[Dict]
    ) -> Dict:
        """
        Generate summary report for a reconciliation run.
        
        Returns:
            Dict with text, key_findings, and recommendations
        """
        if not self.client:
            return self._fallback_summary(run, results)
        
        prompt = self._build_summary_prompt(run, results)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a GST reconciliation expert. Generate a professional summary report
                        for a CA firm reviewing their client's GST reconciliation. Include:
                        1. Executive summary (2-3 lines)
                        2. Key findings (bullet points)
                        3. Actionable recommendations
                        Be professional and concise."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=800
            )
            
            content = response.choices[0].message.content
            
            return {
                "text": content,
                "key_findings": self._extract_findings(content),
                "recommendations": self._extract_recommendations(content)
            }
            
        except Exception as e:
            print(f"Groq API error: {e}")
            return self._fallback_summary(run, results)
    
    def _build_explanation_prompt(
        self, 
        match_result: Dict, 
        pr_invoice: Optional[Dict], 
        gstr2b_invoice: Optional[Dict],
        context: Optional[Dict]
    ) -> str:
        """Build prompt for mismatch explanation"""
        
        prompt = f"Mismatch Type: {match_result.get('match_status', 'unknown')}\n\n"
        
        if pr_invoice:
            prompt += f"""Purchase Register Invoice:
- Invoice No: {pr_invoice.get('invoice_no')}
- Date: {pr_invoice.get('invoice_date')}
- Vendor GSTIN: {pr_invoice.get('vendor_gstin')}
- Taxable Value: ₹{pr_invoice.get('taxable_value', 0):,.2f}
- IGST: ₹{pr_invoice.get('igst', 0):,.2f}
- CGST: ₹{pr_invoice.get('cgst', 0):,.2f}
- SGST: ₹{pr_invoice.get('sgst', 0):,.2f}

"""
        else:
            prompt += "Purchase Register: No matching invoice found\n\n"
        
        if gstr2b_invoice:
            prompt += f"""GSTR-2B Invoice:
- Invoice No: {gstr2b_invoice.get('invoice_no')}
- Date: {gstr2b_invoice.get('invoice_date')}
- Vendor GSTIN: {gstr2b_invoice.get('vendor_gstin')}
- Taxable Value: ₹{gstr2b_invoice.get('taxable_value', 0):,.2f}
- IGST: ₹{gstr2b_invoice.get('igst', 0):,.2f}
- CGST: ₹{gstr2b_invoice.get('cgst', 0):,.2f}
- SGST: ₹{gstr2b_invoice.get('sgst', 0):,.2f}

"""
        else:
            prompt += "GSTR-2B: No matching invoice found\n\n"
        
        prompt += f"""Differences:
- Taxable Value Diff: ₹{match_result.get('taxable_diff', 0):,.2f}
- Total Tax Diff: ₹{match_result.get('total_diff', 0):,.2f}

Explain this mismatch and suggest resolution."""
        
        return prompt
    
    def _build_classification_prompt(
        self, 
        match_result: Dict, 
        pr_invoice: Optional[Dict], 
        gstr2b_invoice: Optional[Dict]
    ) -> str:
        """Build prompt for classification suggestion"""
        
        status = match_result.get('match_status', '')
        diff = match_result.get('total_diff', 0)
        
        prompt = f"Mismatch Status: {status}\n"
        prompt += f"Total Difference: ₹{diff:,.2f}\n"
        
        if status == 'pr_only':
            prompt += "This invoice is in Purchase Register but NOT in GSTR-2B.\n"
        elif status == 'gstr2b_only':
            prompt += "This invoice is in GSTR-2B but NOT in Purchase Register.\n"
        elif status == 'amount_mismatch':
            prompt += f"Amounts differ between PR and GSTR-2B.\n"
        
        prompt += "\nClassify this mismatch."
        
        return prompt
    
    def _build_summary_prompt(self, run: Dict, results: List[Dict]) -> str:
        """Build prompt for summary generation"""
        
        matched = sum(1 for r in results if r.get('match_status') == 'exact_match')
        mismatched = sum(1 for r in results if r.get('match_status') == 'amount_mismatch')
        pr_only = sum(1 for r in results if r.get('match_status') == 'pr_only')
        gstr2b_only = sum(1 for r in results if r.get('match_status') == 'gstr2b_only')
        total_diff = sum(abs(r.get('total_diff', 0)) for r in results)
        
        return f"""Reconciliation Summary:
- Period: {run.get('return_period')}
- Total PR Invoices: {run.get('total_pr_invoices', 0)}
- Total GSTR-2B Invoices: {run.get('total_gstr2b_invoices', 0)}
- Exact Matches: {matched}
- Amount Mismatches: {mismatched}
- PR Only (not in 2B): {pr_only}
- 2B Only (not in PR): {gstr2b_only}
- Total Difference Amount: ₹{total_diff:,.2f}

Generate a professional summary report for this reconciliation."""
    
    def _parse_ai_response(self, content: str) -> tuple:
        """Parse AI response into explanation and suggestion"""
        lines = content.split('\n')
        explanation = []
        suggestion = []
        in_suggestion = False
        
        for line in lines:
            if 'suggestion' in line.lower() or 'resolution' in line.lower() or 'action' in line.lower():
                in_suggestion = True
            if in_suggestion:
                suggestion.append(line)
            else:
                explanation.append(line)
        
        return '\n'.join(explanation).strip(), '\n'.join(suggestion).strip()
    
    def _extract_category(self, content: str) -> str:
        """Extract classification category from response"""
        categories = [
            'recoverable', 'irrecoverable', 'pending_vendor', 
            'data_entry_error', 'timing_difference', 'under_review'
        ]
        
        for cat in categories:
            if cat in content:
                return cat
        
        return 'under_review'
    
    def _extract_findings(self, content: str) -> List[str]:
        """Extract key findings from summary"""
        findings = []
        in_findings = False
        
        for line in content.split('\n'):
            if 'finding' in line.lower() or 'key' in line.lower():
                in_findings = True
            elif 'recommendation' in line.lower():
                in_findings = False
            elif in_findings and line.strip().startswith(('-', '•', '*')):
                findings.append(line.strip().lstrip('-•* '))
        
        return findings[:5]  # Limit to 5 findings
    
    def _extract_recommendations(self, content: str) -> List[str]:
        """Extract recommendations from summary"""
        recommendations = []
        in_recommendations = False
        
        for line in content.split('\n'):
            if 'recommendation' in line.lower() or 'action' in line.lower():
                in_recommendations = True
            elif in_recommendations and line.strip().startswith(('-', '•', '*', '1', '2', '3')):
                recommendations.append(line.strip().lstrip('-•*123. '))
        
        return recommendations[:5]  # Limit to 5 recommendations
    
    def _fallback_explanation(self, match_result: Dict, pr_invoice: Optional[Dict], gstr2b_invoice: Optional[Dict]) -> Dict:
        """Provide fallback explanation when API is unavailable"""
        status = match_result.get('match_status', '')
        
        explanations = {
            'pr_only': "This invoice exists in your Purchase Register but was not found in GSTR-2B. The vendor may not have filed it yet.",
            'gstr2b_only': "This invoice appears in GSTR-2B but is not in your Purchase Register. Please verify if this purchase was recorded.",
            'amount_mismatch': "The amounts in PR and GSTR-2B do not match. This could be due to rounding, partial invoices, or data entry errors.",
            'date_mismatch': "Invoice dates differ between PR and GSTR-2B. Check if the invoice was recorded in a different period."
        }
        
        suggestions = {
            'pr_only': "Follow up with the vendor to ensure they file this invoice in their GSTR-1.",
            'gstr2b_only': "Check your purchase records and add this invoice if valid. Contact vendor for invoice copy if needed.",
            'amount_mismatch': "Verify invoice amounts with the original document and correct any data entry errors.",
            'date_mismatch': "Confirm the correct invoice date and update records if needed."
        }
        
        return {
            "explanation": explanations.get(status, "Mismatch detected. Please review the invoice details."),
            "suggestion": suggestions.get(status, "Review and classify this mismatch based on the difference."),
            "confidence": 0.5
        }
    
    def _fallback_classification(self, match_result: Dict) -> Dict:
        """Provide fallback classification when API is unavailable"""
        status = match_result.get('match_status', '')
        
        if status == 'pr_only':
            return {"category": "pending_vendor", "reason": "Invoice not in GSTR-2B, awaiting vendor filing", "confidence": 0.6}
        elif status == 'gstr2b_only':
            return {"category": "under_review", "reason": "Invoice in 2B but not in PR, needs verification", "confidence": 0.5}
        else:
            return {"category": "under_review", "reason": "Requires manual review", "confidence": 0.4}
    
    def _fallback_summary(self, run: Dict, results: List[Dict]) -> Dict:
        """Provide fallback summary when API is unavailable"""
        matched = sum(1 for r in results if r.get('match_status') == 'exact_match')
        total = len(results)
        rate = (matched / total * 100) if total > 0 else 0
        
        return {
            "text": f"Reconciliation completed with {rate:.1f}% match rate. {total - matched} items require attention.",
            "key_findings": [f"{matched} exact matches found", f"{total - matched} mismatches for review"],
            "recommendations": ["Review pending items", "Follow up with vendors for missing invoices"]
        }


# Singleton instance
_groq_service: Optional[GroqService] = None


def get_groq_service() -> GroqService:
    """Get or create Groq service instance"""
    global _groq_service
    if _groq_service is None:
        _groq_service = GroqService()
    return _groq_service
