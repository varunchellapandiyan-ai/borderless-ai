import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Filter,
  Check,
  FileCheck2,
  Info
} from 'lucide-react';
import { DealIntelligenceSummary, DealField } from '../types';
import { api } from '../api/client';
import { EvidenceBadge } from '../components/EvidenceBadge';

interface DealIntelligenceProps {
  dealSummary?: DealIntelligenceSummary;
  onNavigateToQuotation: () => void;
  onRefresh: () => void;
}

export const DealIntelligence: React.FC<DealIntelligenceProps> = ({
  dealSummary,
  onNavigateToQuotation,
  onRefresh,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [updatingFieldId, setUpdatingFieldId] = useState<string | null>(null);

  if (!dealSummary) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">No active deal selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an enquiry to review evidence-backed deal intelligence.</p>
      </div>
    );
  }

  const handleVerifyField = async (field: DealField) => {
    setUpdatingFieldId(field.id);
    try {
      await api.updateDealField(
        field.id,
        'verified',
        'Verified and confirmed by Kaveri Looms export manager'
      );
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingFieldId(null);
    }
  };

  const fields = dealSummary.fields.filter((f) => {
    if (categoryFilter === 'all') return true;
    return f.field_category === categoryFilter;
  });

  const categories = [
    { id: 'all', label: 'All Parameters' },
    { id: 'product', label: 'Product & SKU' },
    { id: 'cost', label: 'Artisan Cost Base' },
    { id: 'buyer', label: 'Buyer & Country' },
    { id: 'shipping', label: 'Incoterms & Freight' },
    { id: 'compliance', label: 'Tariff & Origin' },
    { id: 'payment', label: 'PayPal Settlement' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Core Differentiator Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-trade-950 text-white rounded-xl p-6 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700/60 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Core Differentiator: Evidence-Backed Deal Intelligence</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Transparent Field-by-Field Evidence Ledger
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Every critical deal parameter is tied to a verified source. BORDERLESS AI never invents costs, shipping rates, or legal requirements.
            </p>
          </div>

          {/* Completeness Gauge */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center gap-4 shrink-0">
            <div className="text-center">
              <span className="text-3xl font-extrabold text-teal-400 font-mono">
                {dealSummary.completeness_percentage}%
              </span>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Completeness Index
              </span>
            </div>
            <div className="text-xs text-slate-300 border-l border-slate-700 pl-4 space-y-0.5">
              <div><strong className="text-white">{dealSummary.verified_fields}</strong> Verified</div>
              <div><strong className="text-amber-400">{dealSummary.pending_fields}</strong> Pending</div>
              <div><strong className="text-rose-400">{dealSummary.missing_fields}</strong> Missing / Incomplete</div>
            </div>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>INFORMATION COMPLETENESS INDICATOR:</strong> This score reflects data completeness across commercial, logistics, and documentation inputs. It is an operational decision support index and does <strong>not</strong> substitute for legal export clearance or chartered customs advice.
          </p>
        </div>
      </div>

      {/* Recommended Actions */}
      {dealSummary.recommended_actions.length > 0 && (
        <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Copilot Recommended Seller Actions</span>
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-teal-900">
            {dealSummary.recommended_actions.map((act, i) => (
              <li key={i} className="flex items-start gap-2 bg-white/70 p-2 rounded border border-teal-100">
                <span className="font-mono font-bold text-teal-700 shrink-0">{i + 1}.</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Deal Parameter</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Evidence Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Why It Matters for Exporters</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Parameter & Category */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block">{field.field_label}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{field.field_category}</span>
                  </td>

                  {/* Value */}
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800 max-w-xs">
                    <span className="truncate block">{field.field_value || 'Missing Value'}</span>
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4">
                    <EvidenceBadge source={field.source} verificationStatus={field.verification_status} showSourceOnly />
                  </td>

                  {/* Verification Status */}
                  <td className="py-3.5 px-4">
                    <EvidenceBadge source={field.source} verificationStatus={field.verification_status} showStatusOnly />
                  </td>

                  {/* Why it Matters */}
                  <td className="py-3.5 px-4 text-slate-600 max-w-sm text-[11px] leading-relaxed">
                    <p>{field.why_it_matters}</p>
                    {field.evidence_note && (
                      <span className="text-[10px] text-slate-400 italic block mt-0.5">
                        Note: {field.evidence_note}
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    {field.verification_status !== 'verified' ? (
                      <button
                        onClick={() => handleVerifyField(field)}
                        disabled={updatingFieldId === field.id}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium px-2.5 py-1 rounded text-[11px] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{updatingFieldId === field.id ? 'Verifying...' : 'Verify'}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Confirmed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Next Step */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Parameters confirmed will feed directly into the <strong>deterministic export quotation engine</strong>.
          </div>
          <button
            onClick={onNavigateToQuotation}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-all"
          >
            <span>Proceed to Export Quotation Calculation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
