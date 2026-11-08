from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Seller
class SellerProfileOut(BaseModel):
    id: str
    business_name: str
    craft_type: str
    location: str
    state: str
    country: str
    currency: str
    iec_number: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    ad_code: Optional[str] = None
    bank_name: Optional[str] = None
    account_last4: Optional[str] = None
    export_experience_level: str
    is_demo: bool

# Product / Smart Product Passport
class ProductCreate(BaseModel):
    title: str
    sku: str
    description: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    dimensions: Optional[str] = None
    unit_weight_kg: float = 0.35
    hs_code: str = "6304.92.00"
    production_capacity_monthly: int = 500
    moq: int = 50
    lead_time_days: int = 14
    unit_cost_inr: float
    target_margin_pct: float = 35.0
    min_selling_price_inr: float
    packaging_details: Optional[str] = None
    image_url: Optional[str] = None
    ai_extracted_metadata: Optional[Dict[str, Any]] = None

class ProductOut(ProductCreate):
    id: str
    seller_id: str
    status: str
    is_demo: bool
    created_at: str
    updated_at: str

# Gemini Vision / Text Extraction Schema
class ProductPassportExtraction(BaseModel):
    title: str = Field(description="Product title suitable for international export catalog")
    material: str = Field(description="Specific craft/textile material e.g. 100% Slub Cotton Handloom")
    color: str = Field(description="Color shade or dye finish e.g. Ecru Natural with Indigo Stripes")
    dimensions: str = Field(description="Dimensions in metric with imperial conversion e.g. 45 x 45 cm (18 x 18 in)")
    unit_weight_kg_estimate: float = Field(default=0.35, description="Estimated unit shipping weight in kg")
    suggested_hs_code: str = Field(default="6304.92.00", description="Indian 8-digit ITC-HS export code")
    description: str = Field(description="Rich narrative highlighting artisan provenance, weaving technique, and export appeal")
    packaging_recommendation: str = Field(description="Export packaging recommendation to protect against sea/air transit moisture")
    craft_origin_details: str = Field(description="Artisan craft heritage description (e.g. Tamil Nadu handloom)")
    is_ai_suggested: bool = Field(default=True, description="Always marked true until seller confirms")

# Buyer Request Extraction Schema
class BuyerEnquiryExtraction(BaseModel):
    buyer_name: str
    buyer_company: Optional[str] = None
    buyer_country: str
    buyer_country_code: str
    requested_products: List[str]
    requested_quantity: int
    target_unit_price: Optional[float] = None
    target_currency: str = "EUR"
    delivery_timeline: Optional[str] = None
    requested_packaging: Optional[str] = None
    shipping_terms: str = "FOB"
    missing_details: List[str]
    clarification_questions: List[str]
    is_demo: bool = False

class EnquiryCreate(BaseModel):
    raw_text: str
    product_id: Optional[str] = None

class EnquiryOut(BaseModel):
    id: str
    seller_id: str
    product_id: Optional[str]
    buyer_name: str
    buyer_company: Optional[str]
    buyer_country: str
    buyer_country_code: str
    raw_enquiry_text: str
    requested_quantity: int
    target_unit_price: Optional[float]
    target_currency: str
    delivery_deadline: Optional[str]
    requested_packaging: Optional[str]
    shipping_terms: str
    match_summary: Optional[Dict[str, Any]]
    clarification_questions: Optional[List[str]]
    status: str
    is_demo: bool
    created_at: str

# Deal Intelligence Field
class DealFieldOut(BaseModel):
    id: str
    enquiry_id: str
    field_category: str
    field_name: str
    field_label: str
    field_value: Optional[str]
    source: str # seller-provided | buyer-requested | externally-verified | ai-suggested | missing-unverified
    verification_status: str # verified | pending_confirmation | discrepancy | unverified
    confidence_score: float
    evidence_note: Optional[str]
    why_it_matters: Optional[str]
    timestamp: str

class DealIntelligenceSummary(BaseModel):
    enquiry_id: str
    completeness_percentage: int
    total_fields: int
    verified_fields: int
    pending_fields: int
    missing_fields: int
    fields: List[DealFieldOut]
    recommended_actions: List[str]

# Quotation Schemas
class QuotationCalculateRequest(BaseModel):
    enquiry_id: str
    product_id: str
    quantity: int
    currency: str = "EUR"
    exchange_rate_to_inr: float = 91.50
    unit_manufacturing_cost_inr: float
    unit_packaging_cost_inr: float = 35.0
    domestic_transport_total_inr: float = 2500.0
    port_and_doc_fee_inr: float = 1500.0
    target_margin_pct: float = 35.0
    international_shipping_foreign: float = 0.0 # for CIF/DDP, 0 for FOB
    insurance_foreign: float = 0.0
    incoterms: str = "FOB Chennai Sea Port"
    payment_terms: str = "100% advance via PayPal Sandbox Trade Checkout"
    validity_days: int = 30
    notes: Optional[str] = None

class QuotationItemOut(BaseModel):
    id: str
    item_type: str
    description: str
    cost_inr: float
    cost_foreign: float
    is_estimate: bool
    estimate_basis: Optional[str]

class QuotationOut(BaseModel):
    id: str
    quote_number: str
    enquiry_id: str
    seller_id: str
    product_id: str
    quantity: int
    currency: str
    exchange_rate_to_inr: float
    unit_manufacturing_cost_inr: float
    unit_packaging_cost_inr: float
    unit_export_duty_inr: float
    unit_other_cost_inr: float
    unit_margin_inr: float
    unit_price_fob_inr: float
    unit_price_fob_foreign: float
    total_goods_fob_foreign: float
    international_shipping_foreign: float
    insurance_foreign: float
    total_payable_foreign: float
    min_allowed_price_foreign: float
    incoterms: str
    validity_days: int
    payment_terms: str
    seller_approved: bool
    buyer_accepted: bool
    pdf_path: Optional[str]
    status: str
    notes: Optional[str]
    items: List[QuotationItemOut]
    created_at: str
    updated_at: str

# Negotiation Schemas
class NegotiationAnalysisRequest(BaseModel):
    quotation_id: str
    buyer_message: str
    message_language: str = "auto" # auto, de, en

class NegotiationAnalysisOut(BaseModel):
    quotation_id: str
    original_message: str
    detected_language: str
    translated_english: str
    translated_german: Optional[str] = None
    requested_unit_price: Optional[float]
    requested_discount_pct: Optional[float]
    current_unit_price: float
    minimum_safe_unit_price: float
    is_within_price_floor: bool
    financial_impact: Dict[str, Any]
    strategic_advice: str
    suggested_reply_english: str
    suggested_reply_german: str

# PayPal Schemas
class PayPalOrderCreateRequest(BaseModel):
    quotation_id: str

class PayPalOrderCreateResponse(BaseModel):
    order_id: str
    status: str
    approval_url: Optional[str]
    currency: str
    amount: float
    quotation_id: str
    mode: str = "SANDBOX"

class PayPalOrderCaptureRequest(BaseModel):
    order_id: str
    quotation_id: str

class PayPalOrderCaptureResponse(BaseModel):
    success: bool
    order_id: str
    capture_id: Optional[str]
    status: str
    amount: float
    currency: str
    payer_email: Optional[str]
    payer_name: Optional[str]
    verified_by_paypal_api: bool
    verification_timestamp: str
    raw_status: str

# Export Readiness
class ExportReadinessItem(BaseModel):
    code: str
    category: str
    title: str
    description: str
    status: str # verified, pending, not_applicable
    source_reference: str
    official_portal_url: str
    importance: str

class ExportReadinessOut(BaseModel):
    seller_id: str
    overall_readiness_pct: int
    total_items: int
    verified_count: int
    pending_count: int
    disclaimer: str
    items: List[ExportReadinessItem]

# Activity
class ActivityLogOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    description: str
    created_at: str
