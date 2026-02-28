"""
File Parser for Excel/CSV files
Handles Purchase Register and GSTR-2B file formats
"""
import pandas as pd
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from io import BytesIO
import re


class FileParser:
    """
    Parser for GST-related Excel/CSV files.
    
    Supports:
    - Purchase Register (various formats)
    - GSTR-2B (government format)
    """
    
    # Common column name mappings for Purchase Register
    PR_COLUMN_MAPPINGS = {
        # Invoice Number
        "invoice_no": [
            "invoice no", "invoice number", "inv no", "inv. no", "bill no",
            "bill number", "invoice_no", "invoiceno", "document no", "doc no",
            "voucher no", "vch no", "serial no", "sr no"
        ],
        # Invoice Date
        "invoice_date": [
            "invoice date", "inv date", "bill date", "date", "invoice_date",
            "invoicedate", "document date", "doc date", "voucher date", "vch date"
        ],
        # Vendor GSTIN
        "vendor_gstin": [
            "gstin", "gstin/uin", "vendor gstin", "supplier gstin", "gstin no",
            "gst no", "gstin of supplier", "party gstin", "vendor_gstin",
            "gstin number", "party gst", "gst number"
        ],
        # Vendor Name
        "vendor_name": [
            "vendor name", "supplier name", "party name", "name of supplier",
            "vendor", "supplier", "party", "vendor_name", "ledger name",
            "account name", "party/ledger name"
        ],
        # Taxable Value
        "taxable_value": [
            "taxable value", "taxable amount", "assessable value", "base amount",
            "taxable", "taxable_value", "net amount", "taxable amt", "basic amount"
        ],
        # IGST
        "igst": [
            "igst", "igst amount", "integrated tax", "igst amt", "igst @"
        ],
        # CGST
        "cgst": [
            "cgst", "cgst amount", "central tax", "cgst amt", "cgst @"
        ],
        # SGST
        "sgst": [
            "sgst", "sgst amount", "state tax", "sgst amt", "utgst", "sgst @"
        ],
        # Cess
        "cess": [
            "cess", "cess amount", "cess amt"
        ],
        # Total Tax
        "total_tax": [
            "total tax", "tax amount", "gst amount", "total gst", "total_tax",
            "tax total", "total tax amount"
        ],
        # Invoice Value
        "invoice_value": [
            "invoice value", "total amount", "gross amount", "invoice amount",
            "total value", "invoice_value", "bill amount", "total invoice value"
        ]
    }
    
    # GSTR-2B specific column mappings
    GSTR2B_COLUMN_MAPPINGS = {
        "invoice_no": [
            "invoice no", "inum", "invoice number", "inv no", "bill no",
            "invoice no.", "inv. no."
        ],
        "invoice_date": [
            "invoice date", "idt", "date", "inv date", "invoice dt"
        ],
        "vendor_gstin": [
            "gstin of supplier", "ctin", "gstin", "supplier gstin",
            "gstin/uin of supplier", "supplier gst"
        ],
        "vendor_name": [
            "trade/legal name", "trdnm", "supplier name", "trade name",
            "legal name", "name of supplier"
        ],
        "taxable_value": [
            "taxable value", "txval", "taxable amt"
        ],
        "igst": [
            "integrated tax", "iamt", "igst", "igst amount"
        ],
        "cgst": [
            "central tax", "camt", "cgst", "cgst amount"
        ],
        "sgst": [
            "state/ut tax", "samt", "sgst", "sgst amount", "state tax"
        ],
        "cess": [
            "cess", "csamt", "cess amount"
        ],
        "return_period": [
            "return period", "rtnprd", "period"
        ],
        "itc_available": [
            "itc availability", "itcavl", "itc avl", "itc"
        ]
    }
    
    def __init__(self):
        self.errors: List[Dict] = []
    
    def _find_column(
        self, 
        df_columns: List[str], 
        target_names: List[str]
    ) -> Optional[str]:
        """Find a column by checking against multiple possible names"""
        df_cols_lower = {col.lower().strip(): col for col in df_columns}
        
        for target in target_names:
            if target.lower() in df_cols_lower:
                return df_cols_lower[target.lower()]
        
        return None
    
    def _parse_date(self, value) -> Optional[str]:
        """Parse date value to ISO format"""
        if pd.isna(value):
            return None
        
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d")
        
        # Try common date formats
        formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d",
            "%d.%m.%Y", "%d %b %Y", "%d %B %Y",
            "%m/%d/%Y", "%m-%d-%Y", "%d/%m/%y", "%d-%m-%y"
        ]
        
        str_value = str(value).strip()
        
        for fmt in formats:
            try:
                return datetime.strptime(str_value, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        
        return None
    
    def _parse_amount(self, value) -> float:
        """Parse amount value to float"""
        if pd.isna(value):
            return 0.0
        
        if isinstance(value, (int, float)):
            return float(value)
        
        # Remove currency symbols, commas, and spaces
        str_value = str(value).strip()
        str_value = re.sub(r'[₹$,\s]', '', str_value)
        
        try:
            return float(str_value)
        except ValueError:
            return 0.0
    
    def _parse_gstin(self, value, row_num: int = None) -> Optional[str]:
        """Parse and validate GSTIN — lenient mode, keeps value even if not 15 chars"""
        if pd.isna(value):
            return None
        
        gstin = str(value).upper().strip().replace(" ", "")
        
        if not gstin:
            return None
        
        # Warn if not standard 15-character GSTIN, but still keep it
        if len(gstin) != 15:
            self.errors.append({
                "row": row_num or 0,
                "error": f"GSTIN '{gstin}' is {len(gstin)} chars (expected 15). Included with warning."
            })
        
        return gstin
    
    def parse_purchase_register(
        self, 
        file_content: bytes, 
        file_name: str
    ) -> Tuple[List[Dict], List[str]]:
        """
        Parse Purchase Register file (Excel or CSV)
        
        Returns: (list of invoices, list of column names found)
        """
        self.errors = []
        invoices = []
        
        # Determine file type
        try:
            if file_name.lower().endswith('.csv'):
                df = pd.read_csv(BytesIO(file_content))
            else:
                # Try reading with header on first row, fall back to skiprows if needed
                df = pd.read_excel(BytesIO(file_content))
        except Exception as e:
            raise ValueError(f"Cannot read file '{file_name}': {e}")
        
        # Drop fully empty rows
        df = df.dropna(how='all')
        
        # Map columns
        column_map = {}
        for field, possible_names in self.PR_COLUMN_MAPPINGS.items():
            found_col = self._find_column(df.columns.tolist(), possible_names)
            if found_col:
                column_map[field] = found_col
        
        # Check required columns
        required = ["invoice_no", "vendor_gstin"]
        missing = [f for f in required if f not in column_map]
        
        if missing:
            available_cols = ", ".join(df.columns.tolist()[:20])
            self.errors.append({
                "row": 0,
                "error": (
                    f"Missing required columns: {missing}. "
                    f"Available columns in file: [{available_cols}]. "
                    f"Please ensure your PR file has 'Invoice No' and 'GSTIN' columns."
                )
            })
            return [], df.columns.tolist()
        
        # Parse rows
        for idx, row in df.iterrows():
            try:
                invoice_no = str(row.get(column_map.get("invoice_no", ""), "")).strip()
                vendor_gstin = self._parse_gstin(
                    row.get(column_map.get("vendor_gstin", "")),
                    row_num=idx + 2
                )
                
                # Skip empty rows (both invoice_no and vendor_gstin must be present)
                if not invoice_no or not vendor_gstin:
                    continue
                
                invoice = {
                    "invoice_no": invoice_no,
                    "invoice_date": self._parse_date(row.get(column_map.get("invoice_date", ""))),
                    "vendor_gstin": vendor_gstin,
                    "vendor_name": str(row.get(column_map.get("vendor_name", ""), "")).strip() or None,
                    "taxable_value": self._parse_amount(row.get(column_map.get("taxable_value", ""), 0)),
                    "igst": self._parse_amount(row.get(column_map.get("igst", ""), 0)),
                    "cgst": self._parse_amount(row.get(column_map.get("cgst", ""), 0)),
                    "sgst": self._parse_amount(row.get(column_map.get("sgst", ""), 0)),
                    "cess": self._parse_amount(row.get(column_map.get("cess", ""), 0)),
                    "total_tax": 0,
                    "invoice_value": self._parse_amount(row.get(column_map.get("invoice_value", ""), 0)),
                    "row_number": idx + 2,  # Excel row (1-indexed + header)
                    "source": "purchase_register"
                }
                
                # Calculate total tax if not provided
                if column_map.get("total_tax"):
                    invoice["total_tax"] = self._parse_amount(row.get(column_map["total_tax"], 0))
                else:
                    invoice["total_tax"] = invoice["igst"] + invoice["cgst"] + invoice["sgst"] + invoice["cess"]
                
                # Calculate invoice value if not provided
                if invoice["invoice_value"] == 0:
                    invoice["invoice_value"] = invoice["taxable_value"] + invoice["total_tax"]
                
                invoices.append(invoice)
                
            except Exception as e:
                self.errors.append({
                    "row": idx + 2,
                    "error": str(e)
                })
        
        return invoices, df.columns.tolist()
    
    def parse_gstr2b(
        self, 
        file_content: bytes, 
        file_name: str
    ) -> Tuple[List[Dict], List[str]]:
        """
        Parse GSTR-2B file (Excel or CSV)
        
        Returns: (list of invoices, list of column names found)
        """
        self.errors = []
        invoices = []
        
        # Determine file type
        try:
            if file_name.lower().endswith('.csv'):
                df = pd.read_csv(BytesIO(file_content))
            else:
                df = pd.read_excel(BytesIO(file_content))
        except Exception as e:
            raise ValueError(f"Cannot read file '{file_name}': {e}")
        
        # Drop fully empty rows
        df = df.dropna(how='all')
        
        # Map columns
        column_map = {}
        for field, possible_names in self.GSTR2B_COLUMN_MAPPINGS.items():
            found_col = self._find_column(df.columns.tolist(), possible_names)
            if found_col:
                column_map[field] = found_col
        
        # Check required columns
        required = ["invoice_no", "vendor_gstin"]
        missing = [f for f in required if f not in column_map]
        
        if missing:
            available_cols = ", ".join(df.columns.tolist()[:20])
            self.errors.append({
                "row": 0,
                "error": (
                    f"Missing required columns in GSTR-2B: {missing}. "
                    f"Available columns: [{available_cols}]. "
                    f"Please ensure your GSTR-2B file has 'Invoice No' and 'GSTIN' columns."
                )
            })
            return [], df.columns.tolist()
        
        # Parse rows
        for idx, row in df.iterrows():
            try:
                invoice_no = str(row.get(column_map.get("invoice_no", ""), "")).strip()
                vendor_gstin = self._parse_gstin(
                    row.get(column_map.get("vendor_gstin", "")),
                    row_num=idx + 2
                )
                
                # Skip rows that are missing both key fields
                if not invoice_no or not vendor_gstin:
                    continue
                
                invoice = {
                    "invoice_no": invoice_no,
                    "invoice_date": self._parse_date(row.get(column_map.get("invoice_date", ""))),
                    "vendor_gstin": vendor_gstin,
                    "vendor_name": str(row.get(column_map.get("vendor_name", ""), "")).strip() or None,
                    "taxable_value": self._parse_amount(row.get(column_map.get("taxable_value", ""), 0)),
                    "igst": self._parse_amount(row.get(column_map.get("igst", ""), 0)),
                    "cgst": self._parse_amount(row.get(column_map.get("cgst", ""), 0)),
                    "sgst": self._parse_amount(row.get(column_map.get("sgst", ""), 0)),
                    "cess": self._parse_amount(row.get(column_map.get("cess", ""), 0)),
                    "total_tax": 0,
                    "invoice_value": 0,
                    "return_period": str(row.get(column_map.get("return_period", ""), "")).strip() or None,
                    "itc_available": True,
                    "row_number": idx + 2,
                    "source": "gstr2b"
                }
                
                # Calculate totals
                invoice["total_tax"] = invoice["igst"] + invoice["cgst"] + invoice["sgst"] + invoice["cess"]
                invoice["invoice_value"] = invoice["taxable_value"] + invoice["total_tax"]
                
                # Parse ITC availability
                itc_val = row.get(column_map.get("itc_available", ""), "")
                if itc_val:
                    invoice["itc_available"] = str(itc_val).upper() in ["Y", "YES", "TRUE", "1"]
                
                invoices.append(invoice)
                
            except Exception as e:
                self.errors.append({
                    "row": idx + 2,
                    "error": str(e)
                })
        
        return invoices, df.columns.tolist()
    
    def get_errors(self) -> List[Dict]:
        """Get parsing errors"""
        return self.errors


def get_file_parser() -> FileParser:
    """Create a new FileParser instance for each request (no singleton to avoid state leakage)"""
    return FileParser()
