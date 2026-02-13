"""
Pydantic Models/Schemas for API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime
from enum import Enum


# ============================================
# ENUMS
# ============================================

class UserRole(str, Enum):
    JUNIOR_CA = "junior_ca"
    SENIOR_CA = "senior_ca"
    ADMIN = "admin"


class ReconciliationStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    PARSING = "parsing"
    MATCHING = "matching"
    COMPLETED = "completed"
    FAILED = "failed"


class InvoiceSource(str, Enum):
    PURCHASE_REGISTER = "purchase_register"
    GSTR2B = "gstr2b"


class MatchStatus(str, Enum):
    EXACT_MATCH = "exact_match"
    AMOUNT_MISMATCH = "amount_mismatch"
    DATE_MISMATCH = "date_mismatch"
    GSTIN_MISMATCH = "gstin_mismatch"
    PR_ONLY = "pr_only"
    GSTR2B_ONLY = "gstr2b_only"
    DUPLICATE = "duplicate"


class ClassificationCategory(str, Enum):
    RECOVERABLE = "recoverable"
    IRRECOVERABLE = "irrecoverable"
    PENDING_VENDOR = "pending_vendor"
    DATA_ENTRY_ERROR = "data_entry_error"
    TIMING_DIFFERENCE = "timing_difference"
    UNDER_REVIEW = "under_review"
    WRITTEN_OFF = "written_off"


# ============================================
# CLIENT MODELS
# ============================================

class ClientBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GSTINBase(BaseModel):
    gstin: str = Field(..., pattern=r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
    legal_name: Optional[str] = None
    trade_name: Optional[str] = None
    state_code: Optional[str] = None


class GSTINCreate(GSTINBase):
    client_id: str


class GSTINResponse(GSTINBase):
    id: str
    client_id: str
    is_active: bool
    created_at: datetime


# ============================================
# INVOICE MODELS
# ============================================

class InvoiceBase(BaseModel):
    invoice_no: str
    invoice_date: Optional[date] = None
    vendor_gstin: Optional[str] = None
    vendor_name: Optional[str] = None
    place_of_supply: Optional[str] = None
    taxable_value: float = 0
    igst: float = 0
    cgst: float = 0
    sgst: float = 0
    cess: float = 0
    total_tax: float = 0
    invoice_value: float = 0


class InvoiceCreate(InvoiceBase):
    run_id: str
    source: InvoiceSource
    raw_data: Optional[dict] = None
    row_number: Optional[int] = None


class InvoiceResponse(InvoiceBase):
    id: str
    run_id: str
    source: InvoiceSource
    itc_available: bool
    created_at: datetime


# ============================================
# RECONCILIATION MODELS
# ============================================

class ReconciliationRunCreate(BaseModel):
    client_id: str
    gstin_id: str
    return_period: str  # Format: 'MM-YYYY'
    financial_year: str  # Format: 'YYYY-YY'


class ReconciliationRunResponse(BaseModel):
    id: str
    client_id: str
    gstin_id: str
    return_period: str
    financial_year: str
    status: ReconciliationStatus
    
    # Stats
    total_pr_invoices: int = 0
    total_gstr2b_invoices: int = 0
    matched_count: int = 0
    mismatch_count: int = 0
    pr_only_count: int = 0
    gstr2b_only_count: int = 0
    
    # Monetary totals
    total_pr_taxable: float = 0
    total_gstr2b_taxable: float = 0
    total_itc_claimed: float = 0
    total_itc_available: float = 0
    
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


class ReconciliationStartRequest(BaseModel):
    run_id: str


class ReconciliationStats(BaseModel):
    total_records: int
    auto_matched: int
    pending_review: int
    discrepancies: int
    match_rate: float


# ============================================
# MATCH RESULT MODELS
# ============================================

class MatchResultBase(BaseModel):
    match_status: MatchStatus
    confidence_score: Optional[float] = None
    match_rule_applied: Optional[str] = None
    taxable_diff: float = 0
    igst_diff: float = 0
    cgst_diff: float = 0
    sgst_diff: float = 0
    total_diff: float = 0


class MatchResultCreate(MatchResultBase):
    run_id: str
    pr_invoice_id: Optional[str] = None
    gstr2b_invoice_id: Optional[str] = None


class MatchResultResponse(MatchResultBase):
    id: str
    run_id: str
    pr_invoice_id: Optional[str] = None
    gstr2b_invoice_id: Optional[str] = None
    ai_explanation: Optional[str] = None
    ai_suggestion: Optional[str] = None
    created_at: datetime
    
    # Joined invoice data
    pr_invoice: Optional[InvoiceResponse] = None
    gstr2b_invoice: Optional[InvoiceResponse] = None


class MatchResultWithInvoices(MatchResultResponse):
    """Match result with joined invoice data for display"""
    pr_invoice: Optional[InvoiceResponse] = None
    gstr2b_invoice: Optional[InvoiceResponse] = None


# ============================================
# CLASSIFICATION MODELS
# ============================================

class ClassificationCreate(BaseModel):
    match_result_id: str
    category: ClassificationCategory
    reason: Optional[str] = None
    action_required: Optional[str] = None
    due_date: Optional[date] = None


class ClassificationResponse(ClassificationCreate):
    id: str
    ai_suggested: bool
    ai_confidence: Optional[float] = None
    classified_by: Optional[str] = None
    created_at: datetime


# ============================================
# FILE UPLOAD MODELS
# ============================================

class FileUploadResponse(BaseModel):
    file_path: str
    file_name: str
    file_size: int
    rows_parsed: int
    columns: List[str]


class ParsedInvoicesResponse(BaseModel):
    total_rows: int
    valid_rows: int
    error_rows: int
    invoices: List[InvoiceBase]
    errors: List[dict]


# ============================================
# AI MODELS
# ============================================

class AIExplanationRequest(BaseModel):
    match_result_id: str
    context: Optional[dict] = None


class AIExplanationResponse(BaseModel):
    match_result_id: str
    explanation: str
    suggestion: str
    confidence: float


class AIClassificationSuggestion(BaseModel):
    match_result_id: str
    suggested_category: ClassificationCategory
    reason: str
    confidence: float


class AIBatchExplanationRequest(BaseModel):
    match_result_ids: List[str]


# ============================================
# OVERRIDE MODELS
# ============================================

class OverrideCreate(BaseModel):
    match_result_id: str
    original_status: str
    new_status: str
    reason: str


class OverrideResponse(OverrideCreate):
    id: str
    overridden_by: Optional[str] = None
    approved: Optional[bool] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
