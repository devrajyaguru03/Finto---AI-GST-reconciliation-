"""
Vendor Email Template Generator
Generates professional copy-paste ready emails for each discrepancy type
"""
from fastapi import APIRouter, Header, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from core.db import get_db


router = APIRouter()


class DiscrepancyDetail(BaseModel):
    vendor_name: str
    vendor_gstin: Optional[str] = None
    invoice_no: str
    invoice_date: Optional[str] = None
    pr_amount: float = 0
    gstr2b_amount: float = 0
    difference: float = 0
    discrepancy_type: str  # "amount_mismatch", "pr_only", "gstr2b_only", "gstin_mismatch"
    your_company_name: str = "Our Company"
    return_period: Optional[str] = None


class EmailGenerateRequest(BaseModel):
    discrepancies: List[DiscrepancyDetail]
    sender_name: str = "Accounts Team"
    sender_company: str = "Our Company"


class EmailTemplate(BaseModel):
    to_vendor: str
    subject: str
    body: str
    discrepancy_type: str
    invoice_count: int


class EmailGenerateResponse(BaseModel):
    emails: List[EmailTemplate]
    total_vendors: int


@router.post("/generate", response_model=EmailGenerateResponse)
async def generate_emails(
    data: EmailGenerateRequest,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Generate vendor emails for list of discrepancies"""
    
    # Group discrepancies by vendor
    vendor_groups = {}
    for d in data.discrepancies:
        key = d.vendor_name or d.vendor_gstin or "Unknown Vendor"
        if key not in vendor_groups:
            vendor_groups[key] = []
        vendor_groups[key].append(d)
    
    emails = []
    for vendor_name, discrepancies in vendor_groups.items():
        email = _generate_vendor_email(
            vendor_name=vendor_name,
            discrepancies=discrepancies,
            sender_name=data.sender_name,
            sender_company=data.sender_company
        )
        emails.append(email)
    
    # Log to Supabase
    try:
        db = get_db()
        user_email = "anonymous"
        if authorization:
            token = authorization.replace("Bearer ", "").strip()
            sess = db.table("sessions").select("email").eq("token", token).execute()
            if sess.data:
                user_email = sess.data[0]["email"]
        client_ip = request.client.host if request and request.client else None
        db.table("activity_logs").insert({
            "action": "email_generated",
            "email": user_email,
            "details": {
                "vendors": list(vendor_groups.keys()),
                "email_count": len(emails),
                "total_discrepancies": len(data.discrepancies)
            },
            "ip_address": client_ip
        }).execute()
    except Exception as e:
        print(f"⚠️ Email logging error: {e}")
    
    return EmailGenerateResponse(
        emails=emails,
        total_vendors=len(vendor_groups)
    )


def _generate_vendor_email(
    vendor_name: str,
    discrepancies: List[DiscrepancyDetail],
    sender_name: str,
    sender_company: str
) -> EmailTemplate:
    """Generate email for a specific vendor based on their discrepancies"""
    
    # Determine primary discrepancy type
    types = set(d.discrepancy_type for d in discrepancies)
    
    if "pr_only" in types and len(types) == 1:
        return _email_missing_in_gstr2b(vendor_name, discrepancies, sender_name, sender_company)
    elif "gstr2b_only" in types and len(types) == 1:
        return _email_missing_in_pr(vendor_name, discrepancies, sender_name, sender_company)
    elif "gstin_mismatch" in types:
        return _email_gstin_mismatch(vendor_name, discrepancies, sender_name, sender_company)
    else:
        return _email_amount_mismatch(vendor_name, discrepancies, sender_name, sender_company)


def _format_amount(amount: float) -> str:
    """Format amount in INR"""
    return f"₹{abs(amount):,.2f}"


def _invoice_table(discrepancies: List[DiscrepancyDetail]) -> str:
    """Generate invoice details table for email body"""
    lines = []
    lines.append("Invoice Details:")
    lines.append("-" * 60)
    
    for i, d in enumerate(discrepancies, 1):
        lines.append(f"{i}. Invoice No: {d.invoice_no}")
        if d.invoice_date:
            lines.append(f"   Date: {d.invoice_date}")
        if d.pr_amount > 0:
            lines.append(f"   Our Records: {_format_amount(d.pr_amount)}")
        if d.gstr2b_amount > 0:
            lines.append(f"   GSTR-2B Amount: {_format_amount(d.gstr2b_amount)}")
        if d.difference != 0:
            lines.append(f"   Difference: {_format_amount(d.difference)}")
        if d.vendor_gstin:
            lines.append(f"   GSTIN: {d.vendor_gstin}")
        lines.append("")
    
    lines.append("-" * 60)
    return "\n".join(lines)


def _email_amount_mismatch(
    vendor_name: str,
    discrepancies: List[DiscrepancyDetail],
    sender_name: str,
    sender_company: str
) -> EmailTemplate:
    """Email for amount mismatch discrepencies"""
    total_diff = sum(abs(d.difference) for d in discrepancies)
    invoice_nos = ", ".join(d.invoice_no for d in discrepancies[:3])
    if len(discrepancies) > 3:
        invoice_nos += f" and {len(discrepancies) - 3} more"
    
    subject = f"GST Reconciliation: Amount Discrepancy in {len(discrepancies)} Invoice(s) — Action Required"
    
    body = f"""Dear {vendor_name} Team,

Greetings from {sender_company}.

During our GST reconciliation for the current return period, we have identified amount discrepancies in the following invoice(s) between our Purchase Register and your GSTR-2B filing:

{_invoice_table(discrepancies)}

Total Discrepancy: {_format_amount(total_diff)}

Request:
We kindly request you to:
1. Verify the invoice amounts in your records
2. If there is an error, please issue a Credit/Debit Note as applicable
3. Ensure the corrected amounts are reflected in your next GST return filing

This is important for us to correctly claim Input Tax Credit (ITC) under GST regulations.

Please respond at your earliest convenience, preferably within 7 working days.

Thank you for your cooperation.

Best regards,
{sender_name}
{sender_company}
"""
    
    return EmailTemplate(
        to_vendor=vendor_name,
        subject=subject,
        body=body.strip(),
        discrepancy_type="amount_mismatch",
        invoice_count=len(discrepancies)
    )


def _email_missing_in_gstr2b(
    vendor_name: str,
    discrepancies: List[DiscrepancyDetail],
    sender_name: str,
    sender_company: str
) -> EmailTemplate:
    """Email for invoices in PR but missing in GSTR-2B"""
    invoice_nos = ", ".join(d.invoice_no for d in discrepancies[:3])
    if len(discrepancies) > 3:
        invoice_nos += f" and {len(discrepancies) - 3} more"
    
    total_tax = sum(d.pr_amount for d in discrepancies)
    
    subject = f"GST Reconciliation: {len(discrepancies)} Invoice(s) Missing in GSTR-2B — Please Upload"
    
    body = f"""Dear {vendor_name} Team,

Greetings from {sender_company}.

During our GST reconciliation, we found that the following invoice(s) from your end are present in our Purchase Register but are NOT appearing in your GSTR-2B filing on the GST portal:

{_invoice_table(discrepancies)}

Total Tax at Risk: {_format_amount(total_tax)}

Request:
We kindly request you to:
1. Verify if these invoices have been included in your GSTR-1 filing
2. If not filed, please include them in your upcoming GSTR-1 return
3. If already filed, please share the filing acknowledgment for our records

Without these invoices appearing in GSTR-2B, we are unable to claim Input Tax Credit (ITC), which directly impacts our tax liability.

Please prioritize this matter and respond within 7 working days.

Thank you for your prompt attention.

Best regards,
{sender_name}
{sender_company}
"""
    
    return EmailTemplate(
        to_vendor=vendor_name,
        subject=subject,
        body=body.strip(),
        discrepancy_type="pr_only",
        invoice_count=len(discrepancies)
    )


def _email_missing_in_pr(
    vendor_name: str,
    discrepancies: List[DiscrepancyDetail],
    sender_name: str,
    sender_company: str
) -> EmailTemplate:
    """Email for invoices in GSTR-2B but missing in PR (internal + vendor notification)"""
    subject = f"GST Reconciliation: {len(discrepancies)} Invoice(s) in GSTR-2B Not in Our Records — Clarification Needed"
    
    body = f"""Dear {vendor_name} Team,

Greetings from {sender_company}.

During our GST reconciliation, we found that the following invoice(s) appear in your GSTR-2B filing but are NOT present in our Purchase Register:

{_invoice_table(discrepancies)}

Request:
We kindly request you to:
1. Confirm if these invoices were issued to our company ({sender_company})
2. If yes, please share copies of these invoices so we can update our records
3. If these were issued in error or to a different entity, please file necessary amendments

We need to reconcile these entries before filing our GST returns.

Please respond within 7 working days.

Thank you for your cooperation.

Best regards,
{sender_name}
{sender_company}
"""
    
    return EmailTemplate(
        to_vendor=vendor_name,
        subject=subject,
        body=body.strip(),
        discrepancy_type="gstr2b_only",
        invoice_count=len(discrepancies)
    )


def _email_gstin_mismatch(
    vendor_name: str,
    discrepancies: List[DiscrepancyDetail],
    sender_name: str,
    sender_company: str
) -> EmailTemplate:
    """Email for GSTIN mismatch"""
    subject = f"GST Reconciliation: GSTIN Mismatch in {len(discrepancies)} Invoice(s) — Correction Required"
    
    body = f"""Dear {vendor_name} Team,

Greetings from {sender_company}.

During our GST reconciliation, we have identified a GSTIN mismatch in the following invoice(s):

{_invoice_table(discrepancies)}

The GSTIN on the invoice does not match our records or the GSTR-2B data. This may be due to:
- Data entry error in GSTIN
- Invoice issued under a different GSTIN branch
- Incorrect GSTIN used during filing

Request:
We kindly request you to:
1. Verify the correct GSTIN for these transactions
2. Issue corrected invoices with the right GSTIN if necessary
3. Ensure the correct GSTIN is reflected in your GSTR-1 filing

Correct GSTIN is essential for us to claim Input Tax Credit.

Please respond within 7 working days.

Thank you for your cooperation.

Best regards,
{sender_name}
{sender_company}
"""
    
    return EmailTemplate(
        to_vendor=vendor_name,
        subject=subject,
        body=body.strip(),
        discrepancy_type="gstin_mismatch",
        invoice_count=len(discrepancies)
    )
