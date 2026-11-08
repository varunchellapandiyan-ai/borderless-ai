import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.database import get_db_connection
from app.schemas import NegotiationAnalysisRequest, NegotiationAnalysisOut
from app.services.negotiation_service import negotiation_service

router = APIRouter(prefix="/api/negotiation", tags=["Global Negotiation Assistant"])

class ApproveReplyRequest(BaseModel):
    approved_reply_text: str

@router.get("/{quotation_id}")
def get_negotiation_history(quotation_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM negotiation_messages
        WHERE quotation_id = ?
        ORDER BY created_at ASC
    """, (quotation_id,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "quotation_id": r["quotation_id"],
            "sender_role": r["sender_role"],
            "original_language": r["original_language"],
            "original_message": r["original_message"],
            "translated_message": r["translated_message"],
            "requested_discount_pct": r["requested_discount_pct"],
            "requested_unit_price_foreign": r["requested_unit_price_foreign"],
            "margin_impact_summary": json.loads(r["margin_impact_summary"]) if r["margin_impact_summary"] else None,
            "is_within_price_floor": bool(r["is_within_price_floor"]),
            "copilot_suggested_reply": r["copilot_suggested_reply"],
            "seller_approved_reply": r["seller_approved_reply"],
            "status": r["status"],
            "created_at": r["created_at"]
        })
    return result

@router.post("/analyze", response_model=NegotiationAnalysisOut)
def analyze_negotiation_message(req: NegotiationAnalysisRequest, seller_id: str = "sel_kaveri_01"):
    """
    Translates buyer message (DE/EN), calculates financial margin impact in backend,
    checks pricing floor, and crafts a counter-proposal.
    """
    try:
        return negotiation_service.analyze_buyer_message(req, seller_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/approve/{message_id}")
def approve_reply(message_id: str, req: ApproveReplyRequest):
    """
    Seller confirms and approves the final counter-offer response.
    """
    success = negotiation_service.approve_reply(message_id, req.approved_reply_text)
    if not success:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"success": True, "message": "Reply approved and marked as ready to send."}
