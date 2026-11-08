// Type definitions for BORDERLESS AI

export type SourceType =
  | 'seller-provided'
  | 'buyer-requested'
  | 'externally-verified'
  | 'ai-suggested'
  | 'missing-unverified';

export type VerificationStatus =
  | 'verified'
  | 'pending_confirmation'
  | 'discrepancy'
  | 'unverified';

export interface SellerProfile {
  id: string;
  business_name: string;
  craft_type: string;
  location: string;
  state: string;
  country: string;
  currency: string;
  iec_number?: string;
  gstin?: string;
  pan?: string;
  ad_code?: string;
  bank_name?: string;
  account_last4?: string;
  export_experience_level: string;
  is_demo: boolean;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  sku: string;
  description?: string;
  material?: string;
  color?: string;
  dimensions?: string;
  unit_weight_kg: number;
  hs_code: string;
  production_capacity_monthly: number;
  moq: number;
  lead_time_days: number;
  unit_cost_inr: number;
  target_margin_pct: number;
  min_selling_price_inr: number;
  packaging_details?: string;
  image_url?: string;
  ai_extracted_metadata?: Record<string, any>;
  status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPassportExtraction {
  title: string;
  material: string;
  color: string;
  dimensions: string;
  unit_weight_kg_estimate: number;
  suggested_hs_code: string;
  description: string;
  packaging_recommendation: string;
  craft_origin_details: string;
  is_ai_suggested: boolean;
}

export interface BuyerEnquiry {
  id: string;
  seller_id: string;
  product_id?: string;
  buyer_name: string;
  buyer_company?: string;
  buyer_country: string;
  buyer_country_code: string;
  raw_enquiry_text: string;
  requested_quantity: number;
  target_unit_price?: number;
  target_currency: string;
  delivery_deadline?: string;
  requested_packaging?: string;
  shipping_terms: string;
  match_summary?: {
    matched_product_id?: string;
    matched_product_title?: string;
    quantity_match?: string;
    dimension_match?: string;
    target_price_assessment?: string;
    timeline_feasibility?: string;
    [key: string]: any;
  };
  clarification_questions?: string[];
  status: string;
  is_demo: boolean;
  created_at: string;
}

export interface BuyerEnquiryExtraction {
  buyer_name: string;
  buyer_company?: string;
  buyer_country: string;
  buyer_country_code: string;
  requested_products: string[];
  requested_quantity: number;
  target_unit_price?: number;
  target_currency: string;
  delivery_timeline?: string;
  requested_packaging?: string;
  shipping_terms: string;
  missing_details: string[];
  clarification_questions: string[];
  is_demo: boolean;
}

export interface DealField {
  id: string;
  enquiry_id: string;
  field_category: string;
  field_name: string;
  field_label: string;
  field_value?: string;
  source: SourceType;
  verification_status: VerificationStatus;
  confidence_score: number;
  evidence_note?: string;
  why_it_matters?: string;
  timestamp: string;
}

export interface DealIntelligenceSummary {
  enquiry_id: string;
  completeness_percentage: number;
  total_fields: number;
  verified_fields: number;
  pending_fields: number;
  missing_fields: number;
  fields: DealField[];
  recommended_actions: string[];
}

export interface QuotationItem {
  id: string;
  item_type: string;
  description: string;
  cost_inr: number;
  cost_foreign: number;
  is_estimate: boolean;
  estimate_basis?: string;
}

export interface Quotation {
  id: string;
  quote_number: string;
  enquiry_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  currency: string;
  exchange_rate_to_inr: number;
  unit_manufacturing_cost_inr: number;
  unit_packaging_cost_inr: number;
  unit_export_duty_inr: number;
  unit_other_cost_inr: number;
  unit_margin_inr: number;
  unit_price_fob_inr: number;
  unit_price_fob_foreign: number;
  total_goods_fob_foreign: number;
  international_shipping_foreign: number;
  insurance_foreign: number;
  total_payable_foreign: number;
  min_allowed_price_foreign: number;
  incoterms: string;
  validity_days: number;
  payment_terms: string;
  seller_approved: boolean;
  buyer_accepted: boolean;
  pdf_path?: string;
  status: string;
  notes?: string;
  items: QuotationItem[];
  created_at: string;
  updated_at: string;
}

export interface NegotiationMessage {
  id: string;
  quotation_id: string;
  sender_role: string;
  original_language: string;
  original_message: string;
  translated_message?: string;
  requested_discount_pct?: number;
  requested_unit_price_foreign?: number;
  margin_impact_summary?: {
    current_unit_price_foreign: number;
    requested_unit_price_foreign: number;
    requested_discount_pct: number;
    minimum_allowed_unit_price: number;
    currency: string;
    unit_base_cost_inr: number;
    requested_unit_price_inr: number;
    net_profit_per_unit_inr: number;
    total_batch_profit_inr: number;
    margin_pct_realized: number;
    is_above_minimum_floor: boolean;
    [key: string]: any;
  };
  is_within_price_floor: boolean;
  copilot_suggested_reply?: string;
  seller_approved_reply?: string;
  status: string;
  created_at: string;
}

export interface NegotiationAnalysisResponse {
  quotation_id: string;
  original_message: string;
  detected_language: string;
  translated_english: string;
  translated_german?: string;
  requested_unit_price?: number;
  requested_discount_pct?: number;
  current_unit_price: number;
  minimum_safe_unit_price: number;
  is_within_price_floor: boolean;
  financial_impact: {
    current_unit_price_foreign: number;
    requested_unit_price_foreign: number;
    requested_discount_pct: number;
    minimum_allowed_unit_price: number;
    currency: string;
    unit_base_cost_inr: number;
    requested_unit_price_inr: number;
    net_profit_per_unit_inr: number;
    total_batch_profit_inr: number;
    margin_pct_realized: number;
    is_above_minimum_floor: boolean;
  };
  strategic_advice: string;
  suggested_reply_english: string;
  suggested_reply_german: string;
}

export interface PayPalOrderResponse {
  order_id: string;
  status: string;
  approval_url?: string;
  currency: string;
  amount: number;
  quotation_id: string;
  mode: string;
}

export interface PayPalCaptureResponse {
  success: boolean;
  order_id: string;
  capture_id?: string;
  status: string;
  amount: number;
  currency: string;
  payer_email?: string;
  payer_name?: string;
  verified_by_paypal_api: boolean;
  verification_timestamp: string;
  raw_status: string;
}

export interface ExportReadinessItem {
  code: string;
  category: string;
  title: string;
  description: string;
  status: 'verified' | 'pending' | 'not_applicable';
  source_reference: string;
  official_portal_url: string;
  importance: string;
}

export interface ExportReadinessData {
  seller_id: string;
  overall_readiness_pct: number;
  total_items: number;
  verified_count: number;
  pending_count: number;
  disclaimer: string;
  items: ExportReadinessItem[];
}

export interface DashboardStats {
  seller_business_name: string;
  craft_type: string;
  location: string;
  currency: string;
  metrics: {
    products_count: number;
    enquiries_count: number;
    quotations_count: number;
    total_quoted_eur: number;
    payments_captured_count: number;
    total_captured_eur: number;
    deal_evidence_health_pct: number;
    export_readiness_pct: number;
  };
  system_status: {
    gemini_ai: {
      configured: boolean;
      model: string;
      mode: string;
    };
    paypal_sandbox: {
      configured: boolean;
      base_url: string;
      mode: string;
    };
    database: {
      status: string;
      engine: string;
    };
  };
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  created_at: string;
}
