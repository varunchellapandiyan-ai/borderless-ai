from fastapi import APIRouter
from typing import List, Dict, Any
from app.config import settings
from app.database import get_db_connection
from app.schemas import ActivityLogOut
from app.services.gemini_service import gemini_service
from app.services.paypal_service import paypal_service

router = APIRouter(prefix="/api/dashboard", tags=["Deal Dashboard & Stats"])

@router.get("/stats")
def get_dashboard_stats(seller_id: str = "sel_kaveri_01"):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Product count
    cursor.execute("SELECT COUNT(*) as count FROM products WHERE seller_id = ?", (seller_id,))
    product_count = cursor.fetchone()["count"]

    # Enquiry count
    cursor.execute("SELECT COUNT(*) as count FROM enquiries WHERE seller_id = ?", (seller_id,))
    enquiry_count = cursor.fetchone()["count"]

    # Quotations count and total quoted amount
    cursor.execute("SELECT COUNT(*) as count, SUM(total_payable_foreign) as total_val FROM quotations WHERE seller_id = ?", (seller_id,))
    q_row = cursor.fetchone()
    quotation_count = q_row["count"] or 0
    total_quoted_foreign = round(q_row["total_val"] or 0.0, 2)

    # Completed PayPal orders
    cursor.execute("""
        SELECT COUNT(*) as count, SUM(amount) as total_captured
        FROM payment_orders
        WHERE status = 'COMPLETED'
    """)
    p_row = cursor.fetchone()
    payments_count = p_row["count"] or 0
    total_captured = round(p_row["total_captured"] or 0.0, 2)

    # Verification health
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified
        FROM deal_fields
    """)
    df_row = cursor.fetchone()
    df_total = df_row["total"] or 0
    df_verified = df_row["verified"] or 0
    verification_health_pct = int((df_verified / df_total) * 100) if df_total > 0 else 0

    conn.close()

    return {
        "seller_business_name": "Kaveri Looms",
        "craft_type": "Artisan Handloom & Home Textiles",
        "location": "Erode, Tamil Nadu, India",
        "currency": "EUR",
        "metrics": {
            "products_count": product_count,
            "enquiries_count": enquiry_count,
            "quotations_count": quotation_count,
            "total_quoted_eur": total_quoted_foreign,
            "payments_captured_count": payments_count,
            "total_captured_eur": total_captured,
            "deal_evidence_health_pct": verification_health_pct,
            "export_readiness_pct": 71
        },
        "system_status": {
            "gemini_ai": {
                "configured": settings.is_gemini_configured,
                "model": settings.GEMINI_MODEL,
                "mode": "LIVE_API" if gemini_service.is_live else "STRUCTURED_DEMO_FALLBACK"
            },
            "paypal_sandbox": {
                "configured": settings.is_paypal_configured,
                "base_url": settings.PAYPAL_BASE_URL,
                "mode": "LIVE_SANDBOX_API" if paypal_service.is_configured else "VERIFIED_SANDBOX_DEMO"
            },
            "database": {
                "status": "HEALTHY",
                "engine": "SQLite3 WAL-enabled Data Layer"
            }
        }
    }

@router.get("/activity", response_model=List[ActivityLogOut])
def get_activity_log(seller_id: str = "sel_kaveri_01"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM activity_logs
        WHERE seller_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    """, (seller_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        ActivityLogOut(
            id=r["id"],
            entity_type=r["entity_type"],
            entity_id=r["entity_id"],
            action=r["action"],
            description=r["description"],
            created_at=r["created_at"]
        )
        for r in rows
    ]
