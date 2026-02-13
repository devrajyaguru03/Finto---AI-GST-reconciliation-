"""
File Parser Service
Parses Purchase Register (Excel/CSV) and GSTR-2B (JSON) files
"""
import pandas as pd
import json
from typing import Dict, List, Any, BinaryIO
from datetime import datetime
from models.schemas import InvoiceBase


class FileParser:
    """Service for parsing GST-related files"""
    
    # Column mappings for Purchase Register
    PR_COLUMN_MAPPING = {
        # Standard column names -> normalized names
        "invoice_no": ["invoice no", "invoice number", "inv no", "bill no", "invoice_no"],
        "invoice_date": ["invoice date", "inv date", "bill date", "date", "invoice_date"],
        "vendor_gstin": ["vendor gstin", "supplier gstin", "gstin", "party gstin", "vendor_gstin"],
        "vendor_name": ["vendor name", "supplier name", "party name", "name", "vendor_name"],
        "taxable_value": ["taxable value", "taxable amount", "base amount", "taxable_value"],
        "igst": ["igst", "igst amount", "integrated tax"],
        "cgst": ["cgst", "cgst amount", "central tax"],
        "sgst": ["sgst", "sgst amount", "state tax"],
        "cess": ["cess", "cess amount"],
        "invoice_value": ["invoice value", "total value", "grand total", "invoice_value"],
        "place_of_supply": ["place of supply", "pos", "state", "place_of_supply"]
    }
    
    def parse_purchase_register(self, file: BinaryIO, filename: str) -> Dict[str, Any]:
        """
        Parse Purchase Register Excel/CSV file
        
        Returns:
            Dict with 'invoices' list and 'columns' list
        """
        # Determine file type and read
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip()
        
        # Map columns
        column_map = {}
        for target, sources in self.PR_COLUMN_MAPPING.items():
            for source in sources:
                if source in df.columns:
                    column_map[source] = target
                    break
        
        df = df.rename(columns=column_map)
        
        # Parse invoices
        invoices = []
        for idx, row in df.iterrows():
            try:
                invoice = InvoiceBase(
                    invoice_no=str(row.get("invoice_no", "")).strip(),
                    invoice_date=self._parse_date(row.get("invoice_date")),
                    vendor_gstin=self._clean_gstin(row.get("vendor_gstin")),
                    vendor_name=str(row.get("vendor_name", "")).strip() or None,
                    place_of_supply=str(row.get("place_of_supply", "")).strip() or None,
                    taxable_value=self._parse_float(row.get("taxable_value", 0)),
                    igst=self._parse_float(row.get("igst", 0)),
                    cgst=self._parse_float(row.get("cgst", 0)),
                    sgst=self._parse_float(row.get("sgst", 0)),
                    cess=self._parse_float(row.get("cess", 0)),
                    invoice_value=self._parse_float(row.get("invoice_value", 0))
                )
                
                # Calculate total_tax if not provided
                invoice.total_tax = invoice.igst + invoice.cgst + invoice.sgst + invoice.cess
                
                # Only add if invoice_no is present
                if invoice.invoice_no:
                    invoices.append(invoice)
                    
            except Exception as e:
                print(f"Error parsing row {idx}: {e}")
                continue
        
        return {
            "invoices": invoices,
            "columns": list(df.columns),
            "total_rows": len(df),
            "parsed_rows": len(invoices)
        }
    
    def parse_gstr2b(self, file: BinaryIO) -> Dict[str, Any]:
        """
        Parse GSTR-2B JSON file (GST Portal format)
        
        Returns:
            Dict with 'invoices' list
        """
        data = json.load(file)
        invoices = []
        
        # GSTR-2B structure: data -> docdata -> b2b -> []
        b2b_data = self._get_nested(data, ["data", "docdata", "b2b"]) or \
                   self._get_nested(data, ["b2b"]) or []
        
        for supplier in b2b_data:
            supplier_gstin = supplier.get("ctin", "")
            supplier_name = supplier.get("trdnm", "") or supplier.get("supnm", "")
            
            # Each supplier has multiple invoices
            for inv in supplier.get("inv", []):
                try:
                    # Get items total
                    items = inv.get("itms", [])
                    taxable = sum(self._parse_float(i.get("itm_det", {}).get("txval", 0)) for i in items)
                    igst = sum(self._parse_float(i.get("itm_det", {}).get("iamt", 0)) for i in items)
                    cgst = sum(self._parse_float(i.get("itm_det", {}).get("camt", 0)) for i in items)
                    sgst = sum(self._parse_float(i.get("itm_det", {}).get("samt", 0)) for i in items)
                    cess = sum(self._parse_float(i.get("itm_det", {}).get("csamt", 0)) for i in items)
                    
                    invoice = InvoiceBase(
                        invoice_no=str(inv.get("inum", "")).strip(),
                        invoice_date=self._parse_date(inv.get("dt")),
                        vendor_gstin=supplier_gstin,
                        vendor_name=supplier_name,
                        place_of_supply=inv.get("pos", ""),
                        taxable_value=taxable or self._parse_float(inv.get("val", 0)),
                        igst=igst,
                        cgst=cgst,
                        sgst=sgst,
                        cess=cess,
                        total_tax=igst + cgst + sgst + cess,
                        invoice_value=self._parse_float(inv.get("val", 0))
                    )
                    
                    # ITC availability
                    invoice.itc_available = inv.get("itcavl", "Y") == "Y"
                    invoice.itc_reason = inv.get("rsn", None)
                    
                    if invoice.invoice_no:
                        invoices.append(invoice)
                        
                except Exception as e:
                    print(f"Error parsing GSTR-2B invoice: {e}")
                    continue
        
        return {
            "invoices": invoices,
            "total_suppliers": len(b2b_data),
            "total_invoices": len(invoices)
        }
    
    def _parse_date(self, value) -> str:
        """Parse various date formats to ISO format"""
        if pd.isna(value) or value is None:
            return None
        
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d")
        
        value = str(value).strip()
        
        # Try common formats
        formats = [
            "%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", 
            "%d-%b-%Y", "%d %b %Y", "%Y/%m/%d"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        
        return None
    
    def _parse_float(self, value) -> float:
        """Parse value to float, handling various formats"""
        if pd.isna(value) or value is None:
            return 0.0
        
        if isinstance(value, (int, float)):
            return float(value)
        
        try:
            # Remove commas and currency symbols
            cleaned = str(value).replace(",", "").replace("₹", "").strip()
            return float(cleaned)
        except (ValueError, TypeError):
            return 0.0
    
    def _clean_gstin(self, value) -> str:
        """Clean and validate GSTIN format"""
        if pd.isna(value) or value is None:
            return None
        
        gstin = str(value).strip().upper()
        
        # Basic GSTIN validation (15 characters)
        if len(gstin) == 15:
            return gstin
        
        return gstin if gstin else None
    
    def _get_nested(self, data: dict, keys: list):
        """Safely get nested dictionary value"""
        for key in keys:
            if isinstance(data, dict):
                data = data.get(key)
            else:
                return None
        return data
