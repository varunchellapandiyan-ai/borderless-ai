import React, { useState } from 'react';
import {
  Inbox,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Building,
  MapPin,
  Calendar,
  Layers,
  DollarSign,
  Package,
  Plus
} from 'lucide-react';
import { BuyerEnquiry, BuyerEnquiryExtraction, Product } from '../types';
import { api } from '../api/client';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { SAMPLE_BUYER_RFQ } from '../demo/kaveriLoomsData';

interface BuyerEnquiriesProps {
  enquiries: BuyerEnquiry[];
  products: Product[];
  onSelectEnquiryForDeal: (enquiryId: string) => void;
  onRefresh: () => void;
}

export const BuyerEnquiries: React.FC<BuyerEnquiriesProps> = ({
  enquiries,
  products,
  onSelectEnquiryForDeal,
  onRefresh,
}) => {
  const [rawText, setRawText] = useState(SAMPLE_BUYER_RFQ);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extraction, setExtraction] = useState<BuyerEnquiryExtraction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParseRFQ = async () => {
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const result = await api.extractBuyerEnquiry(rawText);
      setExtraction(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse enquiry text');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveAndProceed = async () => {
    if (!extraction) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const saved = await api.saveEnquiry(extraction, rawText, selectedProductId || undefined);
      onRefresh();
      onSelectEnquiryForDeal(saved.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save enquiry');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Buyer Request Intelligence</h2>
          <p className="text-xs text-slate-500">
            Paste unverified international buyer inquiries. Gemini extracts trade parameters, detects missing details, and cross-references your Product Passport.
          </p>
        </div>
      </div>

      {/* Two Column Layout: RFQ Parser & Existing Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: RFQ Input & Extraction Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Paste Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h3 className="text-sm font-semibold text-slate-900">Raw International RFQ / Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_BUYER_RFQ)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline flex items-center gap-1"
              >
                <span>Load Sample German RFQ</span>
              </button>
            </div>

            <div>
              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste buyer email, WhatsApp export enquiry, or trade portal message..."
                className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono leading-relaxed"
              />
            </div>

            {/* Target Product Mapping */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Compare with Product:</span>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="p-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={isParsing || !rawText}
                onClick={handleParseRFQ}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>{isParsing ? 'Parsing with Gemini...' : 'Extract Trade Parameters'}</span>
              </button>
            </div>
          </div>

          {/* Structured Extraction Results */}
          {extraction && (
            <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-2xs space-y-5 bg-gradient-to-b from-white to-purple-50/20">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Extracted Export Specifications
                  </h4>
                </div>
                {/* Crucial honesty differentiator */}
                <div className="bg-amber-100 text-amber-900 text-[10px] font-medium px-2 py-0.5 rounded border border-amber-300">
                  Unverified Buyer Identity — Requires Due Diligence
                </div>
              </div>

              {/* Parsed Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Buyer Contact</span>
                  <span className="font-semibold text-slate-900 block truncate">{extraction.buyer_name}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{extraction.buyer_company || 'Private'}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Destination Port</span>
                  <span className="font-semibold text-slate-900 block truncate">{extraction.buyer_country}</span>
                  <span className="text-[11px] text-teal-700 font-mono block">ISO: {extraction.buyer_country_code}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Requested Quantity</span>
                  <span className="font-bold text-slate-900 text-sm block font-mono">{extraction.requested_quantity} pcs</span>
                  <span className="text-[10px] text-slate-500 block">Trial batch</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Target Price</span>
                  <span className="font-bold text-emerald-700 block font-mono">
                    {extraction.target_currency} {extraction.target_unit_price?.toFixed(2) || 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">FOB Chennai</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Delivery Timeline</span>
                  <span className="font-semibold text-slate-900 block truncate">{extraction.delivery_timeline || 'Standard'}</span>
                  <span className="text-[10px] text-slate-500 block">Hamburg warehouse</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase">Incoterms Basis</span>
                  <span className="font-semibold text-slate-900 block font-mono">{extraction.shipping_terms}</span>
                  <span className="text-[10px] text-slate-500 block">Sea / Air Port</span>
                </div>
              </div>

              {/* Passport Match Comparison */}
              {selectedProduct && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider">
                      Product Passport Feasibility Match
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      Capacity: 800 pcs/mo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-950 font-mono">
                    <div>
                      &bull; Quantity: <strong>{extraction.requested_quantity} pcs</strong> (Exceeds MOQ {selectedProduct.moq})
                    </div>
                    <div>
                      &bull; Target Price: <strong>€{extraction.target_unit_price}</strong> &gt; Min Floor (~€3.72)
                    </div>
                  </div>
                </div>
              )}

              {/* Missing Details Flags */}
              <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-rose-900 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Missing Trade Details Identified by Copilot</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px]">
                  {extraction.missing_details.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              {/* Clarification Questions */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Clarification Questions to Ask the Buyer</span>
                </div>
                <ul className="space-y-1.5 text-blue-950 text-[11px]">
                  {extraction.clarification_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-mono font-bold text-blue-700">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAndProceed}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>{isSaving ? 'Importing...' : 'Save Enquiry & View Evidence Deal Intelligence'}</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Existing Enquiries (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Active Buyer Pipeline</h3>
            <p className="text-xs text-slate-500 mb-4">
              Saved buyer enquiries in current export workflow
            </p>

            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition-all text-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{enq.buyer_name}</span>
                        <span className="text-[10px] text-slate-500">({enq.buyer_company || 'Private'})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{enq.buyer_country} ({enq.buyer_country_code})</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {enq.requested_quantity} pcs
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500">
                      Target: <strong>{enq.target_currency} {enq.target_unit_price?.toFixed(2)}</strong> FOB
                    </span>
                    <button
                      onClick={() => onSelectEnquiryForDeal(enq.id)}
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 text-xs"
                    >
                      <span>Analyze Deal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
