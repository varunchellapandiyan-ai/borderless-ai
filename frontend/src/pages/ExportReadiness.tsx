import React from 'react';
import {
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
  Scale
} from 'lucide-react';
import { ExportReadinessData } from '../types';

interface ExportReadinessProps {
  readinessData?: ExportReadinessData;
}

export const ExportReadiness: React.FC<ExportReadinessProps> = ({ readinessData }) => {
  if (!readinessData) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">Loading readiness checklist...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-trade-950 text-white rounded-xl p-6 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700/60 text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5 text-teal-400" />
              <span>Indian Export Statutory & Compliance Guide</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Export Readiness & Statutory Checklist
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Track statutory export requirements for Indian handloom & handicraft businesses (DGFT, ICEGATE, CBIC, and European destination standards).
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center gap-4 shrink-0">
            <div className="text-center">
              <span className="text-3xl font-extrabold text-teal-400 font-mono">
                {readinessData.overall_readiness_pct}%
              </span>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Readiness Score
              </span>
            </div>
            <div className="text-xs text-slate-300 border-l border-slate-700 pl-4 space-y-0.5">
              <div><strong className="text-emerald-400">{readinessData.verified_count}</strong> Verified</div>
              <div><strong className="text-amber-400">{readinessData.pending_count}</strong> Pending Review</div>
              <div><strong className="text-slate-400">{readinessData.total_items}</strong> Total Parameters</div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            {readinessData.disclaimer}
          </p>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {readinessData.items.map((item) => (
          <div
            key={item.code}
            className={`p-5 rounded-xl border bg-white shadow-2xs space-y-3 transition-all ${
              item.status === 'verified'
                ? 'border-emerald-200 hover:border-emerald-300'
                : 'border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  {item.category} &bull; {item.code}
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{item.title}</h4>
              </div>

              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                  item.status === 'verified'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {item.status.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1">
              <div className="text-slate-500 font-medium">
                <strong>Why it matters:</strong> {item.importance}
              </div>
              <div className="text-slate-400 font-mono text-[10px]">
                Source: {item.source_reference}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Official Portal Reference</span>
              <a
                href={item.official_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
              >
                <span>Visit Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
