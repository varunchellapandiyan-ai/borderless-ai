import React from 'react';
import { AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';

interface DemoBannerProps {
  systemStatus?: {
    gemini_ai?: { mode: string; configured: boolean };
    paypal_sandbox?: { mode: string; configured: boolean };
  };
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ systemStatus }) => {
  return (
    <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-teal-50 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="font-semibold text-amber-900 uppercase tracking-wider text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded">
          DEMO BUSINESS
        </span>
        <span>
          <strong>Kaveri Looms</strong> (Erode Handloom Cluster, Tamil Nadu) &times; <strong>Hanseatische Wohnkultur GmbH</strong> (Hamburg, Germany).
        </span>
        <span className="text-amber-800/80 hidden md:inline">
          All sample costs and customer identities are clearly labeled demonstration records.
        </span>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px]">
        <div className="flex items-center gap-1.5 bg-white/80 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-slate-600">AI Intelligence:</span>
          <span className="font-semibold text-slate-900">
            {systemStatus?.gemini_ai?.mode === 'LIVE_API' ? 'Gemini 2.5 Live' : 'Structured Demo Parser'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/80 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-slate-600">Payments:</span>
          <span className="font-semibold text-slate-900">
            {systemStatus?.paypal_sandbox?.mode === 'LIVE_SANDBOX_API' ? 'PayPal Sandbox Live' : 'Verified Sandbox Simulation'}
          </span>
        </div>
      </div>
    </div>
  );
};
