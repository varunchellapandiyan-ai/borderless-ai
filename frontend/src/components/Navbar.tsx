import React from 'react';
import {
  Globe,
  Bell,
  PlayCircle,
  ShieldCheck,
  Building2,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { SellerProfile } from '../types';

interface NavbarProps {
  seller?: SellerProfile;
  onStartDemoFlow: () => void;
  activeEnquiryTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  seller,
  onStartDemoFlow,
  activeEnquiryTitle = "Greta Lindemann (Hamburg, DE) - 100 pcs",
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
      {/* Left: Active Trade Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500">Exporter:</span>
          <span className="font-semibold text-slate-900">{seller?.business_name || 'Kaveri Looms'}</span>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded font-mono">Erode, TN</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200/80 rounded-lg text-xs">
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-teal-700 font-medium">Active Pipeline Deal:</span>
          <span className="font-semibold text-teal-950 font-mono">{activeEnquiryTitle}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* 3-Minute Hackathon Demo Preset Launcher */}
        <button
          onClick={onStartDemoFlow}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          title="Jump directly to the 3-minute hackathon presentation workflow"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Demo Workflow (3-Min)</span>
        </button>

        {/* PayPal Sandbox Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sandbox Rails</span>
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-teal-300 flex items-center justify-center font-bold text-xs ring-2 ring-teal-500/20">
            RK
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight">Ramesh Kumar</p>
            <p className="text-[10px] text-slate-500">First-Time Exporter</p>
          </div>
        </div>
      </div>
    </header>
  );
};
