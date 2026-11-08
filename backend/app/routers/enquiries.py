import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.schemas import EnquiryOut, EnquiryCreate, BuyerEnquiryExtraction
from app.services.gemini_service import gemini_service
from app.services.deal_intelligence import deal_intelligence_service

router = APIRouter(prefix="/api/enquiries", tags=["Buyer Request Intelligence"])

@router.get("", response_model=List[EnquiryOut])
def list_enquiries(seller_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if seller_id:
        cursor.execute("SELECT * FROM enquiries WHERE seller_id = ? ORDER BY created_at DESC", (seller_id,))
    else:
        cursor.execute("SELECT * FROM enquiries ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append(EnquiryOut(
            id=r["id"],
            seller_id=r["seller_id"],
            product_id=r["product_id"],
            buyer_name=r["buyer_name"],
            buyer_company=r["buyer_company"],
            buyer_country=r["buyer_country"],
            buyer_country_code=r["buyer_country_code"],
            raw_enquiry_text=r["raw_enquiry_text"],
            requested_quantity=r["requested_quantity"],
            target_unit_price=r["target_unit_price"],
            target_currency=r["target_currency"],
            delivery_deadline=r["delivery_deadline"],
            requested_packaging=r["requested_packaging"],
            shipping_terms=r["shipping_terms"],
            match_summary=json.loads(r["match_summary"]) if r["match_summary"] else None,
            clarification_questions=json.loads(r["clarification_questions"]) if r["clarification_questions"] else None,
            status=r["status"],
            is_demo=bool(r["is_demo"]),
            created_at=r["created_at"]
        ))
    return result

@router.get("/{enquiry_id}", response_model=EnquiryOut)
def get_enquiry(enquiry_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM enquiries WHERE id = ?", (enquiry_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    return EnquiryOut(
        id=r["id"],
        seller_id=r["seller_id"],
        product_id=r["product_id"],
        buyer_name=r["buyer_name"],
        buyer_company=r["buyer_company"],
        buyer_country=r["buyer_country"],
        buyer_country_code=r["buyer_country_code"],
        raw_enquiry_text=r["raw_enquiry_text"],
        requested_quantity=r["requested_quantity"],
        target_unit_price=r["target_unit_price"],
        target_currency=r["target_currency"],
        delivery_deadline=r["delivery_deadline"],
        requested_packaging=r["requested_packaging"],
        shipping_terms=r["shipping_terms"],
        match_summary=json.loads(r["match_summary"]) if r["match_summary"] else None,
        clarification_questions=json.loads(r["clarification_questions"]) if r["clarification_questions"] else None,
        status=r["status"],
        is_demo=bool(r["is_demo"]),
        created_at=r["created_at"]
    )

@router.post("/extract", response_model=BuyerEnquiryExtraction)
def extract_buyer_enquiry(req: EnquiryCreate):
    """
    Parses pasted raw enquiry text using Gemini API (or structured demo fallback).
    Identifies missing trade parameters and formulates questions to ask the buyer.
    """
    extraction, is_fallback = gemini_service.extract_buyer_enquiry(req.raw_text)
    return extraction

@router.post("", response_model=EnquiryOut)
def save_enquiry(
    extraction: BuyerEnquiryExtraction,
    raw_text: str,
    product_id: Optional[str] = None,
    seller_id: str = "sel_kaveri_01"
):
    """
    Saves parsed enquiry into the database and creates deal intelligence fields.
    """
    now = datetime.now().isoformat()
    enquiry_id = f"enq_{uuid.uuid4().hex[:8]}"

    # Compare with product if product_id is provided
    match_summary = None
    if product_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        prod = cursor.fetchone()
        conn.close()
        if prod:
            qty_match = "Matches MOQ" if extraction.requested_quantity >= prod["moq"] else "Below MOQ"
            match_summary = {
                "matched_product_id": prod["id"],
                "matched_product_title": prod["title"],
                "quantity_assessment": f"{extraction.requested_quantity} units ({qty_match})",
                "target_price_assessment": f"Target: {extraction.target_currency} {extraction.target_unit_price or 'Not specified'}",
                "lead_time": f"Standard {prod['lead_time_days']} days production"
            }

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO enquiries (
            id, seller_id, product_id, buyer_name, buyer_company, buyer_country,
            buyer_country_code, raw_enquiry_text, requested_quantity, target_unit_price,
            target_currency, delivery_deadline, requested_packaging, shipping_terms,
            match_summary, clarification_questions, status, is_demo, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'analyzing', 0, ?)
    """, (
        enquiry_id, seller_id, product_id, extraction.buyer_name, extraction.buyer_company,
        extraction.buyer_country, extraction.buyer_country_code, raw_text,
        extraction.requested_quantity, extraction.target_unit_price, extraction.target_currency,
        extraction.delivery_timeline, extraction.requested_packaging, extraction.shipping_terms,
        json.dumps(match_summary) if match_summary else None,
        json.dumps(extraction.clarification_questions), now
    ))

    cursor.execute("""
        INSERT INTO activity_logs (id, seller_id, entity_type, entity_id, action, description, created_at)
        VALUES (?, ?, 'enquiry', ?, 'BUYER_ENQUIRY_SAVED', ?, ?)
    """, (
        f"log_{uuid.uuid4().hex[:8]}", seller_id, enquiry_id,
        f"Imported buyer enquiry from {extraction.buyer_name} ({extraction.buyer_country}) for {extraction.requested_quantity} pcs",
        now
    ))

    conn.commit()
    conn.close()

    # Automatically generate default deal fields
    deal_intelligence_service.get_deal_summary(enquiry_id)

    return EnquiryOut(
        id=enquiry_id,
        seller_id=seller_id,
        product_id=product_id,
        buyer_name=extraction.buyer_name,
        buyer_company=extraction.buyer_company,
        buyer_country=extraction.buyer_country,
        buyer_country_code=extraction.buyer_country_code,
        raw_enquiry_text=raw_text,
        requested_quantity=extraction.requested_quantity,
        target_unit_price=extraction.target_unit_price,
        target_currency=extraction.target_currency,
        delivery_deadline=extraction.delivery_timeline,
        requested_packaging=extraction.requested_packaging,
        shipping_terms=extraction.shipping_terms,
        match_summary=match_summary,
        clarification_questions=extraction.clarification_questions,
        status="analyzing",
        is_demo=False,
        created_at=now
    )
