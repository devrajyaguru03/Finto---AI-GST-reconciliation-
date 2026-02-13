// Database types for Supabase
// These types mirror the database schema for type-safe queries

export type UserRole = 'junior_ca' | 'senior_ca' | 'admin'

export type ReconciliationStatus =
    | 'pending'
    | 'uploading'
    | 'parsing'
    | 'matching'
    | 'completed'
    | 'failed'

export type InvoiceSource = 'purchase_register' | 'gstr2b'

export type MatchStatus =
    | 'exact_match'
    | 'amount_mismatch'
    | 'date_mismatch'
    | 'gstin_mismatch'
    | 'pr_only'
    | 'gstr2b_only'
    | 'duplicate'

export type ClassificationCategory =
    | 'recoverable'
    | 'irrecoverable'
    | 'pending_vendor'
    | 'data_entry_error'
    | 'timing_difference'
    | 'under_review'
    | 'written_off'

export type EntityType =
    | 'client'
    | 'gstin'
    | 'vendor'
    | 'reconciliation_run'
    | 'invoice'
    | 'match_result'
    | 'classification'

// Table row types
export interface UserRoleRow {
    id: string
    user_id: string
    role: UserRole
    created_at: string
    updated_at: string
}

export interface Client {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface GSTIN {
    id: string
    client_id: string
    gstin: string
    legal_name: string | null
    trade_name: string | null
    state_code: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface UserClientAssignment {
    id: string
    user_id: string
    client_id: string
    assigned_by: string | null
    created_at: string
}

export interface Vendor {
    id: string
    client_id: string
    vendor_gstin: string
    vendor_name: string | null
    vendor_trade_name: string | null
    is_verified: boolean
    created_at: string
    updated_at: string
}

export interface ReconciliationRun {
    id: string
    client_id: string
    gstin_id: string
    return_period: string
    financial_year: string
    status: ReconciliationStatus
    purchase_register_file: string | null
    gstr2b_file: string | null
    total_pr_invoices: number
    total_gstr2b_invoices: number
    matched_count: number
    mismatch_count: number
    pr_only_count: number
    gstr2b_only_count: number
    total_pr_taxable: number
    total_gstr2b_taxable: number
    total_itc_claimed: number
    total_itc_available: number
    started_at: string | null
    completed_at: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface Invoice {
    id: string
    run_id: string
    source: InvoiceSource
    invoice_no: string
    invoice_date: string | null
    vendor_gstin: string | null
    vendor_name: string | null
    place_of_supply: string | null
    taxable_value: number
    igst: number
    cgst: number
    sgst: number
    cess: number
    total_tax: number
    invoice_value: number
    itc_available: boolean
    itc_reason: string | null
    return_period: string | null
    filing_date: string | null
    raw_data: Record<string, unknown> | null
    row_number: number | null
    created_at: string
}

export interface MatchResult {
    id: string
    run_id: string
    pr_invoice_id: string | null
    gstr2b_invoice_id: string | null
    match_status: MatchStatus
    confidence_score: number | null
    match_rule_applied: string | null
    taxable_diff: number
    igst_diff: number
    cgst_diff: number
    sgst_diff: number
    total_diff: number
    ai_explanation: string | null
    ai_suggestion: string | null
    created_at: string
    updated_at: string
}

export interface Classification {
    id: string
    match_result_id: string
    category: ClassificationCategory
    reason: string | null
    action_required: string | null
    due_date: string | null
    ai_suggested: boolean
    ai_confidence: number | null
    classified_by: string | null
    created_at: string
    updated_at: string
}

export interface Override {
    id: string
    match_result_id: string
    original_status: string
    new_status: string
    reason: string
    overridden_by: string | null
    approved: boolean | null
    approved_by: string | null
    approved_at: string | null
    rejection_reason: string | null
    created_at: string
}

export interface Note {
    id: string
    entity_type: EntityType
    entity_id: string
    content: string
    is_internal: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface AuditLog {
    id: string
    user_id: string | null
    user_email: string | null
    user_role: string | null
    action: string
    entity_type: string | null
    entity_id: string | null
    old_values: Record<string, unknown> | null
    new_values: Record<string, unknown> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

// Supabase Database type for createClient
export interface Database {
    public: {
        Tables: {
            user_roles: {
                Row: UserRoleRow
                Insert: Omit<UserRoleRow, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<UserRoleRow, 'id'>>
            }
            clients: {
                Row: Client
                Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Client, 'id'>>
            }
            gstins: {
                Row: GSTIN
                Insert: Omit<GSTIN, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<GSTIN, 'id'>>
            }
            user_client_assignments: {
                Row: UserClientAssignment
                Insert: Omit<UserClientAssignment, 'id' | 'created_at'>
                Update: Partial<Omit<UserClientAssignment, 'id'>>
            }
            vendors: {
                Row: Vendor
                Insert: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Vendor, 'id'>>
            }
            reconciliation_runs: {
                Row: ReconciliationRun
                Insert: Omit<ReconciliationRun, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<ReconciliationRun, 'id'>>
            }
            invoices: {
                Row: Invoice
                Insert: Omit<Invoice, 'id' | 'created_at'>
                Update: Partial<Omit<Invoice, 'id'>>
            }
            match_results: {
                Row: MatchResult
                Insert: Omit<MatchResult, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<MatchResult, 'id'>>
            }
            classifications: {
                Row: Classification
                Insert: Omit<Classification, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Classification, 'id'>>
            }
            overrides: {
                Row: Override
                Insert: Omit<Override, 'id' | 'created_at'>
                Update: Partial<Omit<Override, 'id'>>
            }
            notes: {
                Row: Note
                Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Note, 'id'>>
            }
            audit_logs: {
                Row: AuditLog
                Insert: Omit<AuditLog, 'id' | 'created_at'>
                Update: never
            }
        }
        Functions: {
            get_user_role: {
                Args: { uid: string }
                Returns: UserRole | null
            }
            can_access_client: {
                Args: { uid: string; cid: string }
                Returns: boolean
            }
        }
    }
}
