"""
Finto GST Reconciliation API
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from api.routes import reconciliation, files, ai, clients, auth, reconcile, email_generator, admin, simple_clients


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Finto GST Reconciliation API starting...")
    yield
    # Shutdown
    print("👋 Finto GST Reconciliation API shutting down...")


# Create FastAPI app
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    description="Backend service for GST reconciliation with AI-powered explanations",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "finto-api"}


# Include routers
app.include_router(
    reconciliation.router, 
    prefix="/api/reconciliation", 
    tags=["Reconciliation"]
)
app.include_router(
    files.router, 
    prefix="/api/files", 
    tags=["File Processing"]
)
app.include_router(
    ai.router, 
    prefix="/api/ai", 
    tags=["AI Explanations"]
)
app.include_router(
    clients.router, 
    prefix="/api/clients", 
    tags=["Clients"]
)
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)
app.include_router(
    reconcile.router,
    prefix="/api",
    tags=["Reconciliation (Unified)"]
)
app.include_router(
    email_generator.router,
    prefix="/api/email",
    tags=["Email Generator"]
)
app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin Panel"]
)
app.include_router(
    simple_clients.router,
    prefix="/api/manage-clients",
    tags=["Client Management"]
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

