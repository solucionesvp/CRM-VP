import React from 'react';
import { Calendar, TrendingUp, User, Tag } from 'lucide-react';

const PRIORITY_LABELS = {
  low: { label: 'Baja', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  medium: { label: 'Media', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'Alta', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function KanbanCard({ opportunity, contactName, onDragStart }) {
  const priorityInfo = PRIORITY_LABELS[opportunity.priority] || PRIORITY_LABELS.medium;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', opportunity.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(opportunity.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white border border-border rounded-lg p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-150 relative overflow-hidden select-none"
    >
      {/* Priority Indicator Dot on Top Right */}
      <div className="absolute top-2 right-2.5">
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.color}`}
        >
          {priorityInfo.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-bold text-xs text-text pr-10 mb-1.5 leading-snug break-words">
        {opportunity.title}
      </h4>

      {/* Product & Value Row */}
      <div className="space-y-1.5 mb-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-textMuted font-medium">
          <Tag className="w-3.5 h-3.5 shrink-0 text-textMuted/70" />
          <span className="truncate">{opportunity.product_interest}</span>
        </div>

        {opportunity.expected_value && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: opportunity.currency || 'MXN',
              }).format(opportunity.expected_value)}
            </span>
          </div>
        )}
      </div>

      {/* Footer Info: Contact & Date */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-[10px] text-textMuted">
        <div className="flex items-center gap-1 font-semibold truncate max-w-[65%]">
          <User className="w-3 h-3 text-textMuted/60 shrink-0" />
          <span className="truncate">{contactName || 'Sin contacto'}</span>
        </div>
        <div className="flex items-center gap-0.5 font-medium shrink-0">
          <Calendar className="w-3 h-3 text-textMuted/60" />
          <span>
            {new Date(opportunity.updated_at).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
