import {
  SellerProfile,
  Product,
  ProductPassportExtraction,
  BuyerEnquiry,
  BuyerEnquiryExtraction,
  DealIntelligenceSummary,
  Quotation,
  NegotiationMessage,
  NegotiationAnalysisResponse,
  PayPalOrderResponse,
  PayPalCaptureResponse,
  ExportReadinessData,
  DashboardStats,
  ActivityLog
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth & Profile
  async getSeller(): Promise<SellerProfile> {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to load seller profile');
    return res.json();
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Failed to load product');
    return res.json();
  },

  async extractProductPassport(description: string, imageFile?: File): Promise<ProductPassportExtraction> {
    const formData = new FormData();
    formData.append('description', description);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const res = await fetch(`${API_BASE}/products/ai-extract`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('AI Product Passport extraction failed');
    return res.json();
  },

  async createProduct(data: any): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  },

  // Enquiries
  async getEnquiries(): Promise<BuyerEnquiry[]> {
    const res = await fetch(`${API_BASE}/enquiries`);
    if (!res.ok) throw new Error('Failed to load enquiries');
    return res.json();
  },

  async getEnquiry(id: string): Promise<BuyerEnquiry> {
    const res = await fetch(`${API_BASE}/enquiries/${id}`);
    if (!res.ok) throw new Error('Failed to load enquiry');
    return res.json();
  },

  async extractBuyerEnquiry(rawText: string): Promise<BuyerEnquiryExtraction> {
    const res = await fetch(`${API_BASE}/enquiries/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText }),
    });
    if (!res.ok) throw new Error('AI enquiry parsing failed');
    return res.json();
  },

  async saveEnquiry(extraction: BuyerEnquiryExtraction, rawText: string, productId?: string): Promise<BuyerEnquiry> {
    const res = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extraction,
        raw_text: rawText,
        product_id: productId,
        seller_id: 'sel_kaveri_01',
      }),
    });
    if (!res.ok) throw new Error('Failed to save enquiry');
    return res.json();
  },

  // Deal Intelligence
  async getDealIntelligence(enquiryId: string): Promise<DealIntelligenceSummary> {
    const res = await fetch(`${API_BASE}/deal/${enquiryId}`);
    if (!res.ok) throw new Error('Failed to load deal intelligence');
    return res.json();
  },

  async updateDealField(fieldId: string, verificationStatus: string, evidenceNote?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/deal/fields/${fieldId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_status: verificationStatus,
        evidence_note: evidenceNote,
      }),
    });
    if (!res.ok) throw new Error('Failed to update field status');
    return res.json();
  },

  // Quotations
  async getQuotations(): Promise<Quotation[]> {
    const res = await fetch(`${API_BASE}/quotations`);
    if (!res.ok) throw new Error('Failed to load quotations');
    return res.json();
  },

  async getQuotation(id: string): Promise<Quotation> {
    const res = await fetch(`${API_BASE}/quotations/${id}`);
    if (!res.ok) throw new Error('Failed to load quotation');
    return res.json();
  },

  async calculateQuotationPreview(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/quotations/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Calculation error');
    }
    return res.json();
  },

  async createQuotation(data: any): Promise<Quotation> {
    const res = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to save quotation');
    }
    return res.json();
  },

  getQuotationPdfUrl(id: string): string {
    return `${API_BASE}/quotations/${id}/pdf`;
  },

  // Negotiation
  async getNegotiationHistory(quotationId: string): Promise<NegotiationMessage[]> {
    const res = await fetch(`${API_BASE}/negotiation/${quotationId}`);
    if (!res.ok) throw new Error('Failed to load negotiation messages');
    return res.json();
  },

  async analyzeNegotiation(quotationId: string, buyerMessage: string, messageLanguage = 'auto'): Promise<NegotiationAnalysisResponse> {
    const res = await fetch(`${API_BASE}/negotiation/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotation_id: quotationId,
        buyer_message: buyerMessage,
        message_language: messageLanguage,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Negotiation analysis failed');
    }
    return res.json();
  },

  async approveReply(messageId: string, replyText: string): Promise<any> {
    const res = await fetch(`${API_BASE}/negotiation/approve/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_reply_text: replyText }),
    });
    if (!res.ok) throw new Error('Failed to approve reply');
    return res.json();
  },

  // PayPal Sandbox
  async createPayPalOrder(quotationId: string): Promise<PayPalOrderResponse> {
    const res = await fetch(`${API_BASE}/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotation_id: quotationId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'PayPal order creation failed');
    }
    return res.json();
  },

  async capturePayPalOrder(orderId: string, quotationId: string): Promise<PayPalCaptureResponse> {
    const res = await fetch(`${API_BASE}/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, quotation_id: quotationId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'PayPal payment capture failed');
    }
    return res.json();
  },

  async getPaymentOrders(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/paypal/history`);
    if (!res.ok) throw new Error('Failed to load payment history');
    return res.json();
  },

  // Export Readiness
  async getExportReadiness(): Promise<ExportReadinessData> {
    const res = await fetch(`${API_BASE}/readiness`);
    if (!res.ok) throw new Error('Failed to load export readiness checklist');
    return res.json();
  },

  // Dashboard & Activity
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/dashboard/activity`);
    if (!res.ok) throw new Error('Failed to load activity log');
    return res.json();
  },
};
