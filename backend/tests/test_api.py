import sys
import os
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import init_db, get_db_connection
from app.routers.auth import get_current_seller
from app.routers.products import list_products, ai_extract_product_passport
from app.routers.enquiries import list_enquiries, extract_buyer_enquiry
from app.routers.deal import get_deal_intelligence, update_deal_field, FieldUpdateRequest
from app.routers.quotations import list_quotations, calculate_quotation_preview, create_quotation, download_quotation_pdf
from app.routers.negotiation import get_negotiation_history, analyze_negotiation_message
from app.routers.paypal import create_paypal_order, capture_paypal_order
from app.routers.readiness import get_export_readiness
from app.routers.dashboard import get_dashboard_stats, get_activity_log
from app.schemas import (
    EnquiryCreate,
    QuotationCalculateRequest,
    NegotiationAnalysisRequest,
    PayPalOrderCreateRequest,
    PayPalOrderCaptureRequest
)
from app.services.pdf_service import pdf_service

def run_all_tests():
    def log(msg):
        print(msg.encode('ascii', errors='replace').decode('ascii'), flush=True)

    log("=================================================================")
    log("      BORDERLESS AI - FULL BACKEND VERIFICATION SUITE           ")
    log("=================================================================")

    # 1. Initialize DB & Demo Data
    init_db()
    log("[PASS] [Database] SQLite WAL data layer initialized with demo fixtures.")

    # 2. Seller Profile
    seller = get_current_seller()
    assert seller.business_name == "Kaveri Looms"
    assert seller.location == "Erode Handloom Cluster"
    log(f"[PASS] [Auth/Profile] Verified seller: {seller.business_name} ({seller.state}, {seller.country})")

    # 3. Smart Product Passport
    products = list_products()
    assert len(products) > 0
    p = products[0]
    log(f"[PASS] [Product Passport] Mapped product: '{p.title}' | SKU: {p.sku} | HS: {p.hs_code}")
    log(f"  -> Capacity: {p.production_capacity_monthly} pcs/month | Base Cost: INR {p.unit_cost_inr:.2f} | Min Price: INR {p.min_selling_price_inr:.2f}")

    # 4. Gemini Extraction Fallback / Live Extraction
    ext = ai_extract_product_passport(description="Handmade slub cotton cushion covers 45x45 cm with concealed zipper")
    assert ext.is_ai_suggested is True
    assert "cushion" in ext.title.lower() or "cotton" in ext.title.lower()
    log(f"[PASS] [Gemini Passport Extraction] Title: '{ext.title}' | AI-Suggested Tag: {ext.is_ai_suggested}")

    # 5. Buyer Request Intelligence
    enquiries = list_enquiries()
    assert len(enquiries) > 0
    enq = enquiries[0]
    log(f"[PASS] [Buyer RFQ Intelligence] Buyer: {enq.buyer_name} ({enq.buyer_company}) | Target: {enq.target_currency} {enq.target_unit_price}/unit | Requested: {enq.requested_quantity} pcs")

    # 6. Deal Evidence & Information Completeness
    deal = get_deal_intelligence(enq.id)
    assert deal.total_fields >= 10
    assert deal.completeness_percentage > 50
    log(f"[PASS] [Deal Intelligence] Information Completeness Index: {deal.completeness_percentage}% ({deal.verified_fields}/{deal.total_fields} verified)")
    for f in deal.fields[:4]:
        log(f"    * {f.field_label}: {f.field_value} [Source: {f.source} | Status: {f.verification_status}]")

    # 7. Update deal field verification
    test_field = deal.fields[0]
    update_res = update_deal_field(test_field.id, FieldUpdateRequest(
        verification_status="verified",
        evidence_note="Verified by artisan manager against official EU commercial register"
    ))
    assert update_res["success"] is True
    log(f"[PASS] [Evidence Tracking] Updated field '{test_field.field_name}' to verified.")

    # 8. Deterministic Export Quotation Calculation (Backend-enforced math)
    calc_req = QuotationCalculateRequest(
        enquiry_id=enq.id,
        product_id=p.id,
        quantity=100,
        currency="EUR",
        exchange_rate_to_inr=91.50,
        unit_manufacturing_cost_inr=280.00,
        unit_packaging_cost_inr=35.00,
        domestic_transport_total_inr=2500.00,
        port_and_doc_fee_inr=1500.00,
        target_margin_pct=35.0,
        international_shipping_foreign=0.0,
        insurance_foreign=0.0,
        incoterms="FOB Chennai Sea Port",
        payment_terms="100% advance via PayPal Sandbox Trade Checkout",
        validity_days=30,
        notes="Verified artisan price model"
    )
    preview = calculate_quotation_preview(calc_req)
    assert preview["total_payable_foreign"] > 0
    assert preview["unit_price_fob_foreign"] >= preview["min_allowed_price_foreign"]
    log(f"[PASS] [Deterministic Quotation] Unit FOB: {preview['currency']} {preview['unit_price_fob_foreign']} | Batch Total: {preview['currency']} {preview['total_payable_foreign']} | Price Floor: {preview['min_allowed_price_foreign']}")

    # 9. Create and Save Quotation
    new_quote = create_quotation(calc_req)
    assert new_quote.seller_approved is True
    assert len(new_quote.items) >= 5
    log(f"[PASS] [Saved Quotation] Ref: {new_quote.quote_number} | Status: {new_quote.status} | Itemized line items: {len(new_quote.items)}")

    # 10. PDF Proforma Quotation Generation
    pdf_path = pdf_service.generate_quotation_pdf(new_quote.id)
    assert os.path.exists(pdf_path)
    file_size = os.path.getsize(pdf_path)
    assert file_size > 1000
    log(f"[PASS] [PDF Document Generator] Generated professional PDF quotation ({file_size} bytes): {Path(pdf_path).name}")

    # 11. Global Negotiation Assistant (Translation + Margin Impact)
    neg_req = NegotiationAnalysisRequest(
        quotation_id=new_quote.id,
        buyer_message="Hallo Ramesh, vielen Dank. Koennen wir 4.85 EUR pro Stueck vereinbaren?",
        message_language="de"
    )
    neg_analysis = analyze_negotiation_message(neg_req)
    assert neg_analysis.is_within_price_floor is True
    assert neg_analysis.financial_impact["margin_pct_realized"] > 15
    log(f"[PASS] [Negotiation Assistant] Detected Language: {neg_analysis.detected_language} | Translated: '{neg_analysis.translated_english[:60]}...'")
    log(f"    -> Financial Impact: Margin realized: {neg_analysis.financial_impact['margin_pct_realized']}% | Batch Profit: INR {neg_analysis.financial_impact['total_batch_profit_inr']}")
    log(f"    -> Suggested German Counter-Offer: '{neg_analysis.suggested_reply_german[:60]}...'")

    # 12. PayPal Sandbox Order Creation
    pay_order = create_paypal_order(PayPalOrderCreateRequest(quotation_id=new_quote.id))
    assert pay_order.order_id is not None
    assert pay_order.status == "CREATED"
    log(f"[PASS] [PayPal Sandbox Orders API v2] Created Order: {pay_order.order_id} | Amount: {pay_order.amount} {pay_order.currency} | Mode: {pay_order.mode}")

    # 13. PayPal Sandbox Order Capture & Verification
    cap_res = capture_paypal_order(PayPalOrderCaptureRequest(
        order_id=pay_order.order_id,
        quotation_id=new_quote.id
    ))
    assert cap_res.success is True
    assert cap_res.verified_by_paypal_api is True
    assert cap_res.status == "COMPLETED"
    log(f"[PASS] [PayPal Sandbox Capture & Verification] Capture ID: {cap_res.capture_id} | Status: {cap_res.status} | Verified on API: {cap_res.verified_by_paypal_api}")

    # 14. Export Readiness Checklist
    readiness = get_export_readiness()
    assert readiness.total_items >= 7
    log(f"[PASS] [Export Readiness Checklist] Overall Readiness: {readiness.overall_readiness_pct}% ({readiness.verified_count} verified, {readiness.pending_count} pending)")

    # 15. Dashboard Overview Stats
    stats = get_dashboard_stats()
    assert stats["metrics"]["payments_captured_count"] >= 1
    assert stats["metrics"]["total_captured_eur"] >= 500
    log(f"[PASS] [Deal Dashboard KPI] Active Products: {stats['metrics']['products_count']} | Quotations: {stats['metrics']['quotations_count']} | Captured Revenue: EUR {stats['metrics']['total_captured_eur']}")

    # 16. Activity Timeline Logs
    activity = get_activity_log()
    assert len(activity) >= 5
    log(f"[PASS] [Activity Audit Trail] {len(activity)} timestamped trade events logged.")

    log("\n=================================================================")
    log(" >>> ALL 16 BACKEND ACCEPTANCE CRITERIA PASSED WITHOUT ERROR! <<<")
    log("=================================================================\n")

if __name__ == "__main__":
    run_all_tests()
