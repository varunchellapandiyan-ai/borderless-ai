import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'seller',
        created_at TEXT NOT NULL
    );
    """)

    # 2. Seller Profiles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS seller_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        business_name TEXT NOT NULL,
        craft_type TEXT NOT NULL,
        location TEXT NOT NULL,
        state TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'India',
        currency TEXT NOT NULL DEFAULT 'INR',
        iec_number TEXT,
        gstin TEXT,
        pan TEXT,
        ad_code TEXT,
        bank_name TEXT,
        account_last4 TEXT,
        export_experience_level TEXT DEFAULT 'first_time',
        is_demo BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 3. Products (Smart Product Passport)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        title TEXT NOT NULL,
        sku TEXT NOT NULL,
        description TEXT,
        material TEXT,
        color TEXT,
        dimensions TEXT,
        unit_weight_kg REAL DEFAULT 0.35,
        hs_code TEXT DEFAULT '6304.92.00',
        production_capacity_monthly INTEGER DEFAULT 500,
        moq INTEGER DEFAULT 50,
        lead_time_days INTEGER DEFAULT 14,
        unit_cost_inr REAL NOT NULL,
        target_margin_pct REAL DEFAULT 35.0,
        min_selling_price_inr REAL NOT NULL,
        packaging_details TEXT,
        image_url TEXT,
        ai_extracted_metadata TEXT, -- JSON
        status TEXT NOT NULL DEFAULT 'draft', -- draft, active, archived
        is_demo BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (seller_id) REFERENCES seller_profiles(id)
    );
    """)

    # 4. Enquiries (Buyer Request Intelligence)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        product_id TEXT,
        buyer_name TEXT NOT NULL,
        buyer_company TEXT,
        buyer_country TEXT NOT NULL,
        buyer_country_code TEXT NOT NULL DEFAULT 'DE',
        raw_enquiry_text TEXT NOT NULL,
        requested_quantity INTEGER NOT NULL,
        target_unit_price REAL,
        target_currency TEXT DEFAULT 'EUR',
        delivery_deadline TEXT,
        requested_packaging TEXT,
        shipping_terms TEXT DEFAULT 'FOB',
        match_summary TEXT, -- JSON
        clarification_questions TEXT, -- JSON array
        status TEXT NOT NULL DEFAULT 'received', -- received, analyzing, quoted, negotiating, accepted, declined
        is_demo BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (seller_id) REFERENCES seller_profiles(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    """)

    # 5. Deal Fields (Evidence-Backed Deal Intelligence)
    # Source: seller-provided | buyer-requested | externally-verified | ai-suggested | missing-unverified
    # Status: verified | pending_confirmation | discrepancy | unverified
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deal_fields (
        id TEXT PRIMARY KEY,
        enquiry_id TEXT NOT NULL,
        field_category TEXT NOT NULL, -- product, quantity, cost, shipping, buyer, compliance, payment
        field_name TEXT NOT NULL,
        field_label TEXT NOT NULL,
        field_value TEXT,
        source TEXT NOT NULL, -- seller-provided, buyer-requested, externally-verified, ai-suggested, missing-unverified
        verification_status TEXT NOT NULL, -- verified, pending_confirmation, discrepancy, unverified
        confidence_score REAL DEFAULT 1.0,
        evidence_note TEXT,
        why_it_matters TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id)
    );
    """)

    # 6. Quotations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        quote_number TEXT UNIQUE NOT NULL,
        enquiry_id TEXT NOT NULL,
        seller_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        exchange_rate_to_inr REAL NOT NULL DEFAULT 91.50,
        unit_manufacturing_cost_inr REAL NOT NULL,
        unit_packaging_cost_inr REAL NOT NULL,
        unit_export_duty_inr REAL NOT NULL DEFAULT 0.0,
        unit_other_cost_inr REAL NOT NULL DEFAULT 0.0,
        unit_margin_inr REAL NOT NULL,
        unit_price_fob_inr REAL NOT NULL,
        unit_price_fob_foreign REAL NOT NULL,
        total_goods_fob_foreign REAL NOT NULL,
        international_shipping_foreign REAL NOT NULL DEFAULT 0.0,
        insurance_foreign REAL NOT NULL DEFAULT 0.0,
        total_payable_foreign REAL NOT NULL,
        min_allowed_price_foreign REAL NOT NULL,
        incoterms TEXT NOT NULL DEFAULT 'FOB Chennai Port',
        validity_days INTEGER NOT NULL DEFAULT 30,
        payment_terms TEXT NOT NULL DEFAULT '100% advance via PayPal Sandbox Trade Checkout',
        seller_approved BOOLEAN DEFAULT 0,
        buyer_accepted BOOLEAN DEFAULT 0,
        pdf_path TEXT,
        status TEXT NOT NULL DEFAULT 'draft', -- draft, approved_by_seller, sent, revised, accepted, paid
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (enquiry_id) REFERENCES enquiries(id),
        FOREIGN KEY (seller_id) REFERENCES seller_profiles(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    """)

    # 7. Quotation Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quotation_items (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        item_type TEXT NOT NULL, -- product, packaging, domestic_logistics, port_handling, documentation, freight
        description TEXT NOT NULL,
        cost_inr REAL NOT NULL,
        cost_foreign REAL NOT NULL,
        is_estimate BOOLEAN DEFAULT 0,
        estimate_basis TEXT,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    );
    """)

    # 8. Negotiation Messages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS negotiation_messages (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        sender_role TEXT NOT NULL, -- buyer, seller, ai_copilot
        original_language TEXT NOT NULL DEFAULT 'en', -- en, de
        original_message TEXT NOT NULL,
        translated_message TEXT,
        requested_discount_pct REAL,
        requested_unit_price_foreign REAL,
        margin_impact_summary TEXT, -- JSON
        is_within_price_floor BOOLEAN,
        copilot_suggested_reply TEXT,
        seller_approved_reply TEXT,
        status TEXT NOT NULL DEFAULT 'pending_review', -- pending_review, approved_and_sent, counter_offered
        created_at TEXT NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    );
    """)

    # 9. Payment Orders (PayPal Sandbox)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payment_orders (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        paypal_order_id TEXT UNIQUE,
        paypal_capture_id TEXT,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        status TEXT NOT NULL DEFAULT 'CREATED', -- CREATED, SAVED, APPROVED, VOIDED, COMPLETED, PAYER_ACTION_REQUIRED
        paypal_approval_url TEXT,
        paypal_raw_response TEXT, -- JSON
        verified_by_paypal_api BOOLEAN DEFAULT 0,
        verification_timestamp TEXT,
        payer_email TEXT,
        payer_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    );
    """)

    # 10. Activity Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        entity_type TEXT NOT NULL, -- product, enquiry, deal, quotation, negotiation, payment
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT, -- JSON
        created_at TEXT NOT NULL,
        FOREIGN KEY (seller_id) REFERENCES seller_profiles(id)
    );
    """)

    conn.commit()

    # Seed demo data if database is empty
    cursor.execute("SELECT COUNT(*) as count FROM seller_profiles;")
    row = cursor.fetchone()
    if row["count"] == 0:
        seed_demo_data(cursor)
        conn.commit()
        
    conn.close()

def seed_demo_data(cursor: sqlite3.Cursor):
    now = datetime.now().isoformat()

    # 1. User
    user_id = "usr_kaveri_01"
    cursor.execute("""
    INSERT INTO users (id, email, name, role, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (user_id, "ramesh@kaverilooms.demo", "Ramesh Kumar", "seller", now))

    # 2. Seller Profile: Kaveri Looms
    seller_id = "sel_kaveri_01"
    cursor.execute("""
    INSERT INTO seller_profiles (
        id, user_id, business_name, craft_type, location, state, country, currency,
        iec_number, gstin, pan, ad_code, bank_name, account_last4,
        export_experience_level, is_demo, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        seller_id, user_id, "Kaveri Looms", "Handloom & Cotton Home Textiles",
        "Erode Handloom Cluster", "Tamil Nadu", "India", "INR",
        "3207019842 (Verified Mock)", "33AABCK1234F1Z8", "AABCK1234F",
        "0200054 (SBI Erode SME)", "State Bank of India", "7841",
        "first_time", 1, now
    ))

    # 3. Product: Handmade Cotton Cushion Covers
    product_id = "prod_cushion_01"
    ai_metadata = json.dumps({
        "vision_extracted": True,
        "texture": "Slub yarn-dyed organic cotton weave with textured ribbing",
        "closure": "Concealed YKK nylon zipper at bottom seam",
        "wash_care": "Hand wash cold, line dry in shade, medium iron",
        "sustainability_tag": "100% GOTS-certified organic cotton, natural vegetable azo-free dye",
        "packaging_standard": "Each piece in biodegradable cornstarch polybag, 50 pcs per 7-ply master carton"
    })

    cursor.execute("""
    INSERT INTO products (
        id, seller_id, title, sku, description, material, color, dimensions,
        unit_weight_kg, hs_code, production_capacity_monthly, moq, lead_time_days,
        unit_cost_inr, target_margin_pct, min_selling_price_inr,
        packaging_details, image_url, ai_extracted_metadata, status, is_demo,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        product_id, seller_id,
        "Artisan Handloom Cotton Cushion Covers (45x45 cm)",
        "KL-CUSH-45-ECRU",
        "Hand-loomed in Erode, Tamil Nadu by master weavers using traditional shuttle pit looms. Premium slub textured 100% cotton with piped seam borders and heavy-duty concealed zipper. Designed for sustainable home decor exporters.",
        "100% Slub Cotton Handloom",
        "Ecru Natural Oatmeal & Indigo Stripe",
        "45 x 45 cm (18 x 18 inches)",
        0.32,
        "6304.92.00",
        800,
        50,
        18,
        280.00,  # Manufacturing cost in INR (~€3.06)
        35.0,    # Target margin 35%
        340.00,  # Minimum safe selling price in INR (~€3.72)
        "Individual eco-friendly polybag with barcode sticker; master carton 50 units (60x40x35 cm, gross wt 17.5 kg)",
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
        ai_metadata,
        "active",
        1,
        now, now
    ))

    # 4. Sample International Buyer Enquiry
    enquiry_id = "enq_german_01"
    raw_enquiry = """Subject: Urgent RFQ - 100 pcs Artisan Cotton Cushion Covers for Hamburg boutique

Dear Kaveri Looms Team,

We came across your collection of handloom textiles from Tamil Nadu. We run Hanseatische Wohnkultur GmbH, a sustainable home living brand in Hamburg, Germany. 

We are interested in placing a trial order for:
- Product: Handloom textured cotton cushion covers (similar to your Ecru collection)
- Size: 45 x 45 cm
- Quantity: 100 pieces (sample commercial batch)
- Color: Natural Ecru / Slate Gray
- Target Price: We are targeting around €5.20 to €5.50 per unit FOB Chennai or CIF Hamburg
- Delivery Timeline: Required in Hamburg warehouse before mid-next month for our Spring Showcase
- Packaging: Barcoded individual paper sleeve or biodegradable polybag, retail-ready

Could you confirm:
1. Your best FOB quotation for 100 pieces in EUR?
2. Do you provide Certificate of Origin (GSP/REX statement) for EU customs clearance?
3. What is your lead time for 100 units from order confirmation?

Best regards,
Frau Greta Lindemann
Head of Sourcing | Hanseatische Wohnkultur GmbH
Hamburg, Germany (DE-HH)
greta.lindemann@hanseatische-wohnkultur.de.demo"""

    match_summary = json.dumps({
        "matched_product_id": product_id,
        "matched_product_title": "Artisan Handloom Cotton Cushion Covers (45x45 cm)",
        "quantity_match": "100 pcs matches seller MOQ (50 pcs) and capacity (800 pcs/mo)",
        "dimension_match": "Exact 45x45 cm matches standard master pattern",
        "target_price_assessment": "Buyer target €5.20 - €5.50 is above seller minimum floor (€3.72) — healthy negotiation buffer",
        "timeline_feasibility": "18 days production + 5 days air freight / 25 days sea freight"
    })

    clarifications = json.dumps([
        "Confirm whether buyer prefers Air Express courier (4-6 days to Hamburg) or Air Freight to Hamburg Airport (HAM).",
        "Clarify if European REACH chemical compliance test certificate for azo-free dyes is mandatory for this trial batch.",
        "Check whether buyer has German VAT / EORI number (DE123456789) ready for customs clearance."
    ])

    cursor.execute("""
    INSERT INTO enquiries (
        id, seller_id, product_id, buyer_name, buyer_company, buyer_country,
        buyer_country_code, raw_enquiry_text, requested_quantity, target_unit_price,
        target_currency, delivery_deadline, requested_packaging, shipping_terms,
        match_summary, clarification_questions, status, is_demo, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        enquiry_id, seller_id, product_id, "Greta Lindemann",
        "Hanseatische Wohnkultur GmbH", "Germany", "DE",
        raw_enquiry, 100, 5.40, "EUR", "2025-04-15",
        "Individual biodegradable polybag with retail barcode", "FOB",
        match_summary, clarifications, "analyzing", 1, now
    ))

    # 5. Deal Fields (Evidence-Backed Intelligence)
    deal_fields_data = [
        ("df_01", enquiry_id, "buyer", "buyer_identity", "Buyer Business Identity", "Hanseatische Wohnkultur GmbH, Hamburg", "buyer-requested", "verified", 0.95, "Registered German GmbH, domain match in enquiry header", "Validates legitimate commercial business entity before committing pricing"),
        ("df_02", enquiry_id, "buyer", "buyer_country", "Destination Country", "Germany (European Union)", "buyer-requested", "verified", 1.0, "Hamburg, Germany stated in header and warehouse delivery query", "Governs EU import tariffs, GSP status, REACH safety regulations, and VAT/EORI"),
        ("df_03", enquiry_id, "product", "product_sku", "Target Product SKU", "KL-CUSH-45-ECRU", "seller-provided", "verified", 1.0, "Matched with Kaveri Looms active Product Passport", "Ensures technical weave specs, weight, and loom capacity are strictly accounted for"),
        ("df_04", enquiry_id, "product", "hs_code", "Harmonized System (HS) Code", "6304.92.00 (Other furnishing articles of cotton, not knitted/crocheted)", "externally-verified", "verified", 0.98, "Verified against Indian DGFT ITC-HS database & EU TARIC nomenclature", "Essential for export shipping bill filing, customs duty calculation and export duty exemption"),
        ("df_05", enquiry_id, "quantity", "order_quantity", "Export Order Quantity", "100 Units", "buyer-requested", "verified", 1.0, "Explicitly stated in RFQ body", "Exceeds seller minimum order quantity (50 units) and fits standard 2-carton freight tier"),
        ("df_06", enquiry_id, "cost", "unit_manufacturing_cost", "Unit Production Cost", "INR 280.00 (€3.06)", "seller-provided", "verified", 1.0, "Verified directly from Kaveri Looms verified cost ledger", "Absolute cost baseline — AI is prohibited from overriding or inventing production costs"),
        ("df_07", enquiry_id, "cost", "packaging_cost", "Export Grade Packaging Cost", "INR 35.00 (€0.38) per unit", "seller-provided", "verified", 0.95, "Biodegradable sleeve + 7-ply moisture-barrier export carton", "Avoids humidity transit damage in Indian Ocean / Suez sea or air transit"),
        ("df_08", enquiry_id, "cost", "domestic_freight", "Domestic Logistics to Chennai Port", "INR 2,500 (€27.32) total batch", "ai-suggested", "pending_confirmation", 0.85, "Calculated based on Erode-to-Chennai Container Freight Station (CFS) 380 km trucking quote", "Seller must confirm final trucking rates with local Erode freight forwarder"),
        ("df_09", enquiry_id, "shipping", "incoterms", "Proposed Delivery Incoterm", "FOB Chennai Sea Port / MAA Air Cargo", "buyer-requested", "pending_confirmation", 0.90, "Enquiry states 'FOB Chennai or CIF Hamburg'", "FOB places international ocean/air freight and Hamburg import customs on buyer"),
        ("df_10", enquiry_id, "compliance", "origin_certificate", "EU REX / GSP Certificate of Origin", "Registered Exporter System (REX) Statement Required", "buyer-requested", "missing-unverified", 0.60, "Buyer specifically inquired about GSP/REX statement for tariff preference", "Crucial: German customs grants 0% or reduced duty if Indian origin statement is attached"),
        ("df_11", enquiry_id, "payment", "payment_method", "Settlement Rails", "PayPal Orders API v2 (Sandbox Verified)", "seller-provided", "verified", 1.0, "Supported by BORDERLESS AI secure export milestone checkout", "Secures 100% advance foreign exchange settlement directly credited with verified capture")
    ]

    for df in deal_fields_data:
        cursor.execute("""
        INSERT INTO deal_fields (
            id, enquiry_id, field_category, field_name, field_label, field_value,
            source, verification_status, confidence_score, evidence_note, why_it_matters, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (*df, now))

    # 6. Quotation: Initial Transparent Export Quotation
    quote_id = "quote_kaveri_001"
    quote_number = "BLAI-2025-KL-001"
    
    # Deterministic calculations:
    # 100 pcs:
    # Manufacturing cost: 100 * 280 = 28,000 INR
    # Packaging: 100 * 35 = 3,500 INR
    # Domestic transport & port terminal handling: 3,000 INR
    # Documentation & export clearance: 1,500 INR
    # Total direct costs: 36,000 INR (360 INR/unit)
    # Margin 35%: 12,600 INR (126 INR/unit)
    # Total FOB price INR: 48,600 INR (486.00 INR/unit)
    # At 91.50 INR/EUR = €5.31 per unit FOB! Total = €531.00 FOB.
    # Minimum allowed price (floor at 15% margin): 414.00 INR = €4.52/unit
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
        quote_id, quote_number, enquiry_id, seller_id, product_id, 100, "EUR",
        91.50, 280.00, 35.00,
        0.00, 45.00, 126.00,
        486.00, 5.31, 531.00,
        0.00, 0.00, 531.00,
        4.52, "FOB Chennai Port (Incoterms 2020)", 30,
        "100% advance commercial deposit via PayPal Sandbox Trade Checkout",
        1, 0, None, "approved_by_seller",
        "Quotation approved by Kaveri Looms management. Deterministically calculated based on 100% verified artisan costs.",
        now, now
    ))

    # 7. Quotation Items
    q_items = [
        ("qi_01", quote_id, "product", "Handloom Cotton Cushion Covers 45x45cm (100 units @ INR 280.00)", 28000.00, 306.01, 0, "Seller verified loom labor & organic slub cotton yarn"),
        ("qi_02", quote_id, "packaging", "Export Protective Packing: Biodegradable bag + 7-ply export carton", 3500.00, 38.25, 0, "Commercial export grade outer cartons with moisture desiccants"),
        ("qi_03", quote_id, "domestic_logistics", "Dedicated road transit from Erode cluster to Chennai CFS", 2500.00, 27.32, 1, "Standard LCL pickup quote from Erode Logistics Park"),
        ("qi_04", quote_id, "documentation", "Export Documentation, Shipping Bill filing & REX Origin verification", 2000.00, 21.86, 0, "Customs house agent standard filing fee for textile consignments"),
        ("qi_05", quote_id, "margin", "Artisan Producer Profit Margin (35% target)", 12600.00, 137.70, 0, "Sustainable fair-wage artisan livelihood margin")
    ]
    for qi in q_items:
        cursor.execute("""
        INSERT INTO quotation_items (id, quotation_id, item_type, description, cost_inr, cost_foreign, is_estimate, estimate_basis)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, qi)

    # 8. Negotiation Message
    neg_id = "neg_kaveri_01"
    de_buyer_msg = "Hallo Ramesh, danke für das Angebot über 5,31 € pro Stück. Wir finden die Qualität hervorragend. Da dies ein Testauftrag ist, könnten Sie uns einen Rabatt auf 4,85 € pro Stück für diese 100 Stück gewähren? Wenn der Abverkauf gut läuft, bestellen wir im Juli 500 Einheiten."
    en_translation = "Hello Ramesh, thank you for the quotation of €5.31 per piece. We find the quality outstanding. Since this is a test order, could you grant us a discount to €4.85 per piece for these 100 units? If sales go well, we will order 500 units in July."

    margin_analysis = json.dumps({
        "current_quote_eur": 5.31,
        "requested_price_eur": 4.85,
        "discount_requested_pct": 8.66,
        "price_floor_eur": 4.52,
        "is_acceptable": True,
        "margin_at_requested_price": 24.3,  # down from 35%
        "profit_inr_retained": 7927.50,
        "recommendation": "Acceptable counter-offer with volume contingency: Propose €4.95 FOB for this 100-pc trial, with guaranteed €4.75 pricing locked for the follow-up 500-unit batch."
    })

    copilot_suggested = """Dear Greta,

Thank you for your constructive response and enthusiasm for our Erode handloom cushion covers.

We deeply value building a long-term partnership with Hanseatische Wohnkultur. While €4.85 is near our raw production threshold for a small 100-piece handcrafted batch, we are pleased to meet you halfway at **€4.95 per piece FOB Chennai** for this initial sample commercial run.

Furthermore, we are happy to commit formally in writing that upon placing your planned 500-unit order in July, we will apply a preferred volume rate of **€4.75 per piece**.

Please let us know if this works so we can update your formal quotation and send your PayPal checkout link to reserve loom scheduling.

Warm regards,
Ramesh Kumar | Kaveri Looms"""

    cursor.execute("""
    INSERT INTO negotiation_messages (
        id, quotation_id, sender_role, original_language, original_message,
        translated_message, requested_discount_pct, requested_unit_price_foreign,
        margin_impact_summary, is_within_price_floor, copilot_suggested_reply,
        seller_approved_reply, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        neg_id, quote_id, "buyer", "de", de_buyer_msg, en_translation,
        8.66, 4.85, margin_analysis, 1, copilot_suggested,
        copilot_suggested, "pending_review", now
    ))

    # 9. Activity Logs
    logs = [
        ("log_01", seller_id, "product", product_id, "PRODUCT_PASSPORT_CREATED", "Created Smart Product Passport for Artisan Handloom Cotton Cushion Covers (45x45 cm) with verified material and production capacity.", now),
        ("log_02", seller_id, "enquiry", enquiry_id, "BUYER_ENQUIRY_EXTRACTED", "Extracted RFQ from Hanseatische Wohnkultur GmbH (Hamburg, Germany) for 100 pcs. Target price €5.40.", now),
        ("log_03", seller_id, "deal", enquiry_id, "EVIDENCE_INTELLIGENCE_GENERATED", "Analyzed 11 deal fields across buyer, product, cost, and compliance. Completeness score: 82%.", now),
        ("log_04", seller_id, "quotation", quote_id, "QUOTATION_DETERMINISTICALLY_CALCULATED", "Generated quotation BLAI-2025-KL-001 for €531.00 (€5.31/unit) FOB Chennai Port with 35% artisan margin.", now),
        ("log_05", seller_id, "negotiation", neg_id, "BUYER_COUNTER_OFFER_ANALYZED", "German negotiation message translated and financial impact calculated: €4.85 is within safe floor (€4.52).", now)
    ]
    for log in logs:
        cursor.execute("""
        INSERT INTO activity_logs (id, seller_id, entity_type, entity_id, action, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, log)
