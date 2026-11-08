import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Calculator,
  RefreshCw,
  FileText,
  DollarSign
} from 'lucide-react';
import { Quotation, Product, BuyerEnquiry } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

interface QuotationsProps {
  quotations: Quotation[];
  activeEnquiry?: BuyerEnquiry;
  activeProduct?: Product;
  onNavigateToNegotiation: (quotationId: string) => void;
  onRefresh: () => void;
}

export const Quotations: React.FC<QuotationsProps> = ({
  quotations,
  activeEnquiry,
  activeProduct,
  onNavigateToNegotiation,
  onRefresh,
}) => {
  // Calculator inputs
  const [quantity, setQuantity] = useState<number>(activeEnquiry?.requested_quantity || 100);
  const [currency, setCurrency] = useState<string>('EUR');
  const [exchangeRate, setExchangeRate] = useState<number>(91.50);
  const [unitMfgCostInr, setUnitMfgCostInr] = useState<number>(activeProduct?.unit_cost_inr || 280.00);
  const [unitPkgCostInr, setUnitPkgCostInr] = useState<number>(35.00);
  const [domesticLogisticsInr, setDomesticLogisticsInr] = useState<number>(2500.00);
  const [docFeeInr, setDocFeeInr] = useState<number>(1500.00);
  const [marginPct, setMarginPct] = useState<number>(35.0);
  const [intlShippingForeign, setIntlShippingForeign] = useState<number>(0.0);
  const [incoterms, setIncoterms] = useState<string>('FOB Chennai Sea Port (Incoterms 2020)');

  // Calculation output state
  const [calculationPreview, setCalculationPreview] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(quotations[0] || null);

  // Trigger calculation whenever inputs change
  useEffect(() => {
    let isMounted = true;
    const runCalc = async () => {
      setIsCalculating(true);
      setErrorMsg(null);
      try {
        const payload = {
          enquiry_id: activeEnquiry?.id || 'enq_german_01',
          product_id: activeProduct?.id || 'prod_cushion_01',
          quantity,
          currency,
          exchange_rate_to_inr: exchangeRate,
          unit_manufacturing_cost_inr: unitMfgCostInr,
          unit_packaging_cost_inr: unitPkgCostInr,
          domestic_transport_total_inr: domesticLogisticsInr,
          port_and_doc_fee_inr: docFeeInr,
          target_margin_pct: marginPct,
          international_shipping_foreign: intlShippingForeign,
          insurance_foreign: 0.0,
          incoterms,
          payment_terms: '100% advance via PayPal Sandbox Trade Checkout',
          validity_days: 30,
          notes: 'Verified deterministic export price model',
        };
        const result = await api.calculateQuotationPreview(payload);
        if (isMounted) setCalculationPreview(result);
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Quotation calculation error');
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    };

    const timer = setTimeout(runCalc, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    quantity,
    currency,
    exchangeRate,
    unitMfgCostInr,
    unitPkgCostInr,
    domesticLogisticsInr,
    docFeeInr,
    marginPct,
    intlShippingForeign,
    incoterms,
    activeEnquiry,
    activeProduct,
  ]);

  const handleSaveQuotation = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        enquiry_id: activeEnquiry?.id || 'enq_german_01',
        product_id: activeProduct?.id || 'prod_cushion_01',
        quantity,
        currency,
        exchange_rate_to_inr: exchangeRate,
        unit_manufacturing_cost_inr: unitMfgCostInr,
        unit_packaging_cost_inr: unitPkgCostInr,
        domestic_transport_total_inr: domesticLogisticsInr,
        port_and_doc_fee_inr: docFeeInr,
        target_margin_pct: marginPct,
        international_shipping_foreign: intlShippingForeign,
        insurance_foreign: 0.0,
        incoterms,
        payment_terms: '100% advance via PayPal Sandbox Trade Checkout',
        validity_days: 30,
        notes: 'Confirmed and approved by Kaveri Looms export management',
      };
      const created = await api.createQuotation(payload);
      setActiveQuotation(created);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = (quotationId: string) => {
    const url = api.getQuotationPdfUrl(quotationId);
    window.open(url, '_blank');
  };

  const quoteToDisplay = activeQuotation || quotations[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Intelligent Export Quotations</h2>
          <p className="text-xs text-slate-500">
            Deterministic backend pricing engine. Validates minimum margin thresholds and prevents underpriced offers.
          </p>
        </div>

        {quoteToDisplay && (
          <button
            onClick={() => handleDownloadPDF(quoteToDisplay.id)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all shrink-0"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Download Proforma PDF</span>
          </button>
        )}
      </div>

      {/* Main Grid: Calculator Inputs (5 cols) & Live Math Breakdown (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Cost Parameter Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">Deterministic Price Calculator</h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Pure Backend Math
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5 text-xs">
            {/* Quantity & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Order Quantity (pcs)</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Currency & Rate</label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-1/2 p-2 rounded-lg border border-slate-300 text-xs font-semibold"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 91.5)}
                    className="w-1/2 p-2 rounded-lg border border-slate-300 font-mono text-xs text-right"
                    title="INR per foreign currency unit"
                  />
                </div>
              </div>
            </div>

            {/* Artisan Manufacturing Cost */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-600 font-medium">Unit Production Cost (INR)</label>
                <span className="text-[10px] text-teal-700 font-mono font-medium bg-teal-50 px-1.5 rounded">
                  Seller Confirmed
                </span>
              </div>
              <input
                type="number"
                step="5"
                value={unitMfgCostInr}
                onChange={(e) => setUnitMfgCostInr(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Includes loom labor, unbleached cotton slub yarns, natural dye</span>
            </div>

            {/* Packaging */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Export Packaging per Unit (INR)</label>
              <input
                type="number"
                step="5"
                value={unitPkgCostInr}
                onChange={(e) => setUnitPkgCostInr(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-900"
              />
            </div>

            {/* Domestic Logistics & Port CFS Handling */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Erode to Port Freight (INR)</label>
                <input
                  type="number"
                  value={domesticLogisticsInr}
                  onChange={(e) => setDomesticLogisticsInr(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Port & Doc CHA Fee (INR)</label>
                <input
                  type="number"
                  value={docFeeInr}
                  onChange={(e) => setDocFeeInr(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Margin Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-600 font-medium">Producer Target Margin (%)</label>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs">
                  {marginPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="1"
                value={marginPct}
                onChange={(e) => setMarginPct(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>15% (Minimum Floor)</span>
                <span>35% (Standard)</span>
                <span>60% (Premium)</span>
              </div>
            </div>

            {/* Incoterms */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Delivery Incoterms 2020</label>
              <select
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="FOB Chennai Sea Port (Incoterms 2020)">FOB Chennai Sea Port (Buyer covers ocean freight)</option>
                <option value="FOB Chennai Air Cargo (Incoterms 2020)">FOB Chennai Air Cargo (Express dispatch)</option>
                <option value="CIF Hamburg Sea Port (Incoterms 2020)">CIF Hamburg Port (Seller includes ocean freight)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveQuotation}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-all mt-4"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{isSaving ? 'Saving Quotation...' : 'Approve & Save Export Quotation'}</span>
          </button>
        </div>

        {/* Right: Live Itemized Breakdown & Proforma Summary (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {calculationPreview && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">FOB UNIT PRICE</span>
                  <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    {calculationPreview.currency} {calculationPreview.unit_price_fob_foreign.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (₹{calculationPreview.unit_price_fob_inr.toFixed(2)} / unit)
                  </span>
                </div>

                <div className="p-3.5 bg-teal-50/70 rounded-lg border border-teal-200">
                  <span className="text-[10px] text-teal-800 block uppercase font-mono font-semibold">TOTAL PAYABLE VALUE</span>
                  <p className="text-xl font-extrabold text-teal-700 font-mono mt-1">
                    {calculationPreview.currency} {calculationPreview.total_payable_foreign.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-teal-600 font-mono">
                    {calculationPreview.quantity} pieces commercial batch
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block uppercase font-mono font-semibold">SAFE PRICE FLOOR</span>
                  <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
                    {calculationPreview.currency} {calculationPreview.min_allowed_price_foreign.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    15% absolute livelihood floor
                  </span>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Transparent Cost Itemization
                </h4>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Item Component</th>
                        <th className="py-2.5 px-3">Type / Basis</th>
                        <th className="py-2.5 px-3 text-right">INR Value</th>
                        <th className="py-2.5 px-3 text-right">Foreign ({calculationPreview.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {calculationPreview.items.map((itm: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-sans font-medium text-slate-800">
                            {itm.description}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                itm.is_estimate
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {itm.is_estimate ? 'Estimate' : 'Verified'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            ₹{itm.cost_inr.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {calculationPreview.currency} {itm.cost_foreign.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial Terms Summary */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1 text-slate-600">
                <p>
                  <strong>Delivery Incoterms:</strong> {calculationPreview.incoterms}
                </p>
                <p>
                  <strong>Payment Terms:</strong> {calculationPreview.payment_terms}
                </p>
                <p>
                  <strong>Quotation Validity:</strong> 30 Days from issuance
                </p>
              </div>

              {/* Next Steps CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                {quoteToDisplay && (
                  <button
                    onClick={() => handleDownloadPDF(quoteToDisplay.id)}
                    className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Download Generated PDF Proforma</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigateToNegotiation(quoteToDisplay?.id || 'quote_kaveri_001')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-xs transition-all ml-auto"
                >
                  <span>Proceed to Global Negotiation Assistant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
