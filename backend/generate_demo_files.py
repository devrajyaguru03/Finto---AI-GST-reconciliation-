import sys
import os

# Ensure we can import pandas/openpyxl from the venv
sys.path.insert(0, '/Users/devrajyaguru/Downloads/gst-reconciliation-frontend/backend/venv/lib/python3.13/site-packages')

import pandas as pd

# ==========================
# PURCHASE REGISTER (PR)
# ==========================
pr_data = {
    'Invoice No': ['INV-001', 'INV-002', 'INV-003', 'INV-004', 'INV-005', 'INV-006', 'INV-007'],
    'Invoice Date': ['01-07-2024', '03-07-2024', '05-07-2024', '08-07-2024', '10-07-2024', '15-07-2024', '20-07-2024'],
    'Vendor GSTIN': [
        '24AABCT1234F1Z5',  # Dev Technologies - exact match
        '27BCDRF5678K2L6',  # Shree Metals - amount mismatch
        '29DEFGH9012R3S7',  # Global Tech - date mismatch
        '33GHIJK3456Y4Z8',  # Sunrise Ind - exact match
        '07LMNOP7890F5G9',  # Bharat Ent - PR only (missing in GSTR-2B)
        '24QRSTU1234A1B2',  # Raj Corp - GSTIN mismatch
        '27VWXYZ5678C3D4',  # Patel Traders - exact match
    ],
    'Vendor Name': [
        'Dev Technologies Pvt Ltd',
        'Shree Metals Pvt Ltd',
        'Global Tech Solutions',
        'Sunrise Industries',
        'Bharat Enterprises',
        'Raj Corporation',
        'Patel Traders',
    ],
    'Taxable Value': [50000, 75000, 120000, 30000, 45000, 60000, 25000],
    'IGST': [0, 13500, 0, 0, 8100, 0, 0],
    'CGST': [4500, 0, 10800, 2700, 0, 5400, 2250],
    'SGST': [4500, 0, 10800, 2700, 0, 5400, 2250],
    'Total Tax': [9000, 13500, 21600, 5400, 8100, 10800, 4500],
    'Invoice Value': [59000, 88500, 141600, 35400, 53100, 70800, 29500],
}
pr_df = pd.DataFrame(pr_data)
pr_path = '/Users/devrajyaguru/Downloads/gst-reconciliation-frontend/backend/demo_purchase_register.xlsx'
pr_df.to_excel(pr_path, index=False)
print(f'PR file created at {pr_path}')

# ==========================
# GSTR-2B FILE
# ==========================
gstr2b_data = {
    'GSTIN of Supplier': [
        '24AABCT1234F1Z5',  # Dev Technologies - exact match
        '27BCDRF5678K2L6',  # Shree Metals - amount DIFFERENT (mismatch!)
        '29DEFGH9012R3S7',  # Global Tech - date different (mismatch!)
        '33GHIJK3456Y4Z8',  # Sunrise Ind - exact match
        # NO INV-005 from Bharat Enterprises (PR-only discrepancy!)
        '24QRSTU1234A1B3',  # Raj Corp - GSTIN slightly different! (mismatch)
        '27VWXYZ5678C3D4',  # Patel Traders - exact match
        '10NEWCO8888N1P2',  # New Company - GSTR2B only (not in PR!)
    ],
    'Trade/Legal Name': [
        'Dev Technologies Pvt Ltd',
        'Shree Metals Pvt Ltd',
        'Global Tech Solutions',
        'Sunrise Industries',
        'Raj Corporation',
        'Patel Traders',
        'New Company Pvt Ltd',
    ],
    'Invoice No': ['INV-001', 'INV-002', 'INV-003', 'INV-004', 'INV-006', 'INV-007', 'INV-008'],
    'Invoice Date': [
        '01-07-2024',  # same
        '03-07-2024',  # same
        '06-07-2024',  # DIFFERENT date! (was 05-07-2024)
        '08-07-2024',  # same
        '15-07-2024',  # same
        '20-07-2024',  # same
        '22-07-2024',  # new
    ],
    'Taxable Value': [50000, 78000, 120000, 30000, 60000, 25000, 40000],  # INV-002: 78000 vs 75000
    'Integrated Tax': [0, 14040, 0, 0, 0, 0, 7200],  # IGST
    'Central Tax': [4500, 0, 10800, 2700, 5400, 2250, 0],
    'State/UT Tax': [4500, 0, 10800, 2700, 5400, 2250, 0],
    'Cess': [0, 0, 0, 0, 0, 0, 0],
    'Return Period': ['072024'] * 7,
}
gstr2b_df = pd.DataFrame(gstr2b_data)
gstr2b_path = '/Users/devrajyaguru/Downloads/gst-reconciliation-frontend/backend/demo_gstr2b.xlsx'
gstr2b_df.to_excel(gstr2b_path, index=False)
print(f'GSTR-2B file created at {gstr2b_path}')
