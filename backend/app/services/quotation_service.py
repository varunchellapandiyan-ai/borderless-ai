import sqlite3
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.database import get_db_connection
from app.schemas import QuotationCalculateRequest, QuotationOut, QuotationItemOut

class QuotationService:
    def calculate_quotation(self, req: QuotationCalculateRequest, seller_id: str) -> Dict[str, Any]:
        """
        Pure deterministic financial calculation.
        LLMs are NEVER allowed to invent or alter these values.
        """
        # Validate inputs
        if req.quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")
        if req.unit_manufacturing_cost_inr <= 0:
            raise ValueError("Unit manufacturing cost must be greater than zero.")
        if req.exchange_rate_to_inr <= 0:
            raise ValueError("Exchange rate must be greater than zero.")

        # Unit itemization in INR
        unit_mfg = round(req.unit_manufacturing_cost_inr, 2)
        unit_pkg = round(req.unit_packaging_cost_inr, 2)
        
        # Batch costs allocated per unit
        unit_domestic_logistics = round(req.domestic_transport_total_inr / req.quantity, 2)
        unit_port_and_doc = round(req.port_and_doc_fee_inr / req.quantity, 2)
        unit_other = round(unit_domestic_logistics + unit_port_and_doc, 2)

        # Total cost base per unit before margin
        unit_base_cost_inr = round(unit_mfg + unit_pkg + unit_other, 2)

        # Margin
        margin_pct = max(0.0, req.target_margin_pct)
        unit_margin_inr = round(unit_base_cost_inr * (margin_pct / 100.0), 2)

        # FOB unit price in INR
        unit_price_fob_inr = round(unit_base_cost_inr + unit_margin_inr, 2)

        # Exchange rate conversion
        rate = req.exchange_rate_to_inr
        unit_price_fob_foreign = round(unit_price_fob_inr / rate, 2)
        
        # Batch totals
        total_goods_fob_foreign = round(unit_price_fob_foreign * req.quantity, 2)
        
        # Additional foreign components (for CIF/DDP)
        intl_shipping = round(max(0.0, req.international_shipping_foreign), 2)
        insurance = round(max(0.0, req.insurance_foreign), 2)
        
        # Total payable
        total_payable_foreign = round(total_goods_fob_foreign + intl_shipping + insurance, 2)

        # Minimum selling price guardrail (15% absolute floor above base cost)
        min_allowed_inr = round(unit_base_cost_inr * 1.15, 2)
        min_allowed_foreign = round(min_allowed_inr / rate, 2)

        # If computed unit price is below minimum floor, raise error or flag
        if unit_price_fob_foreign < min_allowed_foreign:
            raise ValueError(f"Calculated unit price ({unit_price_fob_foreign} {req.currency}) is below seller-approved minimum floor ({min_allowed_foreign} {req.currency}). Margin is too low.")

        # Build transparent line items
        items = [
            {
                "id": f"qi_{uuid.uuid4().hex[:8]}",
                "item_type": "product",
                "description": f"Artisan Handcrafted Units ({req.quantity} pcs @ ₹{unit_mfg:.2f}/unit)",
                "cost_inr": round(unit_mfg * req.quantity, 2),
                "cost_foreign": round((unit_mfg * req.quantity) / rate, 2),
                "is_estimate": False,
                "estimate_basis": "Confirmed seller raw material & handloom weaving labor"
            },
            {
                "id": f"qi_{uuid.uuid4().hex[:8]}",
                "item_type": "packaging",
                "description": f"Export Packaging & Barcoding ({req.quantity} pcs @ ₹{unit_pkg:.2f}/unit)",
                "cost_inr": round(unit_pkg * req.quantity, 2),
                "cost_foreign": round((unit_pkg * req.quantity) / rate, 2),
                "is_estimate": False,
                "estimate_basis": "Biodegradable bags and 7-ply export shipping cartons"
            },
            {
                "id": f"qi_{uuid.uuid4().hex[:8]}",
                "item_type": "domestic_logistics",
                "description": f"Domestic Freight & CFS Delivery (Erode to Port Terminal)",
                "cost_inr": round(req.domestic_transport_total_inr, 2),
                "cost_foreign": round(req.domestic_transport_total_inr / rate, 2),
                "is_estimate": True,
                "estimate_basis": "Estimate based on current road transit rates to container freight station"
            },
            {
                "id": f"qi_{uuid.uuid4().hex[:8]}",
                "item_type": "documentation",
                "description": f"Export Documentation, Customs Filing & Certificate of Origin",
                "cost_inr": round(req.port_and_doc_fee_inr, 2),
                "cost_foreign": round(req.port_and_doc_fee_inr / rate, 2),
                "is_estimate": False,
                "estimate_basis": "CHA handling fee and DGFT e-filing charges"
            },
            {
                "id": f"qi_{uuid.uuid4().hex[:8]}",
                "item_type": "margin",
                "description": f"Artisan Fair-Trade Producer Margin ({margin_pct:.1f}%)",
                "cost_inr": round(unit_margin_inr * req.quantity, 2),
                "cost_foreign": round((unit_margin_inr * req.quantity) / rate, 2),
                "is_estimate": False,
                "estimate_basis": "Configured producer margin"
            }
        ]

        if intl_shipping > 0:
            items.append({
                "id": f"qi_{uuid.uuid4().hex[:8]}",
                "item_type": "freight",
                "description": f"International Air / Ocean Freight to Destination Port",
                "cost_inr": round(intl_shipping * rate, 2),
                "cost_foreign": intl_shipping,
                "is_estimate": True,
                "estimate_basis": "Spot air courier rate subject to volumetric weight verification"
            })

        return {
            "quantity": req.quantity,
            "currency": req.currency,
            "exchange_rate_to_inr": rate,
            "unit_manufacturing_cost_inr": unit_mfg,
            "unit_packaging_cost_inr": unit_pkg,
            "unit_export_duty_inr": 0.0,
            "unit_other_cost_inr": unit_other,
            "unit_margin_inr": unit_margin_inr,
            "unit_price_fob_inr": unit_price_fob_inr,
            "unit_price_fob_foreign": unit_price_fob_foreign,
            "total_goods_fob_foreign": total_goods_fob_foreign,
            "international_shipping_foreign": intl_shipping,
            "insurance_foreign": insurance,
            "total_payable_foreign": total_payable_foreign,
            "min_allowed_price_foreign": min_allowed_foreign,
            "incoterms": req.incoterms,
            "validity_days": req.validity_days,
            "payment_terms": req.payment_terms,
            "items": items
        }

    def save_quotation(self, req: QuotationCalculateRequest, seller_id: str) -> QuotationOut:
        calc = self.calculate_quotation(req, seller_id)
        now = datetime.now().isoformat()
        quote_id = f"quote_{uuid.uuid4().hex[:10]}"
        quote_number = f"BLAI-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO quotations (
                id, quote_number, enquiry_id, seller_id, product_id, quantity, currency,
                exchange_rate_to_inr, unit_manufacturing_cost_inr, unit_packaging_cost_inr,
                unit_export_duty_inr, unit_other_cost_inr, unit_margin_inr,
                unit_price_fob_inr, unit_price_fob_foreign, total_goods_fob_foreign,
                international_shipping_foreign, insurance_foreign, total_payable_foreign,
                min_allowed_price_foreign, incoterms, validity_days, payment_terms,
                seller_approved, buyer_accepted, pdf_path, status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            quote_id, quote_number, req.enquiry_id, seller_id, req.product_id,
            calc["quantity"], calc["currency"], calc["exchange_rate_to_inr"],
            calc["unit_manufacturing_cost_inr"], calc["unit_packaging_cost_inr"],
            calc["unit_export_duty_inr"], calc["unit_other_cost_inr"], calc["unit_margin_inr"],
            calc["unit_price_fob_inr"], calc["unit_price_fob_foreign"], calc["total_goods_fob_foreign"],
            calc["international_shipping_foreign"], calc["insurance_foreign"], calc["total_payable_foreign"],
            calc["min_allowed_price_foreign"], calc["incoterms"], calc["validity_days"],
            calc["payment_terms"], 1, 0, None, "approved_by_seller", req.notes, now, now
        ))

        # Insert items
        items_out = []
        for itm in calc["items"]:
            cursor.execute("""
                INSERT INTO quotation_items (
                    id, quotation_id, item_type, description, cost_inr, cost_foreign, is_estimate, estimate_basis
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                itm["id"], quote_id, itm["item_type"], itm["description"],
                itm["cost_inr"], itm["cost_foreign"], 1 if itm["is_estimate"] else 0, itm["estimate_basis"]
            ))
            items_out.append(QuotationItemOut(**itm))

        # Activity log
        cursor.execute("""
            INSERT INTO activity_logs (id, seller_id, entity_type, entity_id, action, description, created_at)
            VALUES (?, ?, 'quotation', ?, 'QUOTATION_CREATED', ?, ?)
        """, (
            f"log_{uuid.uuid4().hex[:8]}", seller_id, quote_id,
            f"Created export quotation {quote_number} for {calc['total_payable_foreign']} {calc['currency']}",
            now
        ))

        conn.commit()
        conn.close()

        return QuotationOut(
            id=quote_id,
            quote_number=quote_number,
            enquiry_id=req.enquiry_id,
            seller_id=seller_id,
            product_id=req.product_id,
            quantity=calc["quantity"],
            currency=calc["currency"],
            exchange_rate_to_inr=calc["exchange_rate_to_inr"],
            unit_manufacturing_cost_inr=calc["unit_manufacturing_cost_inr"],
            unit_packaging_cost_inr=calc["unit_packaging_cost_inr"],
            unit_export_duty_inr=calc["unit_export_duty_inr"],
            unit_other_cost_inr=calc["unit_other_cost_inr"],
            unit_margin_inr=calc["unit_margin_inr"],
            unit_price_fob_inr=calc["unit_price_fob_inr"],
            unit_price_fob_foreign=calc["unit_price_fob_foreign"],
            total_goods_fob_foreign=calc["total_goods_fob_foreign"],
            international_shipping_foreign=calc["international_shipping_foreign"],
            insurance_foreign=calc["insurance_foreign"],
            total_payable_foreign=calc["total_payable_foreign"],
            min_allowed_price_foreign=calc["min_allowed_price_foreign"],
            incoterms=calc["incoterms"],
            validity_days=calc["validity_days"],
            payment_terms=calc["payment_terms"],
            seller_approved=True,
            buyer_accepted=False,
            pdf_path=None,
            status="approved_by_seller",
            notes=req.notes,
            items=items_out,
            created_at=now,
            updated_at=now
        )

    def get_quotation_by_id(self, quotation_id: str) -> Optional[QuotationOut]:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM quotations WHERE id = ?", (quotation_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        cursor.execute("SELECT * FROM quotation_items WHERE quotation_id = ?", (quotation_id,))
        item_rows = cursor.fetchall()
        conn.close()

        items = [
            QuotationItemOut(
                id=i["id"],
                item_type=i["item_type"],
                description=i["description"],
                cost_inr=i["cost_inr"],
                cost_foreign=i["cost_foreign"],
                is_estimate=bool(i["is_estimate"]),
                estimate_basis=i["estimate_basis"]
            )
            for i in item_rows
        ]

        return QuotationOut(
            id=row["id"],
            quote_number=row["quote_number"],
            enquiry_id=row["enquiry_id"],
            seller_id=row["seller_id"],
            product_id=row["product_id"],
            quantity=row["quantity"],
            currency=row["currency"],
            exchange_rate_to_inr=row["exchange_rate_to_inr"],
            unit_manufacturing_cost_inr=row["unit_manufacturing_cost_inr"],
            unit_packaging_cost_inr=row["unit_packaging_cost_inr"],
            unit_export_duty_inr=row["unit_export_duty_inr"],
            unit_other_cost_inr=row["unit_other_cost_inr"],
            unit_margin_inr=row["unit_margin_inr"],
            unit_price_fob_inr=row["unit_price_fob_inr"],
            unit_price_fob_foreign=row["unit_price_fob_foreign"],
            total_goods_fob_foreign=row["total_goods_fob_foreign"],
            international_shipping_foreign=row["international_shipping_foreign"],
            insurance_foreign=row["insurance_foreign"],
            total_payable_foreign=row["total_payable_foreign"],
            min_allowed_price_foreign=row["min_allowed_price_foreign"],
            incoterms=row["incoterms"],
            validity_days=row["validity_days"],
            payment_terms=row["payment_terms"],
            seller_approved=bool(row["seller_approved"]),
            buyer_accepted=bool(row["buyer_accepted"]),
            pdf_path=row["pdf_path"],
            status=row["status"],
            notes=row["notes"],
            items=items,
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

quotation_service = QuotationService()
