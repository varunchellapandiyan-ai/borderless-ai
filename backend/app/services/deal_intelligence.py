import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.database import get_db_connection
from app.schemas import DealIntelligenceSummary, DealFieldOut

class DealIntelligenceService:
    def get_deal_summary(self, enquiry_id: str) -> DealIntelligenceSummary:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM deal_fields
            WHERE enquiry_id = ?
            ORDER BY field_category, timestamp ASC
        """, (enquiry_id,))
        rows = cursor.fetchall()
        
        # If no fields yet, generate default deal fields from enquiry and product
        if not rows:
            self._generate_default_deal_fields(cursor, enquiry_id)
            conn.commit()
            cursor.execute("""
                SELECT * FROM deal_fields
                WHERE enquiry_id = ?
                ORDER BY field_category, timestamp ASC
            """, (enquiry_id,))
            rows = cursor.fetchall()
            
        conn.close()
        
        fields = [
            DealFieldOut(
                id=r["id"],
                enquiry_id=r["enquiry_id"],
                field_category=r["field_category"],
                field_name=r["field_name"],
                field_label=r["field_label"],
                field_value=r["field_value"],
                source=r["source"],
                verification_status=r["verification_status"],
                confidence_score=r["confidence_score"],
                evidence_note=r["evidence_note"],
                why_it_matters=r["why_it_matters"],
                timestamp=r["timestamp"]
            )
            for r in rows
        ]
        
        total = len(fields)
        verified = sum(1 for f in fields if f.verification_status == "verified")
        pending = sum(1 for f in fields if f.verification_status == "pending_confirmation")
        missing = sum(1 for f in fields if f.source == "missing-unverified" or f.verification_status == "unverified")
        
        completeness = int((verified / total) * 100) if total > 0 else 0
        
        actions = []
        if any(f.field_name == "origin_certificate" and f.verification_status != "verified" for f in fields):
            actions.append("Verify whether EU REX (Registered Exporter System) declaration is required on commercial invoice for duty exemption.")
        if any(f.source == "ai-suggested" and f.verification_status == "pending_confirmation" for f in fields):
            actions.append("Confirm AI-estimated domestic road transit rates with local Erode / Coimbatore transport provider.")
        if any(f.field_name == "incoterms" and f.verification_status == "pending_confirmation" for f in fields):
            actions.append("Lock Incoterms 2020 delivery point (FOB Chennai Port vs CIF Hamburg) with buyer before final invoice.")
        if not actions:
            actions.append("All primary parameters verified. Ready to proceed with formal export quotation approval.")

        return DealIntelligenceSummary(
            enquiry_id=enquiry_id,
            completeness_percentage=completeness,
            total_fields=total,
            verified_fields=verified,
            pending_fields=pending,
            missing_fields=missing,
            fields=fields,
            recommended_actions=actions
        )

    def update_field_status(
        self,
        field_id: str,
        verification_status: str,
        field_value: Optional[str] = None,
        evidence_note: Optional[str] = None
    ) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        updates = ["verification_status = ?", "timestamp = ?"]
        params = [verification_status, datetime.now().isoformat()]
        
        if field_value is not None:
            updates.append("field_value = ?")
            params.append(field_value)
            
        if evidence_note is not None:
            updates.append("evidence_note = ?")
            params.append(evidence_note)
            
        params.append(field_id)
        
        query = f"UPDATE deal_fields SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, tuple(params))
        conn.commit()
        conn.close()
        return True

    def _generate_default_deal_fields(self, cursor: sqlite3.Cursor, enquiry_id: str):
        now = datetime.now().isoformat()
        
        # Fetch enquiry and product details
        cursor.execute("SELECT * FROM enquiries WHERE id = ?", (enquiry_id,))
        enq = cursor.fetchone()
        if not enq:
            return
            
        cursor.execute("SELECT * FROM products WHERE id = ?", (enq["product_id"],))
        prod = cursor.fetchone()
        
        defaults = [
            ("df_b_name", enquiry_id, "buyer", "buyer_identity", "Buyer Business Identity", f"{enq['buyer_name']} ({enq['buyer_company'] or 'Private Buyer'})", "buyer-requested", "pending_confirmation", 0.85, "Parsed from enquiry header; identity requires seller verification", "Prevents fraudulent commercial orders and payment disputes"),
            ("df_b_country", enquiry_id, "buyer", "buyer_country", "Destination Country", f"{enq['buyer_country']} ({enq['buyer_country_code']})", "buyer-requested", "verified", 1.0, "Provided by buyer in enquiry", "Determines destination import duties, documentation rules, and sanctions check"),
            ("df_p_sku", enquiry_id, "product", "product_sku", "Export Product Specification", prod["title"] if prod else "Custom Craft Spec", "seller-provided", "verified", 1.0, "Mapped from verified Product Passport", "Fixes technical manufacturing specifications, yarn gauge, and finishing"),
            ("df_p_hs", enquiry_id, "product", "hs_code", "HS Tariff Code", prod["hs_code"] if prod else "6304.92.00", "externally-verified", "verified", 0.95, "Matches Indian Customs ITC-HS schedule for cotton textile articles", "Required for shipping bills, export incentives (RoDTEP/Duty Drawback), and clearance"),
            ("df_q_qty", enquiry_id, "quantity", "order_quantity", "Export Order Quantity", f"{enq['requested_quantity']} Units", "buyer-requested", "verified", 1.0, "Specified in buyer RFQ", "Affects tiered packaging costs, carton consolidation, and loom setup time"),
            ("df_c_mfg", enquiry_id, "cost", "unit_manufacturing_cost", "Unit Production Cost", f"INR {prod['unit_cost_inr']:.2f}" if prod else "INR 280.00", "seller-provided", "verified", 1.0, "Confirmed from seller cost profile", "Non-negotiable baseline; protects artisan livelihood from underpricing"),
            ("df_c_pkg", enquiry_id, "cost", "packaging_cost", "Export Grade Packaging", "INR 35.00 / unit", "seller-provided", "verified", 0.90, "Moisture-barrier polybag & 7-ply master box", "Prevents sea-transit mold, moisture staining, and retail damage"),
            ("df_s_inco", enquiry_id, "shipping", "incoterms", "Incoterms Delivery Point", enq["shipping_terms"] or "FOB Chennai Port", "buyer-requested", "pending_confirmation", 0.85, "Pending freight forwarder agreement", "Defines exact point where transit risk and ocean freight expense transfers to buyer"),
            ("df_comp_rex", enquiry_id, "compliance", "origin_certificate", "Rules of Origin Statement", "Pending REX Self-Declaration Check", "missing-unverified", "unverified", 0.50, "Not yet filed with DGFT or export council", "Required by EU buyers for tariff concessions under GSP/preferential agreement"),
            ("df_pay_rail", enquiry_id, "payment", "payment_method", "Settlement Rails", "PayPal Orders API v2 (Sandbox Verified)", "seller-provided", "verified", 1.0, "Direct merchant export transaction rails", "Guarantees 100% advance foreign exchange settlement before production release")
        ]
        
        for d in defaults:
            cursor.execute("""
                INSERT INTO deal_fields (
                    id, enquiry_id, field_category, field_name, field_label, field_value,
                    source, verification_status, confidence_score, evidence_note, why_it_matters, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (*d, now))

deal_intelligence_service = DealIntelligenceService()
