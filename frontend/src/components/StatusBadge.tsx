import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = (s: string) => {
    switch (s.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'paid':
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
      case 'approved_by_seller':
      case 'quoted':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20';
      case 'analyzing':
      case 'negotiating':
      case 'pending':
      case 'pending_review':
      case 'received':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
      case 'declined':
      case 'voided':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
      case 'draft':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20';
    }
  };

  const formatText = (s: string) => {
    return s.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider border ring-1 ring-inset ${getStyle(
        status
      )}`}
    >
      {formatText(status)}
    </span>
  );
};
