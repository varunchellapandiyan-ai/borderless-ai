import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path

# ... (routers registered above)
from app.config import settings
from app.database import init_db
from app.routers import (
    auth,
    products,
    enquiries,
    deal,
    quotations,
    negotiation,
    paypal,
    readiness,
    dashboard
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("borderless_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BORDERLESS AI database and demo fixtures...")
    init_db()
    logger.info("BORDERLESS AI ready to serve export intelligence.")
    yield
    logger.info("Shutting down BORDERLESS AI.")

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS setup
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Check backend logs for details."}
    )

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(enquiries.router)
app.include_router(deal.router)
app.include_router(quotations.router)
app.include_router(negotiation.router)
app.include_router(paypal.router)
app.include_router(readiness.router)
app.include_router(dashboard.router)

@app.get("/api/health")
def health_check():
    return {
        "app": settings.APP_NAME,
        "description": settings.APP_DESCRIPTION,
        "version": settings.APP_VERSION,
        "status": "operational",
        "gemini_status": "LIVE_API" if settings.is_gemini_configured else "STRUCTURED_DEMO_FALLBACK",
        "paypal_sandbox": "CONFIGURED" if settings.is_paypal_configured else "LOCAL_SANDBOX_DEMO",
        "documentation": "/docs"
    }

# Mount Frontend Build if available (Single-Page App)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root_fallback():
        return health_check()
