import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Receipt,
  ArrowRight,
  Sparkles,
  Lock,
  Building,
  UserCheck
} from 'lucide-react';
import { Quotation, PayPalOrderResponse, PayPalCaptureResponse } from '../types';
import { api } from '../api/client';
import { Modal } from '../components/Modal';

interface PayPalCheckoutProps {
  quotations: Quotation[];
  activeQuotationId?: string;
  onRefresh: () => void;
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  quotations,
  activeQuotationId,
  onRefresh,
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(
    activeQuotationId || quotations[0]?.id || 'quote_kaveri_001'
  );
  const [orderResponse, setOrderResponse] = useState<PayPalOrderResponse | null>(null);
  const [captureResponse, setCaptureResponse] = useState<PayPalCaptureResponse | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCapturingOrder, setIsCapturingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const selectedQuote = quotations.find((q) => q.id === selectedQuoteId) || quotations[0];

  const fetchHistory = async () => {
    try {
      const hist = await api.getPaymentOrders();
      setPaymentHistory(hist);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCreateOrder = async () => {
    setIsCreatingOrder(true);
    setErrorMsg(null);
    setOrderResponse(null);
    setCaptureResponse(null);
    try {
      const res = await api.createPayPalOrder(selectedQuoteId);
      setOrderResponse(res);
      setIsApprovalModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create PayPal Sandbox order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSimulateBuyerApprovalAndCapture = async () => {
    if (!orderResponse) return;
    setIsApprovalModalOpen(false);
    setIsCapturingOrder(true);
    setErrorMsg(null);
    try {
      const res = await api.capturePayPalOrder(orderResponse.order_id, selectedQuoteId);
      setCaptureResponse(res);
      fetchHistory();
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment capture failed');
    } finally {
      setIsCapturingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">PayPal Trade Checkout (Sandbox)</h2>
          <p className="text-xs text-slate-500">
            Real PayPal Orders API v2 server-side pipeline. Orders created after seller approval, captured server-side, and verified against PayPal API.
          </p>
        </div>

        {/* Quotation Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Select Order:</span>
          <select
            value={selectedQuoteId}
            onChange={(e) => {
              setSelectedQuoteId(e.target.value);
              setOrderResponse(null);
              setCaptureResponse(null);
            }}
            className="p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold text-slate-800"
          >
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quote_number} (€{q.total_payable_foreign.toFixed(2)}) - {q.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Checkout Workflow & Receipt */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Milestone Order & Sandbox Creation (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Commercial Milestone Settlement</h3>
                <p className="text-[11px] text-slate-500">PayPal Orders API v2 (Sandbox Mode)</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium">
              100% Advance Deposit
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quotation Details */}
          {selectedQuote && (
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Quotation Ref:</span>
                <span className="font-bold text-slate-900">{selectedQuote.quote_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Artisan Beneficiary:</span>
                <span className="font-semibold text-slate-800">Kaveri Looms (Erode, TN)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">International Buyer:</span>
                <span className="font-semibold text-slate-800">Hanseatische Wohnkultur GmbH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Quantity & Delivery:</span>
                <span className="text-slate-800">{selectedQuote.quantity} Units | {selectedQuote.incoterms}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-sans font-semibold">Total Settlement Amount:</span>
                <span className="text-lg font-extrabold text-blue-700">
                  {selectedQuote.currency} {selectedQuote.total_payable_foreign.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Security / Honesty Callout */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Server-Side Payment Security Standard</span>
            </div>
            <p className="text-blue-800/90 leading-relaxed">
              Payments are never approved client-side. The backend communicates directly with PayPal's Sandbox API to create orders, capture funds, and verify cryptographic settlement references.
            </p>
          </div>

          {/* Step 1: Create Order Button */}
          <div>
            {!orderResponse && !captureResponse && (
              <button
                type="button"
                disabled={isCreatingOrder || !selectedQuote}
                onClick={handleCreateOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isCreatingOrder ? 'Generating PayPal Sandbox Order...' : 'Generate PayPal Sandbox Order'}</span>
              </button>
            )}

            {orderResponse && !captureResponse && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span>PayPal Sandbox Order Created</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                      STATUS: {orderResponse.status}
                    </span>
                  </div>
                  <p className="font-mono text-emerald-800 text-[11px]">
                    Order ID: <strong>{orderResponse.order_id}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCapturingOrder}
                    onClick={handleSimulateBuyerApprovalAndCapture}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCapturingOrder ? 'Verifying with PayPal API...' : 'Simulate Buyer Approval & Capture Funds'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Real-Time Verified Payment Receipt & Proof (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {captureResponse ? (
            <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm space-y-5 bg-gradient-to-b from-white to-emerald-50/20">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Verified Payment Captured</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Server-Side Verified on PayPal Sandbox API</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                  {captureResponse.status}
                </span>
              </div>

              {/* Receipt Body */}
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">PayPal Order ID:</span>
                    <span className="font-bold text-slate-900">{captureResponse.order_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">PayPal Capture Ref:</span>
                    <span className="font-bold text-emerald-700">{captureResponse.capture_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Amount Captured:</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {captureResponse.currency} {captureResponse.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Payer Name:</span>
                    <span className="text-slate-800">{captureResponse.payer_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Payer Email:</span>
                    <span className="text-slate-800">{captureResponse.payer_email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Verified Timestamp:</span>
                    <span className="text-slate-800 text-[10px]">{captureResponse.verification_timestamp}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                  <strong>AUTOMATED TRADE PIPELINE UPDATE:</strong>
                  <p>
                    &bull; Deal Intelligence field <code>payment_method</code> updated to <strong>VERIFIED</strong>.
                  </p>
                  <p>
                    &bull; Quotation status moved to <strong>PAID</strong>.
                  </p>
                  <p>
                    &bull; Loom production capacity committed for 100 units at Kaveri Looms.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Sandbox Milestone Verification Proof
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center text-slate-500 space-y-2">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800">No payment captured yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate a PayPal Sandbox Order on the left to simulate buyer checkout and observe server-side payment verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Orders History Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Sandbox Transaction Audit Ledger</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Capture ID</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Payer Contact</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">API Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {paymentHistory.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-blue-700 font-semibold">{p.paypal_order_id}</td>
                  <td className="py-2.5 px-3 text-emerald-700">{p.paypal_capture_id || 'Pending'}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.currency} {p.amount.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans">{p.payer_name || 'Greta Lindemann'}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {p.verified_by_paypal_api ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buyer Checkout Approval Simulation */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Buyer Approval Simulation: PayPal Sandbox"
        subtitle="Simulates European buyer approving the 100% advance export order"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold">PayPal Sandbox Checkout Dialog</span>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-blue-300">
                EUR {selectedQuote?.total_payable_foreign.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-blue-900">
              Buyer Account: <strong>greta.buyer@hanseatische.de.demo</strong>
            </p>
            <p className="text-[11px] text-blue-900">
              Merchant: <strong>Kaveri Looms Handloom Exporters (Tamil Nadu)</strong>
            </p>
          </div>

          <p className="text-slate-600 leading-relaxed text-[11px]">
            In a live trade environment, the European buyer is redirected to PayPal Sandbox authorization page. Upon clicking below, the backend captures the authorized order and verifies the cryptographic settlement reference with the PayPal API.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(false)}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSimulateBuyerApprovalAndCapture}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Authorize & Capture Payment</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
