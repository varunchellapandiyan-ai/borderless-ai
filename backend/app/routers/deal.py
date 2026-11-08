from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.schemas import DealIntelligenceSummary
from app.services.deal_intelligence import deal_intelligence_service

router = APIRouter(prefix="/api/deal", tags=["Evidence-Backed Deal Intelligence"])

class FieldUpdateRequest(BaseModel):
    verification_status: str # verified, pending_confirmation, discrepancy, unverified
    field_value: Optional[str] = None
    evidence_note: Optional[str] = None

@router.get("/{enquiry_id}", response_model=DealIntelligenceSummary)
def get_deal_intelligence(enquiry_id: str):
    """
    Returns the evidence breakdown of all deal fields, information completeness index,
    and missing critical trade parameters with explanations.
    """
    try:
        return deal_intelligence_service.get_deal_summary(enquiry_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/fields/{field_id}")
def update_deal_field(field_id: str, req: FieldUpdateRequest):
    """
    Update verification status or add confirmation evidence note for a deal field.
    """
    success = deal_intelligence_service.update_field_status(
        field_id=field_id,
        verification_status=req.verification_status,
        field_value=req.field_value,
        evidence_note=req.evidence_note
    )
    if not success:
        raise HTTPException(status_code=404, detail="Deal field not found")
    return {"success": True, "message": "Deal field updated successfully."}
