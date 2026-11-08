from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_db_connection
from app.schemas import SellerProfileOut

router = APIRouter(prefix="/api/auth", tags=["Authentication & Seller Profile"])

@router.get("/me", response_model=SellerProfileOut)
def get_current_seller():
    """Returns the active artisan seller profile (default Kaveri Looms)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM seller_profiles LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="No seller profile found.")
    
    return SellerProfileOut(
        id=row["id"],
        business_name=row["business_name"],
        craft_type=row["craft_type"],
        location=row["location"],
        state=row["state"],
        country=row["country"],
        currency=row["currency"],
        iec_number=row["iec_number"],
        gstin=row["gstin"],
        pan=row["pan"],
        ad_code=row["ad_code"],
        bank_name=row["bank_name"],
        account_last4=row["account_last4"],
        export_experience_level=row["export_experience_level"],
        is_demo=bool(row["is_demo"])
    )

@router.get("/sellers", response_model=List[SellerProfileOut])
def list_sellers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM seller_profiles")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        SellerProfileOut(
            id=r["id"],
            business_name=r["business_name"],
            craft_type=r["craft_type"],
            location=r["location"],
            state=r["state"],
            country=r["country"],
            currency=r["currency"],
            iec_number=r["iec_number"],
            gstin=r["gstin"],
            pan=r["pan"],
            ad_code=r["ad_code"],
            bank_name=r["bank_name"],
            account_last4=r["account_last4"],
            export_experience_level=r["export_experience_level"],
            is_demo=bool(r["is_demo"])
        )
        for r in rows
    ]
