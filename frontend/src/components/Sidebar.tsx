import React from 'react';
import {
  LayoutDashboard,
  Package,
  Inbox,
  ShieldCheck,
  FileSpreadsheet,
  MessageSquareCode,
  CreditCard,
  FileCheck2,
  Settings as SettingsIcon,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  dealCompleteness?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  dealCompleteness = 72,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'products',
      label: 'Product Passports',
      icon: Package,
      badge: 'Smart AI',
    },
    {
      id: 'enquiries',
      label: 'Buyer Enquiries',
      icon: Inbox,
      badge: 'RFQ Parse',
    },
    {
      id: 'deal',
      label: 'Deal Intelligence',
      icon: ShieldCheck,
      badge: 'Core Diff',
      highlight: true,
    },
    {
      id: 'quotations',
      label: 'Quotations',
      icon: FileSpreadsheet,
      badge: 'PDF',
    },
    {
      id: 'negotiation',
      label: 'AI Negotiation',
      icon: MessageSquareCode,
      badge: 'DE / EN',
    },
    {
      id: 'payments',
      label: 'PayPal Checkout',
      icon: CreditCard,
      badge: 'Orders v2',
    },
    {
      id: 'readiness',
      label: 'Export Readiness',
      icon: FileCheck2,
      badge: 'DGFT',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 selection:bg-teal-700 selection:text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              BORDERLESS <span className="text-teal-400 font-mono text-xs font-semibold px-1 py-0.5 rounded bg-teal-950/80 border border-teal-800/80">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400">Export Copilot for Artisans</p>
          </div>
        </div>
      </div>

      {/* Exporter Micro-card */}
      <div className="mx-3 my-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-400">Exporting Enterprise</span>
          <span className="text-[10px] text-slate-500 font-mono">TN-IND</span>
        </div>
        <p className="font-semibold text-white truncate">Kaveri Looms</p>
        <p className="text-[11px] text-slate-400 truncate">Erode Handloom Cluster, TN</p>
        
        {/* Deal Completeness Indicator */}
        <div className="mt-2.5 pt-2 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Deal Completeness</span>
            <span className="font-mono font-bold text-teal-400">{dealCompleteness}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${dealCompleteness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
          Trade Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/30'
                  : item.highlight
                  ? 'text-teal-300 hover:bg-slate-800 hover:text-white bg-slate-800/40 border border-teal-900/40'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : item.highlight ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-teal-700/80 text-teal-100'
                      : item.highlight
                      ? 'bg-teal-950 text-teal-300 border border-teal-800'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>v1.0.0 Production Ready</span>
          <a
            href="https://dgft.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-teal-400 hover:underline text-[10px]"
          >
            DGFT Portal <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
