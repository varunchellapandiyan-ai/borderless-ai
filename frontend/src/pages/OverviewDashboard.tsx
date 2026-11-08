import React from 'react';
import {
  Package,
  Inbox,
  FileSpreadsheet,
  CreditCard,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DashboardStats, ActivityLog } from '../types';

interface OverviewDashboardProps {
  stats?: DashboardStats;
  activityLogs: ActivityLog[];
  onNavigate: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  activityLogs,
  onNavigate,
}) => {
  const metrics = stats?.metrics;

  const pipelineStages = [
    { id: 'products', name: 'Product Passport', count: `${metrics?.products_count || 1} SKU`, status: 'Ready' },
    { id: 'enquiries', name: 'Buyer RFQ', count: '100 pcs (€5.40 target)', status: 'Analyzed' },
    { id: 'deal', name: 'Deal Evidence', count: `${metrics?.deal_evidence_health_pct || 72}% Verified`, status: 'Evidence-Backed', highlight: true },
    { id: 'quotations', name: 'Export Quotation', count: `€${metrics?.total_quoted_eur || 524.00} FOB`, status: 'Approved' },
    { id: 'negotiation', name: 'German Negotiation', count: '€4.85 Counter-Offer', status: 'Safe Floor' },
    { id: 'payments', name: 'PayPal Checkout', count: `€${metrics?.total_captured_eur || 524.00} Settled`, status: 'Captured' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Value Prop Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-trade-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700/60 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI-Powered Export Copilot for Indian Artisans</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Turn Indian Handcrafts into Evidence-Backed Global Export Deals
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Empowering <strong>Kaveri Looms</strong> (Erode, Tamil Nadu) to analyze international buyer enquiries, enforce deterministic pricing boundaries, verify evidence sources, and receive instant <strong>PayPal Sandbox</strong> milestone deposits.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('deal')}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Inspect Evidence Intelligence</span>
            </button>
            <button
              onClick={() => onNavigate('quotations')}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>View Deterministic Quotation</span>
            </button>
            <button
              onClick={() => onNavigate('payments')}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>PayPal Sandbox Rails</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Passports</span>
            <Package className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics?.products_count || 1}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active Smart Catalog</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('enquiries')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Enquiries</span>
            <Inbox className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics?.enquiries_count || 1}</p>
          <p className="text-[11px] text-slate-500 mt-1">German Buyer RFQ</p>
        </div>

        {/* Metric 3: Quoted Value */}
        <div
          onClick={() => onNavigate('quotations')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Quoted Value</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">€{metrics?.total_quoted_eur?.toFixed(0) || 524}</p>
          <p className="text-[11px] text-slate-500 mt-1">{metrics?.quotations_count || 1} Proforma Quoted</p>
        </div>

        {/* Metric 4: PayPal Captured */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs bg-gradient-to-b from-white to-emerald-50/30 hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-800">Captured Rev</span>
            <CreditCard className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">€{metrics?.total_captured_eur?.toFixed(0) || 524}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">PayPal Verified</p>
        </div>

        {/* Metric 5: Evidence Health */}
        <div
          onClick={() => onNavigate('deal')}
          className="bg-white p-4 rounded-xl border border-teal-200/80 shadow-2xs bg-gradient-to-b from-white to-teal-50/30 hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-teal-800">Evidence Health</span>
            <ShieldCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-teal-700">{metrics?.deal_evidence_health_pct || 72}%</p>
          <p className="text-[11px] text-teal-600 font-medium mt-1">Verified Parameter Ratio</p>
        </div>

        {/* Metric 6: Export Readiness */}
        <div
          onClick={() => onNavigate('readiness')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Statutory</span>
            <FileCheck2 className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics?.export_readiness_pct || 71}%</p>
          <p className="text-[11px] text-slate-500 mt-1">IEC & GSTIN Ready</p>
        </div>
      </div>

      {/* Export Deal Lifecycle Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Active Export Deal Lifecycle</h3>
            <p className="text-xs text-slate-500">
              End-to-end milestone progression for Hanseatische Wohnkultur GmbH (Trial Batch 100 pcs)
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Pipeline Health: Optimal
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.id}
              onClick={() => onNavigate(stage.id)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                stage.highlight
                  ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/10'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
                <span>0{idx + 1}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <p className="font-semibold text-xs text-slate-900 truncate">{stage.name}</p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">{stage.count}</p>
              <div className="mt-2 text-[10px] font-medium text-teal-700 bg-white px-1.5 py-0.5 rounded border border-slate-200/60 inline-block">
                {stage.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Activity Timeline & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Audit Trail & Activity Log</h3>
              <p className="text-xs text-slate-500">Immutable chronological trade event trail</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 text-xs">{log.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System & API Environment Status */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">System Integration Status</h3>
          
          <div className="space-y-3 text-xs">
            {/* Gemini */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Google Gemini AI
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  {stats?.system_status.gemini_ai.mode || 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Model: <code className="font-mono text-slate-700">{stats?.system_status.gemini_ai.model || 'gemini-2.5-flash'}</code>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Role: Zero-hallucination structured JSON extraction & bilingual negotiation analysis.
              </p>
            </div>

            {/* PayPal Sandbox */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  PayPal Orders API v2
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {stats?.system_status.paypal_sandbox.mode || 'Sandbox'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Endpoint: <code className="font-mono text-slate-700">api-m.sandbox.paypal.com</code>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Role: Server-side token creation, order generation, capture, and verification.
              </p>
            </div>

            {/* Evidence Engine */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Evidence Integrity Engine
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Enforced
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Rule: All costs & certifications tagged by source. Deterministic calculation enforced.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('settings')}
              className="w-full text-center text-xs text-slate-600 hover:text-slate-900 font-medium py-1.5 hover:bg-slate-50 rounded transition-colors"
            >
              Configure Credentials & API Keys &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
