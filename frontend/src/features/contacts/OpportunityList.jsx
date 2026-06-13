import React from 'react';
import { Plus, Trash2, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

const PRIORITY_LABELS = {
  low: { label: 'Baja', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  medium: { label: 'Media', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'Alta', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function OpportunityList({
  opportunities,
  loading,
  error,
  onAddClick,
  onDeleteClick,
  onStageChangeClick,
  isCompact = false,
}) {
  if (loading) {
    return (
      <div className="py-8 text-center space-y-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-textMuted font-medium">Cargando oportunidades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
        <p className="text-xs text-red-600 font-semibold mb-2">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header and Add Button */}
      {!isCompact && (
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted">
            Oportunidades Comerciales
          </h3>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Oportunidad
          </button>
        </div>
      )}

      {/* Empty State */}
      {(!opportunities || opportunities.length === 0) ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center bg-background/50">
          <p className="text-xs font-bold text-text mb-1">Sin oportunidades activas</p>
          <p className="text-[11px] text-textMuted max-w-xs mx-auto mb-3">
            Este cliente no tiene ningún proceso de cotización o venta asignado actualmente.
          </p>
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:bg-gray-50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-primary" /> Crear Oportunidad
          </button>
        </div>
      ) : (
        /* Opportunity Cards */
        <div className="space-y-2.5">
          {opportunities.map((opp) => {
            const priorityInfo = PRIORITY_LABELS[opp.priority] || PRIORITY_LABELS.medium;
            const stageColor = opp.stage?.color || '#6B7280';

            if (isCompact) {
              return (
                <div
                  key={opp.id}
                  className="bg-white border border-border rounded-lg p-2.5 shadow-sm hover:shadow transition-shadow relative overflow-hidden text-xs"
                >
                  {/* Colored top-line representing stage */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{ backgroundColor: stageColor }}
                  />

                  <div className="flex justify-between items-start gap-2 pt-1">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-text leading-tight truncate" title={opp.title}>
                        {opp.title}
                      </h4>
                      <p className="text-[10px] text-textMuted font-medium truncate mt-0.5" title={opp.product_service ? `${opp.product_service.name}` : opp.product_interest}>
                        Interés: {opp.product_service ? opp.product_service.name : opp.product_interest}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-primary flex items-center justify-end gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        {opp.expected_value
                          ? new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: opp.currency || 'MXN',
                              maximumFractionDigits: 0
                            }).format(opp.expected_value)
                          : 'Sin cotizar'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-[9px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-textMuted bg-gray-50 px-1 py-0.5 border border-border/50 rounded">
                        {opp.pipeline?.name || 'Venta'}
                      </span>
                      <button
                        onClick={() => onStageChangeClick(opp)}
                        className="font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-colors hover:bg-gray-50"
                        style={{
                          borderColor: `${stageColor}30`,
                          backgroundColor: `${stageColor}15`,
                          color: stageColor,
                        }}
                        title="Cambiar etapa"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: stageColor }}
                        />
                        {opp.stage?.name}
                      </button>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.color}`}
                      >
                        {priorityInfo.label}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteClick(opp.id)}
                      className="text-textMuted hover:text-red-600 p-0.5 rounded hover:bg-red-50 transition-colors"
                      title="Eliminar oportunidad"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={opp.id}
                className="bg-white border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Colored top-line representing stage */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: stageColor }}
                />

                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-text mb-1 leading-snug">{opp.title}</h4>
                    <p className="text-xs text-textMuted font-medium mb-3">
                      Interés: {opp.product_service ? `${opp.product_service.name} ${opp.product_service.sku ? `(${opp.product_service.sku})` : ''}` : opp.product_interest}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteClick(opp.id)}
                    className="text-textMuted hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Eliminar oportunidad"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-0.5">
                      Pipeline
                    </span>
                    <span className="font-semibold text-text">
                      {opp.pipeline?.name || 'Venta'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-textMuted uppercase tracking-wider block mb-0.5">
                      Valor Estimado
                    </span>
                    <span className="font-bold text-text flex items-center justify-end gap-1 text-sm text-primary">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {opp.expected_value
                        ? new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: opp.currency || 'MXN',
                          }).format(opp.expected_value)
                        : 'Sin cotizar'}
                    </span>
                  </div>
                </div>

                {/* Badges footer */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5 items-center">
                    {/* Stage Select / Stage Badge */}
                    <button
                      onClick={() => onStageChangeClick(opp)}
                      className="text-[11px] font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1"
                      style={{
                        borderColor: `${stageColor}30`,
                        backgroundColor: `${stageColor}15`,
                        color: stageColor,
                      }}
                      title="Cambiar etapa"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: stageColor }}
                      />
                      {opp.stage?.name}
                    </button>

                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.color}`}
                    >
                      {priorityInfo.label}
                    </span>
                  </div>

                  {/* Close date if present */}
                  {opp.expected_close_date && (
                    <span className="text-[10px] text-textMuted flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(opp.expected_close_date).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
