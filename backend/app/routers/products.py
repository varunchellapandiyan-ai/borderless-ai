import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.database import get_db_connection
from app.schemas import ProductOut, ProductCreate, ProductPassportExtraction
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/products", tags=["Smart Product Passport"])

@router.get("", response_model=List[ProductOut])
def list_products(seller_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if seller_id:
        cursor.execute("SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC", (seller_id,))
    else:
        cursor.execute("SELECT * FROM products ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        ai_meta = json.loads(r["ai_extracted_metadata"]) if r["ai_extracted_metadata"] else None
        result.append(ProductOut(
            id=r["id"],
            seller_id=r["seller_id"],
            title=r["title"],
            sku=r["sku"],
            description=r["description"],
            material=r["material"],
            color=r["color"],
            dimensions=r["dimensions"],
            unit_weight_kg=r["unit_weight_kg"],
            hs_code=r["hs_code"],
            production_capacity_monthly=r["production_capacity_monthly"],
            moq=r["moq"],
            lead_time_days=r["lead_time_days"],
            unit_cost_inr=r["unit_cost_inr"],
            target_margin_pct=r["target_margin_pct"],
            min_selling_price_inr=r["min_selling_price_inr"],
            packaging_details=r["packaging_details"],
            image_url=r["image_url"],
            ai_extracted_metadata=ai_meta,
            status=r["status"],
            is_demo=bool(r["is_demo"]),
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        ))
    return result

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="Product not found")

    ai_meta = json.loads(r["ai_extracted_metadata"]) if r["ai_extracted_metadata"] else None
    return ProductOut(
        id=r["id"],
        seller_id=r["seller_id"],
        title=r["title"],
        sku=r["sku"],
        description=r["description"],
        material=r["material"],
        color=r["color"],
        dimensions=r["dimensions"],
        unit_weight_kg=r["unit_weight_kg"],
        hs_code=r["hs_code"],
        production_capacity_monthly=r["production_capacity_monthly"],
        moq=r["moq"],
        lead_time_days=r["lead_time_days"],
        unit_cost_inr=r["unit_cost_inr"],
        target_margin_pct=r["target_margin_pct"],
        min_selling_price_inr=r["min_selling_price_inr"],
        packaging_details=r["packaging_details"],
        image_url=r["image_url"],
        ai_extracted_metadata=ai_meta,
        status=r["status"],
        is_demo=bool(r["is_demo"]),
        created_at=r["created_at"],
        updated_at=r["updated_at"]
    )

@router.post("/ai-extract", response_model=ProductPassportExtraction)
def ai_extract_product_passport(
    description: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    """
    Extracts structured Product Passport fields from text description and optional image.
    All extracted values are tagged as AI-suggested until confirmed by the seller.
    """
    image_bytes = None
    mime_type = "image/jpeg"
    if image and hasattr(image, "file") and image.file:
        image_bytes = image.file.read()
        mime_type = getattr(image, "content_type", "image/jpeg") or "image/jpeg"

    extraction, is_fallback = gemini_service.extract_product_passport(
        description=description,
        image_bytes=image_bytes,
        mime_type=mime_type
    )
    return extraction

@router.post("", response_model=ProductOut)
def create_product(product: ProductCreate, seller_id: str = "sel_kaveri_01"):
    """
    Save confirmed Product Passport into database.
    """
    now = datetime.now().isoformat()
    product_id = f"prod_{uuid.uuid4().hex[:8]}"

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO products (
            id, seller_id, title, sku, description, material, color, dimensions,
            unit_weight_kg, hs_code, production_capacity_monthly, moq, lead_time_days,
            unit_cost_inr, target_margin_pct, min_selling_price_inr,
            packaging_details, image_url, ai_extracted_metadata, status, is_demo,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?)
    """, (
        product_id, seller_id, product.title, product.sku, product.description,
        product.material, product.color, product.dimensions, product.unit_weight_kg,
        product.hs_code, product.production_capacity_monthly, product.moq, product.lead_time_days,
        product.unit_cost_inr, product.target_margin_pct, product.min_selling_price_inr,
        product.packaging_details, product.image_url,
        json.dumps(product.ai_extracted_metadata) if product.ai_extracted_metadata else None,
        now, now
    ))

    cursor.execute("""
        INSERT INTO activity_logs (id, seller_id, entity_type, entity_id, action, description, created_at)
        VALUES (?, ?, 'product', ?, 'PRODUCT_PASSPORT_CREATED', ?, ?)
    """, (
        f"log_{uuid.uuid4().hex[:8]}", seller_id, product_id,
        f"Saved confirmed Product Passport for {product.title} (SKU: {product.sku})",
        now
    ))

    conn.commit()
    conn.close()

    return ProductOut(
        id=product_id,
        seller_id=seller_id,
        title=product.title,
        sku=product.sku,
        description=product.description,
        material=product.material,
        color=product.color,
        dimensions=product.dimensions,
        unit_weight_kg=product.unit_weight_kg,
        hs_code=product.hs_code,
        production_capacity_monthly=product.production_capacity_monthly,
        moq=product.moq,
        lead_time_days=product.lead_time_days,
        unit_cost_inr=product.unit_cost_inr,
        target_margin_pct=product.target_margin_pct,
        min_selling_price_inr=product.min_selling_price_inr,
        packaging_details=product.packaging_details,
        image_url=product.image_url,
        ai_extracted_metadata=product.ai_extracted_metadata,
        status="active",
        is_demo=False,
        created_at=now,
        updated_at=now
    )
