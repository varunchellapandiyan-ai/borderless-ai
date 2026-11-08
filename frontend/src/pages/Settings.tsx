import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Key,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { SellerProfile, DashboardStats } from '../types';

interface SettingsProps {
  seller?: SellerProfile;
  stats?: DashboardStats;
}

export const Settings: React.FC<SettingsProps> = ({ seller, stats }) => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Settings & Configuration</h2>
        <p className="text-xs text-slate-500">
          Manage your artisan business profile, PayPal Developer Sandbox credentials, and Gemini AI configuration.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration updated successfully!</span>
        </div>
      )}

      {/* Seller Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Artisan Exporter Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Business Name</label>
            <input
              type="text"
              readOnly
              value={seller?.business_name || 'Kaveri Looms'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Craft Sector / Cluster</label>
            <input
              type="text"
              readOnly
              value={seller?.craft_type || 'Handloom & Cotton Home Textiles'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Cluster Location & State</label>
            <input
              type="text"
              readOnly
              value={`${seller?.location || 'Erode'}, ${seller?.state || 'Tamil Nadu'}, India`}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">IEC Identification (Mock)</label>
            <input
              type="text"
              readOnly
              value={seller?.iec_number || '3207019842 (Verified Mock)'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Authorized Dealer (AD) Code</label>
            <input
              type="text"
              readOnly
              value={seller?.ad_code || '0200054 (SBI Erode SME)'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Bank Settlement Account</label>
            <input
              type="text"
              readOnly
              value={`${seller?.bank_name || 'State Bank of India'} (A/C ending ${seller?.account_last4 || '7841'})`}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Integration Credentials Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Key className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Environment Credentials & API Keys</h3>
        </div>

        {/* Gemini */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Google Gemini API (GEMINI_API_KEY)
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                stats?.system_status.gemini_ai.configured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {stats?.system_status.gemini_ai.configured ? 'CONFIGURED (LIVE)' : 'DEMO FALLBACK ACTIVE'}
            </span>
          </div>
          <p className="text-slate-600 text-[11px]">
            To run live Gemini vision & NLP extraction, set <code>GEMINI_API_KEY</code> in your <code>.env</code> file. When absent, BORDERLESS AI runs in deterministic structured demo mode.
          </p>
        </div>

        {/* PayPal */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              PayPal Developer Sandbox (PAYPAL_CLIENT_ID & SECRET)
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                stats?.system_status.paypal_sandbox.configured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {stats?.system_status.paypal_sandbox.configured ? 'LIVE SANDBOX CONNECTED' : 'SANDBOX SIMULATION ACTIVE'}
            </span>
          </div>
          <p className="text-slate-600 text-[11px]">
            To connect your actual PayPal Developer Sandbox account, obtain credentials from{' '}
            <a
              href="https://developer.paypal.com/dashboard/applications/sandbox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold"
            >
              developer.paypal.com
            </a>{' '}
            and add them to <code>backend/.env</code>.
          </p>
        </div>
      </div>

      {/* Production & Deployment Guidance */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-2xs space-y-3 text-xs">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Production Deployment Readiness</span>
        </h4>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          BORDERLESS AI is configured with full CORS middleware, environment-based configuration, SQLite WAL concurrency, and clean separation between client and server credentials.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
          <div className="p-2.5 bg-slate-800 rounded border border-slate-700">
            <span className="text-teal-400 block font-bold mb-0.5">Backend on Render / Railway</span>
            <code className="text-slate-300">uvicorn app.main:app --host 0.0.0.0 --port 8000</code>
          </div>
          <div className="p-2.5 bg-slate-800 rounded border border-slate-700">
            <span className="text-teal-400 block font-bold mb-0.5">Frontend on Vercel / Netlify</span>
            <code className="text-slate-300">npm run build &rarr; dist/</code>
          </div>
        </div>
      </div>
    </div>
  );
};
