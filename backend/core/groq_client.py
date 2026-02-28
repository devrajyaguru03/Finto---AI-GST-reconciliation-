"""
Groq LLM Client for AI-powered explanations
Uses Llama 3.3 70B via Groq API for:
- Discrepancy explanations
- Classification suggestions
- Summary generation
"""
from groq import Groq
from typing import Dict, List, Optional
from config import get_settings
import json


class GroqClient:
    """
    Groq LLM integration for AI-powered GST reconciliation assistance.
    
    Uses: llama-3.3-70b-versatile
    
    Capabilities:
    1. Explain discrepancies in simple terms for CAs
    2. Suggest classifications for unmatched invoices
    3. Summarize reconciliation results
    """
    
    def __init__(self):
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
    
    def _create_system_prompt(self) -> str:
        """Create the system prompt for GST expert role"""
        return """You are an expert GST (Goods and Services Tax) consultant in India, specializing in ITC (Input Tax Credit) reconciliation.

Your role is to:
1. Explain invoice discrepancies in simple, clear terms that a CA (Chartered Accountant) can understand
2. Suggest the most likely cause of mismatches
3. Recommend actions to resolve discrepancies
4. Help classify invoices for ITC recovery

Always be:
- Precise and factual
- Practical in recommendations
- Aware of GST compliance requirements
- Clear about what actions need vendor follow-up vs internal data corrections

Format responses in a clear, structured manner. Use bullet points for action items."""
    
    async def chat_with_agent(self, message: str, history: List[Dict] = None) -> str:
        """
        Chat with the AI agent as a GST expert.
        """
        if history is None:
            history = []
            
        messages = [{"role": "system", "content": self._create_system_prompt()}]
        
        # Add history
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        # Add current message
        messages.append({"role": "user", "content": message})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"
    async def explain_discrepancy(
        self, 
        pr_invoice: Dict, 
        gstr2b_invoice: Optional[Dict],
        match_status: str,
        differences: Dict
    ) -> Dict[str, str]:
        """
        Generate an explanation for a discrepancy between PR and GSTR-2B invoices.
        
        Returns: {explanation: str, suggestion: str}
        """
        # Build context
        context = f"""
Match Status: {match_status}

Purchase Register Invoice:
- Invoice No: {pr_invoice.get('invoice_no', 'N/A')}
- Vendor GSTIN: {pr_invoice.get('vendor_gstin', 'N/A')}
- Vendor Name: {pr_invoice.get('vendor_name', 'N/A')}
- Invoice Date: {pr_invoice.get('invoice_date', 'N/A')}
- Taxable Value: ₹{pr_invoice.get('taxable_value', 0):,.2f}
- IGST: ₹{pr_invoice.get('igst', 0):,.2f}
- CGST: ₹{pr_invoice.get('cgst', 0):,.2f}
- SGST: ₹{pr_invoice.get('sgst', 0):,.2f}
"""
        
        if gstr2b_invoice:
            context += f"""
GSTR-2B Invoice:
- Invoice No: {gstr2b_invoice.get('invoice_no', 'N/A')}
- Vendor GSTIN: {gstr2b_invoice.get('vendor_gstin', 'N/A')}
- Vendor Name: {gstr2b_invoice.get('vendor_name', 'N/A')}
- Invoice Date: {gstr2b_invoice.get('invoice_date', 'N/A')}
- Taxable Value: ₹{gstr2b_invoice.get('taxable_value', 0):,.2f}
- IGST: ₹{gstr2b_invoice.get('igst', 0):,.2f}
- CGST: ₹{gstr2b_invoice.get('cgst', 0):,.2f}
- SGST: ₹{gstr2b_invoice.get('sgst', 0):,.2f}

Differences:
- Taxable Value Diff: ₹{differences.get('taxable_diff', 0):,.2f}
- IGST Diff: ₹{differences.get('igst_diff', 0):,.2f}
- CGST Diff: ₹{differences.get('cgst_diff', 0):,.2f}
- SGST Diff: ₹{differences.get('sgst_diff', 0):,.2f}
"""
        else:
            context += "\nGSTR-2B Invoice: Not found"
        
        prompt = f"""Analyze this GST invoice discrepancy and provide:
1. A brief explanation of why this mismatch might have occurred (2-3 sentences)
2. A specific action recommendation for the CA

{context}

Respond in JSON format:
{{"explanation": "...", "suggestion": "..."}}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._create_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            
            # Try to parse JSON response
            try:
                result = json.loads(content)
                return {
                    "explanation": result.get("explanation", content),
                    "suggestion": result.get("suggestion", "Review with vendor")
                }
            except json.JSONDecodeError:
                return {
                    "explanation": content,
                    "suggestion": "Review the discrepancy and contact vendor if needed"
                }
                
        except Exception as e:
            return {
                "explanation": f"Unable to generate AI explanation: {str(e)}",
                "suggestion": "Manual review required"
            }
    
    async def suggest_classification(
        self, 
        pr_invoice: Dict, 
        gstr2b_invoice: Optional[Dict],
        match_status: str
    ) -> Dict:
        """
        Suggest a classification for an unmatched/mismatched invoice.
        
        Returns: {category: str, reason: str, confidence: float}
        """
        context = f"""
Match Status: {match_status}
Invoice No: {pr_invoice.get('invoice_no', 'N/A')}
Vendor GSTIN: {pr_invoice.get('vendor_gstin', 'N/A')}
Taxable Value: ₹{pr_invoice.get('taxable_value', 0):,.2f}
"""
        
        if gstr2b_invoice:
            context += f"GSTR-2B Taxable: ₹{gstr2b_invoice.get('taxable_value', 0):,.2f}"
        
        prompt = f"""Based on this GST reconciliation result, suggest the most appropriate classification:

{context}

Available categories:
- recoverable: ITC can be claimed
- irrecoverable: ITC cannot be claimed (invalid GSTIN, cancelled registration, etc.)
- pending_vendor: Waiting on vendor to file returns
- data_entry_error: Our internal data entry mistake
- timing_difference: Will reconcile in next period
- under_review: Needs further investigation

Respond in JSON format:
{{"category": "...", "reason": "...", "confidence": 0.0-1.0}}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._create_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            
            try:
                result = json.loads(content)
                return {
                    "category": result.get("category", "under_review"),
                    "reason": result.get("reason", "AI classification"),
                    "confidence": float(result.get("confidence", 0.5))
                }
            except json.JSONDecodeError:
                return {
                    "category": "under_review",
                    "reason": "Unable to parse AI response",
                    "confidence": 0.0
                }
                
        except Exception as e:
            return {
                "category": "under_review",
                "reason": f"AI error: {str(e)}",
                "confidence": 0.0
            }
    
    async def summarize_reconciliation(
        self, 
        stats: Dict, 
        client_name: str,
        return_period: str
    ) -> str:
        """
        Generate an executive summary of reconciliation results.
        """
        prompt = f"""Generate a brief executive summary (3-4 sentences) of this GST reconciliation:

Client: {client_name}
Return Period: {return_period}

Statistics:
- Total Records: {stats.get('total_records', 0)}
- Auto-Matched: {stats.get('exact_match', 0)} ({stats.get('match_rate', 0):.1f}%)
- Amount Mismatches: {stats.get('amount_mismatch', 0)}
- GSTIN Mismatches: {stats.get('gstin_mismatch', 0)}
- In PR Only: {stats.get('pr_only', 0)}
- In GSTR-2B Only: {stats.get('gstr2b_only', 0)}
- Total Discrepancies: {stats.get('discrepancies', 0)}

Be concise and focus on actionable insights for the CA."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._create_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Reconciliation completed with {stats.get('match_rate', 0):.1f}% match rate. {stats.get('discrepancies', 0)} discrepancies require review."


    async def analyze_client_risk(
        self,
        client_name: str,
        stats: Dict
    ) -> str:
        """
        Generate a detailed AI risk analysis based on client reconciliation history.
        Falls back to a computed local analysis if Groq API is unavailable.
        """
        avg_match = stats.get('avg_match_rate', 0)
        total_runs = stats.get('total_runs', 0)
        total_disc = stats.get('total_discrepancies', 0)
        avg_disc = stats.get('avg_discrepancies', 0)
        itc_risk = stats.get('total_itc_at_risk', 0)

        prompt = f"""Conduct a detailed risk analysis for the GST client: {client_name} based on their historical reconciliation data.

Historical Reconciliation Statistics:
- Total Reconciliations Run: {total_runs}
- Average Match Rate: {avg_match:.1f}%
- Total Discrepancies Found: {total_disc}
- Average Discrepancies per Run: {avg_disc:.1f}
- Highest Mismatch Count in a Run: {stats.get('max_mismatch', 0)}
- Most Common Issue: {stats.get('most_common_issue', 'Data Entry Errors')}

As an expert GST Consultant, provide a professional, structured overview of their tax compliance risk. Include:
1. Overall Risk Profile (Low/Medium/High) and why.
2. Key areas of concern based on the statistics.
3. Recommendations to improve their match rate and ITC claim eligibility.

Respond comprehensively but directly, suitable for a dashboard display. Keep formatting extremely clean using markdown."""

        # Try Groq AI first
        if self.client and getattr(self, '_api_key_valid', True):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": self._create_system_prompt()},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4,
                    max_tokens=600
                )
                return response.choices[0].message.content
            except Exception as e:
                error_str = str(e).lower()
                # Mark API key invalid to skip future retries in this session
                if "auth" in error_str or "api key" in error_str or "unauthorized" in error_str:
                    self._api_key_valid = False
                print(f"⚠️ Groq API error: {e} — switching to local analysis")

        # Fallback: generate analysis locally based on stats
        return self._local_risk_analysis(client_name, stats)

    def _local_risk_analysis(self, client_name: str, stats: Dict) -> str:
        """Generate a rule-based risk analysis when Groq is unavailable."""
        avg_match = stats.get('avg_match_rate', 0)
        total_runs = stats.get('total_runs', 0)
        total_disc = stats.get('total_discrepancies', 0)
        avg_disc = stats.get('avg_discrepancies', 0)
        itc_risk = stats.get('total_itc_at_risk', 0)

        if avg_match >= 85:
            risk_level = "🟢 **Low Risk**"
            risk_reason = f"with a strong average match rate of {avg_match:.1f}%, indicating well-maintained records and regular vendor follow-ups."
        elif avg_match >= 65:
            risk_level = "🟡 **Medium Risk**"
            risk_reason = f"with an average match rate of {avg_match:.1f}%, suggesting room for improvement in invoice tracking and vendor communication."
        else:
            risk_level = "🔴 **High Risk**"
            risk_reason = f"with a low average match rate of {avg_match:.1f}%, indicating significant gaps in invoice matching that require immediate attention."

        concerns = []
        if avg_match < 75:
            concerns.append(f"- **Low Match Rate ({avg_match:.1f}%):** A large portion of invoices are not matching, putting ITC claims at risk.")
        if avg_disc > 5:
            concerns.append(f"- **High Discrepancy Count ({avg_disc:.1f}/run):** Frequent mismatches suggest systemic data entry or vendor filing issues.")
        if itc_risk > 0:
            concerns.append(f"- **ITC at Risk (₹{itc_risk:,.2f}):** Total ITC across all runs that may not be claimable due to mismatches.")
        if not concerns:
            concerns.append("- No major concerns detected based on current reconciliation data.")

        recommendations = []
        if avg_match < 85:
            recommendations.append("- **Vendor Communication:** Send monthly reconciliation reports to all vendors with discrepancies to ensure timely GSTR-1 filings.")
        if avg_disc > 3:
            recommendations.append("- **Data Entry Review:** Implement a double-check process for invoice data entry to reduce internal errors.")
        recommendations.append("- **Regular Reconciliation:** Run reconciliation monthly (not quarterly) to catch issues early and improve match rates.")
        if avg_match < 70:
            recommendations.append("- **GSTIN Verification:** Validate all vendor GSTINs before processing invoices to reduce invalid GSTIN mismatches.")

        return f"""## Risk Profile: {risk_level}

{client_name} is classified as **{risk_level.split("**")[1]}** {risk_reason}

---

### 📊 Key Statistics
| Metric | Value |
|---|---|
| Total Reconciliations | {total_runs} |
| Average Match Rate | {avg_match:.1f}% |
| Total Discrepancies | {total_disc} |
| Avg Discrepancies/Run | {avg_disc:.1f} |

---

### ⚠️ Areas of Concern
{chr(10).join(concerns)}

---

### ✅ Recommendations
{chr(10).join(recommendations)}

---
*Analysis generated from historical reconciliation data.*"""


# Singleton instance
_groq_client: Optional[GroqClient] = None


def get_groq_client() -> GroqClient:
    """Get or create Groq client instance"""
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client

