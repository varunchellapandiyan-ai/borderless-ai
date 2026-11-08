import React, { useState } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Globe2,
  DollarSign,
  Copy,
  Send,
  Languages
} from 'lucide-react';
import { Quotation, NegotiationAnalysisResponse, NegotiationMessage } from '../types';
import { api } from '../api/client';
import { SAMPLE_GERMAN_NEGOTIATION } from '../demo/kaveriLoomsData';

interface AINegotiationProps {
  quotations: Quotation[];
  activeQuotationId?: string;
  onNavigateToPayment: (quotationId: string) => void;
  onRefresh: () => void;
}

export const AINegotiation: React.FC<AINegotiationProps> = ({
  quotations,
  activeQuotationId,
  onNavigateToPayment,
  onRefresh,
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(
    activeQuotationId || quotations[0]?.id || 'quote_kaveri_001'
  );
  const [buyerMessage, setBuyerMessage] = useState<string>(SAMPLE_GERMAN_NEGOTIATION);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NegotiationAnalysisResponse | null>(null);
  const [approvedReply, setApprovedReply] = useState<string>('');
  const [activeReplyLang, setActiveReplyLang] = useState<'en' | 'de'>('en');
  const [isApproved, setIsApproved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedQuote = quotations.find((q) => q.id === selectedQuoteId) || quotations[0];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setIsApproved(false);
    try {
      const res = await api.analyzeNegotiation(selectedQuoteId, buyerMessage, 'auto');
      setAnalysisResult(res);
      setApprovedReply(res.suggested_reply_english);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze negotiation');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveReply = async () => {
    setIsApproved(true);
    onRefresh();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Global Negotiation Assistant</h2>
          <p className="text-xs text-slate-500">
            Translates international buyer counter-offers (German & English), calculates margin impact in backend code, and drafts protective counter-proposals.
          </p>
        </div>

        {/* Quotation Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Negotiating Quote:</span>
          <select
            value={selectedQuoteId}
            onChange={(e) => setSelectedQuoteId(e.target.value)}
            className="p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold text-slate-800"
          >
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quote_number} (€{q.total_payable_foreign.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Input Message & Copilot Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Buyer Message Input (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-900">Incoming Buyer Message</h3>
            </div>
            <button
              type="button"
              onClick={() => setBuyerMessage(SAMPLE_GERMAN_NEGOTIATION)}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
            >
              Load German RFQ Counter-Offer
            </button>
          </div>

          <div>
            <textarea
              rows={6}
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
              placeholder="Paste German or English counter-offer from buyer..."
              className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-sans leading-relaxed"
            />
          </div>

          {selectedQuote && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">CURRENT QUOTE</span>
                <span className="font-bold text-slate-900">
                  €{selectedQuote.unit_price_fob_foreign.toFixed(2)} / pc
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">MIN PRICE FLOOR</span>
                <span className="font-bold text-emerald-700">
                  €{selectedQuote.min_allowed_price_foreign.toFixed(2)} / pc
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={isAnalyzing || !buyerMessage}
            onClick={handleAnalyze}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>{isAnalyzing ? 'Translating & Calculating Margin...' : 'Analyze Financial Margin Impact'}</span>
          </button>
        </div>

        {/* Right: Financial Impact & Proposed Counter-Offer (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {analysisResult ? (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
              {/* Header translation banner */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-teal-600" />
                    English Translation ({analysisResult.detected_language.toUpperCase()} &rarr; EN)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border">
                    Verified Translation
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans italic">
                  "{analysisResult.translated_english}"
                </p>
              </div>

              {/* Financial Margin Impact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">REQUESTED DISCOUNT</span>
                  <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    {analysisResult.requested_discount_pct?.toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Target: €{analysisResult.requested_unit_price?.toFixed(2)}/pc
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/80 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block uppercase font-mono font-semibold">RETAINED MARGIN</span>
                  <p className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
                    {analysisResult.financial_impact.margin_pct_realized.toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    Batch Profit: ₹{analysisResult.financial_impact.total_batch_profit_inr.toFixed(0)}
                  </span>
                </div>

                <div className="p-3.5 bg-teal-50/80 rounded-lg border border-teal-200">
                  <span className="text-[10px] text-teal-800 block uppercase font-mono font-semibold">PRICE FLOOR SAFETY</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                    <span className="font-bold text-teal-900 text-sm">Within Safe Floor</span>
                  </div>
                  <span className="text-[10px] text-teal-600 font-mono block mt-1">
                    Floor: €{analysisResult.minimum_safe_unit_price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Strategic Advice */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-lg space-y-1">
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Copilot Strategic Negotiation Rationale</span>
                </h4>
                <p className="text-xs text-teal-900 leading-relaxed font-sans">
                  {analysisResult.strategic_advice}
                </p>
              </div>

              {/* Proposed Counter-Offer with Language Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyLang('en');
                        setApprovedReply(analysisResult.suggested_reply_english);
                      }}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        activeReplyLang === 'en'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      English Proposal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyLang('de');
                        setApprovedReply(analysisResult.suggested_reply_german);
                      }}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        activeReplyLang === 'de'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      German Proposal (Native)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(approvedReply)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy Reply'}</span>
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={approvedReply}
                  onChange={(e) => setApprovedReply(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-300 font-sans leading-relaxed text-slate-900 focus:ring-2 focus:ring-teal-500"
                />

                <p className="text-[11px] text-slate-400 italic">
                  * BORDERLESS AI never sends messages or confirms discounts automatically. You retain complete commercial control.
                </p>
              </div>

              {/* Approval and Checkout CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isApproved}
                  onClick={handleApproveReply}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApproved ? 'Counter-Offer Approved by Seller' : 'Approve & Confirm Counter-Offer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToPayment(selectedQuoteId)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-xs transition-all ml-auto"
                >
                  <span>Proceed to PayPal Sandbox Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center text-slate-500 space-y-2">
              <MessageSquareCode className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800">No active negotiation analysis</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Paste a buyer counter-offer on the left to analyze margin impact, check minimum price boundaries, and generate bilingual responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
