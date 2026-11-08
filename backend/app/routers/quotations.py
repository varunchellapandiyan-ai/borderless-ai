import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List, Optional
from app.database import get_db_connection
from app.schemas import QuotationCalculateRequest, QuotationOut
from app.services.quotation_service import quotation_service
from app.services.pdf_service import pdf_service

router = APIRouter(prefix="/api/quotations", tags=["Intelligent Export Quotation"])

@router.get("", response_model=List[QuotationOut])
def list_quotations(seller_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if seller_id:
        cursor.execute("SELECT id FROM quotations WHERE seller_id = ? ORDER BY created_at DESC", (seller_id,))
    else:
        cursor.execute("SELECT id FROM quotations ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        q = quotation_service.get_quotation_by_id(r["id"])
        if q:
            result.append(q)
    return result

@router.get("/{quotation_id}", response_model=QuotationOut)
def get_quotation(quotation_id: str):
    q = quotation_service.get_quotation_by_id(quotation_id)
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return q

@router.post("/calculate")
def calculate_quotation_preview(req: QuotationCalculateRequest, seller_id: str = "sel_kaveri_01"):
    """
    Deterministic calculation preview. Validates minimum margin and prevents pricing below floor.
    """
    try:
        return quotation_service.calculate_quotation(req, seller_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("", response_model=QuotationOut)
def create_quotation(req: QuotationCalculateRequest, seller_id: str = "sel_kaveri_01"):
    """
    Saves approved quotation and line items into database.
    """
    try:
        return quotation_service.save_quotation(req, seller_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{quotation_id}/pdf")
def download_quotation_pdf(quotation_id: str):
    """
    Generates and returns the official PDF export quotation.
    """
    try:
        file_path = pdf_service.generate_quotation_pdf(quotation_id)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=500, detail="Failed to locate generated PDF")
        
        return FileResponse(
            path=file_path,
            filename=os.path.basename(file_path),
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
