import React from 'react';
import { Calendar, TrendingUp, Edit, Trash2 } from 'lucide-react';
import OpportunityActivityFeed from './OpportunityActivityFeed';
import OpportunityTasks from './OpportunityTasks';

const PRIORITY_LABELS = {
  low: { label: 'Baja', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  medium: { label: 'Media', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'Alta', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function OpportunityDetail({ opportunity, onEdit, onDelete }) {
  const priorityInfo = PRIORITY_LABELS[opportunity.priority] || PRIORITY_LABELS.medium;
  const stageColor = opportunity.stage?.color || '#6B7280';

  const formattedCloseDate = opportunity.expected_close_date
    ? new Date(opportunity.expected_close_date).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const formattedCreateDate = opportunity.created_at
    ? new Date(opportunity.created_at).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-5 text-xs">
      {/* Title & Source Badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-base text-text leading-snug">{opportunity.title}</h4>
          <div className="flex items-center gap-2">
            {opportunity.source === "whatsapp_bot" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold uppercase tracking-wider text-[9px]">
                🤖 Creado por Armando
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 font-bold uppercase tracking-wider text-[9px]">
                👤 Creado manualmente
              </span>
            )}
            {formattedCreateDate && (
              <span className="text-[10px] text-textMuted font-medium">
                Creada el {formattedCreateDate}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-textMuted hover:text-primary hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
            title="Editar oportunidad"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="font-bold uppercase text-[9px] tracking-wider">Editar</span>
          </button>
          <button
            onClick={() => onDelete(opportunity.id)}
            className="p-1.5 text-textMuted hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
            title="Eliminar oportunidad"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="font-bold uppercase text-[9px] tracking-wider">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Grid of Attributes */}
      <div className="grid grid-cols-2 gap-4 bg-background/50 p-3.5 border border-border rounded-lg">
        <div>
          <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-0.5">
            Pipeline / Etapa
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-text bg-white px-1.5 py-0.5 border border-border rounded">
              {opportunity.pipeline?.name || 'Venta'}
            </span>
            <span
              className="font-bold px-1.5 py-0.5 rounded border flex items-center gap-1"
              style={{
                borderColor: `${stageColor}30`,
                backgroundColor: `${stageColor}15`,
                color: stageColor,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: stageColor }}
              />
              {opportunity.stage?.name}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-0.5">
            Valor Estimado
          </span>
          <span className="font-bold text-text flex items-center gap-1 text-sm text-primary">
            <TrendingUp className="w-3.5 h-3.5" />
            {opportunity.expected_value
              ? new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: opportunity.currency || 'MXN',
                }).format(opportunity.expected_value)
              : 'Sin cotizar'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-0.5">
            Interés Comercial
          </span>
          <span className="font-semibold text-text">
            {opportunity.product_service
              ? `${opportunity.product_service.name} ${opportunity.product_service.sku ? `(${opportunity.product_service.sku})` : ''}`
              : opportunity.product_interest}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-0.5">
            Prioridad
          </span>
          <span
            className={`font-bold px-2 py-0.5 rounded border uppercase tracking-wider inline-block ${priorityInfo.color}`}
          >
            {priorityInfo.label}
          </span>
        </div>

        {formattedCloseDate && (
          <div className="col-span-2">
            <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-0.5">
              Fecha Estimada de Cierre
            </span>
            <span className="font-semibold text-text flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-textMuted" />
              {formattedCloseDate}
            </span>
          </div>
        )}
      </div>

      {/* Actividades */}
      <div className="border-t border-border pt-4 mt-4 space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-textMuted">
          Historial de Actividad
        </h4>
        <OpportunityActivityFeed opportunityId={opportunity.id} />
      </div>

      {/* Seguimientos */}
      <OpportunityTasks opportunityId={opportunity.id} contactId={opportunity.contact_id} />
    </div>
  );
}
