"""
Supabase Service - Database operations
"""
from supabase import create_client, Client
from config import get_settings
from typing import Optional, List, Dict, Any


class SupabaseService:
    """Service for interacting with Supabase database"""
    
    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
    
    # ============================================
    # CLIENTS
    # ============================================
    
    async def get_clients(self, user_id: str) -> List[Dict]:
        """Get all clients accessible by user"""
        response = self.client.table("clients").select("*").execute()
        return response.data
    
    async def get_client(self, client_id: str) -> Optional[Dict]:
        """Get a single client by ID"""
        response = self.client.table("clients").select("*").eq("id", client_id).single().execute()
        return response.data
    
    async def create_client(self, data: Dict, user_id: str) -> Dict:
        """Create a new client"""
        data["created_by"] = user_id
        response = self.client.table("clients").insert(data).execute()
        return response.data[0]
    
    # ============================================
    # GSTINS
    # ============================================
    
    async def get_gstins_for_client(self, client_id: str) -> List[Dict]:
        """Get all GSTINs for a client"""
        response = self.client.table("gstins").select("*").eq("client_id", client_id).execute()
        return response.data
    
    async def create_gstin(self, data: Dict) -> Dict:
        """Create a new GSTIN"""
        response = self.client.table("gstins").insert(data).execute()
        return response.data[0]
    
    # ============================================
    # RECONCILIATION RUNS
    # ============================================
    
    async def create_reconciliation_run(self, data: Dict, user_id: str) -> Dict:
        """Create a new reconciliation run"""
        data["created_by"] = user_id
        data["status"] = "pending"
        response = self.client.table("reconciliation_runs").insert(data).execute()
        return response.data[0]
    
    async def get_reconciliation_run(self, run_id: str) -> Optional[Dict]:
        """Get a reconciliation run by ID"""
        response = self.client.table("reconciliation_runs").select("*").eq("id", run_id).single().execute()
        return response.data
    
    async def update_reconciliation_run(self, run_id: str, data: Dict) -> Dict:
        """Update a reconciliation run"""
        response = self.client.table("reconciliation_runs").update(data).eq("id", run_id).execute()
        return response.data[0]
    
    async def get_runs_for_client(self, client_id: str) -> List[Dict]:
        """Get all reconciliation runs for a client"""
        response = (
            self.client.table("reconciliation_runs")
            .select("*")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data
    
    # ============================================
    # INVOICES
    # ============================================
    
    async def bulk_insert_invoices(self, invoices: List[Dict]) -> List[Dict]:
        """Bulk insert invoices"""
        response = self.client.table("invoices").insert(invoices).execute()
        return response.data
    
    async def get_invoices_for_run(self, run_id: str, source: Optional[str] = None) -> List[Dict]:
        """Get all invoices for a run, optionally filtered by source"""
        query = self.client.table("invoices").select("*").eq("run_id", run_id)
        if source:
            query = query.eq("source", source)
        response = query.execute()
        return response.data
    
    # ============================================
    # MATCH RESULTS
    # ============================================
    
    async def bulk_insert_match_results(self, results: List[Dict]) -> List[Dict]:
        """Bulk insert match results"""
        response = self.client.table("match_results").insert(results).execute()
        return response.data
    
    async def get_match_results_for_run(self, run_id: str, status: Optional[str] = None) -> List[Dict]:
        """Get all match results for a run"""
        query = self.client.table("match_results").select("*").eq("run_id", run_id)
        if status:
            query = query.eq("match_status", status)
        response = query.execute()
        return response.data
    
    async def get_match_result(self, result_id: str) -> Optional[Dict]:
        """Get a single match result with related invoices"""
        response = (
            self.client.table("match_results")
            .select("*, pr_invoice:invoices!pr_invoice_id(*), gstr2b_invoice:invoices!gstr2b_invoice_id(*)")
            .eq("id", result_id)
            .single()
            .execute()
        )
        return response.data
    
    async def update_match_result(self, result_id: str, data: Dict) -> Dict:
        """Update a match result (e.g., add AI explanation)"""
        response = self.client.table("match_results").update(data).eq("id", result_id).execute()
        return response.data[0]
    
    # ============================================
    # CLASSIFICATIONS
    # ============================================
    
    async def create_classification(self, data: Dict, user_id: str) -> Dict:
        """Create a classification"""
        data["classified_by"] = user_id
        response = self.client.table("classifications").insert(data).execute()
        return response.data[0]
    
    async def get_classifications_for_run(self, run_id: str) -> List[Dict]:
        """Get all classifications for a run via match results"""
        response = (
            self.client.table("classifications")
            .select("*, match_result:match_results!match_result_id(run_id)")
            .execute()
        )
        # Filter by run_id
        return [c for c in response.data if c.get("match_result", {}).get("run_id") == run_id]
    
    # ============================================
    # AUDIT LOGS
    # ============================================
    
    async def create_audit_log(
        self, 
        user_id: str, 
        action: str, 
        entity_type: str = None, 
        entity_id: str = None,
        old_values: Dict = None,
        new_values: Dict = None
    ) -> Dict:
        """Create an audit log entry"""
        data = {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "old_values": old_values,
            "new_values": new_values
        }
        response = self.client.table("audit_logs").insert(data).execute()
        return response.data[0]


# Singleton instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
