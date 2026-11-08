import json
import uuid
from datetime import datetime
from typing import Dict, Any
from app.database import get_db_connection
from app.services.gemini_service import gemini_service
from app.schemas import NegotiationAnalysisRequest, NegotiationAnalysisOut

class NegotiationService:
    def analyze_buyer_message(self, req: NegotiationAnalysisRequest, seller_id: str) -> NegotiationAnalysisOut:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch quotation and product
        cursor.execute("SELECT * FROM quotations WHERE id = ?", (req.quotation_id,))
        quote = cursor.fetchone()
        if not quote:
            conn.close()
            raise ValueError(f"Quotation {req.quotation_id} not found.")

        cursor.execute("SELECT * FROM products WHERE id = ?", (quote["product_id"],))
        product = cursor.fetchone()
        conn.close()

        # Call Gemini or fallback for translation and NLP extraction
        ai_data, is_fallback = gemini_service.analyze_negotiation_message(
            buyer_message=req.buyer_message,
            current_quote_eur=quote["unit_price_fob_foreign"],
            price_floor_eur=quote["min_allowed_price_foreign"],
            quantity=quote["quantity"],
            product_title=product["title"] if product else "Export Product"
        )

        # Financial impact calculation strictly in backend code!
        current_price = quote["unit_price_fob_foreign"]
        price_floor = quote["min_allowed_price_foreign"]
        rate = quote["exchange_rate_to_inr"]
        quantity = quote["quantity"]
        unit_mfg_inr = quote["unit_manufacturing_cost_inr"]
        unit_pkg_inr = quote["unit_packaging_cost_inr"]
        unit_other_inr = quote["unit_other_cost_inr"]
        unit_total_cost_inr = unit_mfg_inr + unit_pkg_inr + unit_other_inr

        requested_price = ai_data.get("requested_unit_price") or current_price
        discount_pct = round(((current_price - requested_price) / current_price) * 100, 2) if current_price > 0 else 0.0

        is_safe = requested_price >= price_floor

        # Requested price converted to INR
        requested_price_inr = round(requested_price * rate, 2)
        net_profit_per_unit_inr = round(requested_price_inr - unit_total_cost_inr, 2)
        total_profit_inr = round(net_profit_per_unit_inr * quantity, 2)
        margin_pct_realized = round((net_profit_per_unit_inr / requested_price_inr) * 100, 2) if requested_price_inr > 0 else 0.0

        financial_impact = {
            "current_unit_price_foreign": current_price,
            "requested_unit_price_foreign": requested_price,
            "requested_discount_pct": discount_pct,
            "minimum_allowed_unit_price": price_floor,
            "currency": quote["currency"],
            "unit_base_cost_inr": unit_total_cost_inr,
            "requested_unit_price_inr": requested_price_inr,
            "net_profit_per_unit_inr": net_profit_per_unit_inr,
            "total_batch_profit_inr": total_profit_inr,
            "margin_pct_realized": margin_pct_realized,
            "is_above_minimum_floor": is_safe
        }

        # Store in database
        msg_id = f"neg_{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO negotiation_messages (
                id, quotation_id, sender_role, original_language, original_message,
                translated_message, requested_discount_pct, requested_unit_price_foreign,
                margin_impact_summary, is_within_price_floor, copilot_suggested_reply,
                seller_approved_reply, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            msg_id, req.quotation_id, "buyer", ai_data.get("detected_language", "en"),
            req.buyer_message, ai_data.get("translated_english"), discount_pct, requested_price,
            json.dumps(financial_impact), 1 if is_safe else 0,
            ai_data.get("suggested_reply_english"), ai_data.get("suggested_reply_english"),
            "pending_review", now
        ))
        conn.commit()
        conn.close()

        return NegotiationAnalysisOut(
            quotation_id=req.quotation_id,
            original_message=req.buyer_message,
            detected_language=ai_data.get("detected_language", "en"),
            translated_english=ai_data.get("translated_english", req.buyer_message),
            translated_german=ai_data.get("translated_german"),
            requested_unit_price=requested_price,
            requested_discount_pct=discount_pct,
            current_unit_price=current_price,
            minimum_safe_unit_price=price_floor,
            is_within_price_floor=is_safe,
            financial_impact=financial_impact,
            strategic_advice=ai_data.get("strategic_advice", "Negotiation analysis complete."),
            suggested_reply_english=ai_data.get("suggested_reply_english", ""),
            suggested_reply_german=ai_data.get("suggested_reply_german", "")
        )

    def approve_reply(self, message_id: str, approved_reply_text: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE negotiation_messages
            SET seller_approved_reply = ?, status = 'approved_and_sent'
            WHERE id = ?
        """, (approved_reply_text, message_id))
        conn.commit()
        conn.close()
        return True

negotiation_service = NegotiationService()
