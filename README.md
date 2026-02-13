<p align="center">
  <img src="public/finto-logo-icon.png" alt="Finto Logo" width="80" height="80" style="border-radius: 18px;" />
</p>

<h1 align="center">Finto — AI-Powered GST Reconciliation</h1>

<p align="center">
  <strong>Cut GST reconciliation time by 60–70% for Indian Chartered Accountants</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#project-structure">Project Structure</a>
</p>

---

## 🎯 What is Finto?

Finto is a full-stack B2B fintech application that automates **GST (Goods & Services Tax) reconciliation** for Indian Chartered Accountants and businesses. It compares a company's **Purchase Register** (books of accounts) against the government's **GSTR-2B** report to identify discrepancies — helping CAs claim the correct **Input Tax Credit (ITC)**.

### The Problem
CAs spend hours manually matching invoices in Excel spreadsheets, cross-referencing thousands of entries between internal records and government filings.

### The Solution
Finto automates the entire process — upload two CSV files, and the system instantly identifies matches, mismatches, and missing invoices with AI-powered resolution suggestions.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📤 **CSV Upload** | Drag & drop Purchase Register and GSTR-2B files |
| 🔄 **Auto-Reconciliation** | Matches invoices by number, GSTIN, amount, and date |
| ⚠️ **Discrepancy Detection** | Flags exact matches, amount mismatches, and missing invoices |
| 💰 **ITC Impact Analysis** | Shows claimable vs. at-risk tax amounts |
| 🤖 **AI Resolution** | Groq AI suggests fixes for each discrepancy |
| 👥 **Multi-Client** | Manage multiple clients from one dashboard |
| 🔐 **Secure Auth** | Supabase-powered email + OTP authentication |
| 📊 **Reports** | Generate CA-ready reconciliation reports |

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Premium component library

### Backend
- **Python FastAPI** — High-performance REST API
- **Pandas** — Data processing & CSV parsing
- **Groq AI** — LLM-powered discrepancy analysis

### Infrastructure
- **Supabase** — PostgreSQL database + Auth + Storage
- **Vercel** — Frontend deployment
- **Redis** — Caching (optional)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account ([supabase.com](https://supabase.com))
- Groq API key ([console.groq.com](https://console.groq.com))

### 1. Clone the repository

```bash
git clone https://github.com/devrajyaguru03/Finto---AI-GST-reconciliation-.git
cd Finto---AI-GST-reconciliation-
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Supabase credentials to .env.local
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Start frontend
npm run dev
```

Frontend runs at → **http://localhost:3000**

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Add your credentials to .env

# Start backend
python main.py
```

Backend runs at → **http://localhost:8000**

### 4. Environment Variables

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (`.env`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
CORS_ORIGINS=http://localhost:3000
```

---

## 🔄 How It Works

```
┌─────────────────┐     ┌─────────────────┐
│ Purchase Register│     │    GSTR-2B      │
│   (Your Books)   │     │  (Government)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │  CSV Parser  │
              │  (Pandas)    │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  Matching    │
              │  Engine      │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ✅ Matched   ⚠️ Mismatch  🔴 Missing
         │           │           │
              ┌──────▼──────┐
              │  Groq AI    │
              │  Resolution │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  ITC Impact  │
              │  Report      │
              └─────────────┘
```

### Reconciliation Categories

| Status | Meaning |
|--------|---------|
| ✅ **Matched** | Invoice found in both files with matching amounts |
| ⚠️ **Amount Mismatch** | Invoice found in both but amounts differ |
| 🔴 **Missing in GSTR-2B** | In your books but vendor didn't file — ITC at risk |
| 🟡 **Missing in PR** | In GSTR-2B but not in your books — needs investigation |

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Protected dashboard pages
│   │   ├── reconciliation/ # Reconciliation flow (import, results, resolution)
│   │   ├── clients/        # Client management
│   │   └── ...
│   ├── login/              # Authentication page
│   └── layout.tsx          # Root layout with metadata
│
├── backend/                # FastAPI backend
│   ├── api/routes/         # API endpoints
│   ├── core/               # Business logic (reconciliation engine, file parser)
│   ├── services/           # External service integrations (Supabase, Groq)
│   ├── models/             # Pydantic schemas
│   └── main.py             # FastAPI app entry point
│
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── finto-logo.tsx      # Brand logo component
│   ├── header.tsx          # Landing page header
│   └── ...                 # Landing page sections
│
├── lib/                    # Utilities & providers
│   ├── auth-context.tsx    # Authentication context
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # Helper functions
│
├── test_data/              # Sample CSV files for testing
│   ├── purchase_register.csv
│   └── gstr2b.csv
│
└── supabase/migrations/    # Database schema & RLS policies
```

---

## 🧪 Test Data

Sample files are included in `test_data/` with deliberate discrepancies for testing:

**Purchase Register** — 10 invoices from vendors like Tata Consultancy, Reliance, Infosys

**GSTR-2B** — 9 invoices with:
- ✅ Exact matches (same invoice, same amount)
- ⚠️ Amount mismatches (INV-002: ₹2,50,000 vs ₹2,55,000)
- 🔴 Missing invoices (INV-005, INV-010 not in GSTR-2B)
- 🟡 Extra invoices (INV-011 only in GSTR-2B)

---

## 📜 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reconciliation/upload` | Upload CSV files |
| `POST` | `/api/reconciliation/reconcile` | Run reconciliation |
| `GET` | `/api/reconciliation/results` | Get reconciliation results |
| `POST` | `/api/ai/resolve` | AI-powered resolution |
| `GET` | `/api/clients` | List all clients |
| `GET` | `/api/health` | Health check |

---

## 👨‍💻 Author

**Dev Rajyaguru**

---

## 📄 License

This project is for educational and demonstration purposes.
