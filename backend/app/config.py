import os
from pathlib import Path
from dotenv import load_dotenv

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Load .env file from backend or root directory
load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

class Settings:
    # Application
    APP_NAME: str = "BORDERLESS AI"
    APP_DESCRIPTION: str = "AI Export Copilot for Indian Artisans & Small Manufacturers"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # PayPal Sandbox API
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "").strip()
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "").strip()
    PAYPAL_BASE_URL: str = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com").rstrip("/")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'borderless_ai.db'}")
    DB_PATH: Path = BASE_DIR / "borderless_ai.db"
    
    # Security & CORS
    SECRET_KEY: str = os.getenv("SECRET_KEY", "borderless-secret-key-development-mode-2025")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Uploads & Temp
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PDF_DIR: Path = BASE_DIR / "generated_pdfs"

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY) > 10)

    @property
    def is_paypal_configured(self) -> bool:
        return bool(self.PAYPAL_CLIENT_ID and self.PAYPAL_CLIENT_SECRET)

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PDF_DIR.mkdir(parents=True, exist_ok=True)
