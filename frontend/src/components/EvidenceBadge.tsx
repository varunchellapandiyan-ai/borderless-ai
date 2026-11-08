import React from 'react';
import { SourceType, VerificationStatus } from '../types';
import {
  UserCheck,
  MessageSquareQuote,
  CheckCircle2,
  Sparkles,
  AlertOctagon,
  Clock,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface EvidenceBadgeProps {
  source: SourceType;
  verificationStatus: VerificationStatus;
  showStatusOnly?: boolean;
  showSourceOnly?: boolean;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  source,
  verificationStatus,
  showStatusOnly = false,
  showSourceOnly = false,
}) => {
  const getSourceConfig = (src: SourceType) => {
    switch (src) {
      case 'seller-provided':
        return {
          label: 'Seller Confirmed',
          icon: UserCheck,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          desc: 'Verified directly from Kaveri Looms manufacturing ledgers',
        };
      case 'buyer-requested':
        return {
          label: 'Buyer Specified',
          icon: MessageSquareQuote,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          desc: 'Explicit parameter parsed from international buyer RFQ',
        };
      case 'externally-verified':
        return {
          label: 'Official DGFT / Tariff',
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          desc: 'Cross-referenced against Indian DGFT and EU TARIC schedules',
        };
      case 'ai-suggested':
        return {
          label: 'AI Suggested (Unconfirmed)',
          icon: Sparkles,
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          desc: 'Hypothesis extracted by Gemini AI — requires explicit seller approval',
        };
      case 'missing-unverified':
      default:
        return {
          label: 'Missing / Unverified',
          icon: AlertOctagon,
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          desc: 'Critical parameter omitted — potential export compliance risk',
        };
    }
  };

  const getStatusConfig = (st: VerificationStatus) => {
    switch (st) {
      case 'verified':
        return {
          label: 'Verified',
          icon: CheckCircle2,
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'pending_confirmation':
        return {
          label: 'Pending Confirmation',
          icon: Clock,
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'discrepancy':
        return {
          label: 'Discrepancy Flag',
          icon: AlertTriangle,
          bg: 'bg-red-100 text-red-800 border-red-300',
        };
      case 'unverified':
      default:
        return {
          label: 'Unverified',
          icon: HelpCircle,
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
        };
    }
  };

  const srcConfig = getSourceConfig(source);
  const stConfig = getStatusConfig(verificationStatus);

  const SrcIcon = srcConfig.icon;
  const StIcon = stConfig.icon;

  if (showSourceOnly) {
    return (
      <span
        title={srcConfig.desc}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${srcConfig.bg}`}
      >
        <SrcIcon className="w-3 h-3 shrink-0" />
        <span>{srcConfig.label}</span>
      </span>
    );
  }

  if (showStatusOnly) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${stConfig.bg}`}
      >
        <StIcon className="w-3 h-3 shrink-0" />
        <span>{stConfig.label}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        title={srcConfig.desc}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${srcConfig.bg}`}
      >
        <SrcIcon className="w-3 h-3 shrink-0" />
        <span>{srcConfig.label}</span>
      </span>

      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${stConfig.bg}`}
      >
        <StIcon className="w-2.5 h-2.5 shrink-0" />
        <span>{stConfig.label}</span>
      </span>
    </div>
  );
};
