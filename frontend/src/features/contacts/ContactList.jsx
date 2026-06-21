import React from 'react';
import { User, Building, Phone, Mail, Trash2, ArrowRight, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function ContactList({
  contacts,
  total,
  page,
  size,
  loading,
  error,
  selectedId,
  onSelect,
  onDelete,
  onPageChange,
  onRetry,
  tags = [],
  selectedTag = null,
  onTagFilter,
}) {
  const totalPages = Math.ceil(total / size);

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Tag filter bar */}
      <div className="px-6 py-4 border-b border-border bg-background/50 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-textMuted uppercase tracking-wider mr-2">Filtrar por etiqueta:</span>
        <button
          onClick={() => onTagFilter && onTagFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
            !selectedTag
              ? 'bg-primary/10 border-primary text-primary shadow-sm font-semibold'
              : 'bg-surface border-border text-textMuted hover:border-gray-400 hover:text-text'
          }`}
        >
          Todos
        </button>
        {tags && tags.map((tag) => {
          const isSelected = selectedTag === tag.name;
          const activeBg = tag.color + '15';
          return (
            <button
              key={tag.id}
              onClick={() => onTagFilter && onTagFilter(tag.name)}
              style={
                isSelected
                  ? { backgroundColor: activeBg, borderColor: tag.color, color: tag.color }
                  : {}
              }
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                isSelected
                  ? 'shadow-sm font-semibold'
                  : 'bg-surface border-border text-textMuted hover:border-gray-400 hover:text-text'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-textMuted font-semibold tracking-wide">Cargando contactos...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50">
          <p className="text-sm text-red-600 font-bold mb-4">No se pudo establecer conexión: {error}</p>
          <button
            onClick={onRetry}
            className="px-5 py-2 bg-red-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition"
          >
            Reintentar conexión
          </button>
        </div>
      ) : !contacts || contacts.length === 0 ? (
        <div className="p-20 text-center">
          <p className="text-base font-bold text-text mb-2">No se encontraron contactos</p>
          <p className="text-sm text-textMuted max-w-md mx-auto mb-6">
            Agrega contactos reales en la base de datos o verifica tu criterio de búsqueda actual.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background text-textMuted text-xs font-bold uppercase tracking-widest border-b border-border">
                  <th className="px-6 py-4">Cliente / Razón Social</th>
                  <th className="px-6 py-4">Contacto / Medios</th>
                  <th className="px-6 py-4">Interés / Etiquetas</th>
                  <th className="px-6 py-4">Oportunidades</th>
                  <th className="px-6 py-4">Próximo Seguimiento</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {contacts.map((contact) => {
                  const isSelected = selectedId === contact.id;
                  
                  // Helper to parse next pending task
                  let nextTaskInfo = null;
                  if (contact.next_task) {
                    const dueDate = contact.next_task.due_date ? new Date(contact.next_task.due_date) : null;
                    const isOverdue = dueDate && dueDate < new Date();
                    nextTaskInfo = {
                      title: contact.next_task.title,
                      formattedDate: dueDate
                        ? dueDate.toLocaleString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Sin fecha',
                      isOverdue,
                    };
                  }

                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-primary/[0.02] transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary/[0.04] font-semibold border-l-2 border-l-primary' : ''
                      }`}
                      onClick={() => onSelect(contact.id)}
                    >
                      {/* Column 1: Cliente / Razón Social */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text text-sm hover:text-primary transition-colors">
                              {contact.name}
                            </span>
                            {contact.type === 'company' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold border border-gray-200 uppercase tracking-wider shrink-0">
                                <Building className="w-2.5 h-2.5" /> Empresa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 uppercase tracking-wider shrink-0">
                                <User className="w-2.5 h-2.5" /> Persona
                              </span>
                            )}
                          </div>
                          {contact.company_name && (
                            <div className="text-[11px] text-textMuted font-medium flex items-center gap-1">
                              <Building className="w-3 h-3 text-textMuted/60" />
                              {contact.company_name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Contacto / Medios */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[11px] text-textMuted font-medium">
                          {contact.phone && (
                            <span className="flex items-center gap-1.5" title="Teléfono">
                              <Phone className="w-3 h-3 text-textMuted/60" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.whatsapp && (
                            <span className="flex items-center gap-1.5 text-green-600 font-semibold" title="WhatsApp">
                              <MessageSquare className="w-3 h-3 text-green-500/80" />
                              {contact.whatsapp}
                            </span>
                          )}
                          {contact.email && (
                            <span className="flex items-center gap-1.5" title="Correo">
                              <Mail className="w-3 h-3 text-textMuted/60" />
                              <span className="truncate max-w-[150px]">{contact.email}</span>
                            </span>
                          )}
                          {!contact.phone && !contact.whatsapp && !contact.email && (
                            <span className="text-gray-400 italic">Sin datos</span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Interés / Etiquetas */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {/* Product Interest (Orange) */}
                          {contact.primary_interest && (
                            <span
                              className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider"
                              title="Interés inferido de cotizaciones"
                            >
                              {contact.primary_interest}
                            </span>
                          )}
                          {/* Internal Tags (Colored) */}
                          {contact.tags_rel &&
                            contact.tags_rel.map((tag) => (
                              <span
                                key={tag.id}
                                style={{
                                  backgroundColor: tag.color + '18',
                                  borderColor: tag.color + '40',
                                  color: tag.color,
                                }}
                                className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider"
                              >
                                {tag.label}
                              </span>
                            ))}
                          {!contact.primary_interest && (!contact.tags_rel || contact.tags_rel.length === 0) && (
                            <span className="text-gray-400 italic font-normal text-xs">-</span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Oportunidades */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {contact.has_open_opportunities ? (
                            <span className="relative flex h-2 w-2" title="Cotizaciones activas">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-gray-300" title="Sin cotizaciones activas"></span>
                          )}
                          <span className="text-xs font-bold text-text">
                            {contact.opportunities_count || 0}{' '}
                            <span className="text-textMuted font-medium">
                              {contact.opportunities_count === 1 ? 'cotización' : 'cotizaciones'}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Próximo Seguimiento */}
                      <td className="px-6 py-4">
                        {nextTaskInfo ? (
                          <div className="flex flex-col gap-0.5 max-w-[180px]">
                            <span className="text-xs font-bold text-text truncate" title={nextTaskInfo.title}>
                              {nextTaskInfo.title}
                            </span>
                            <span
                              className={`text-[10px] flex items-center gap-1 font-semibold ${
                                nextTaskInfo.isOverdue ? 'text-red-600 font-bold' : 'text-textMuted'
                              }`}
                            >
                              {nextTaskInfo.isOverdue ? (
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              ) : (
                                <Calendar className="w-3 h-3 text-textMuted/70 shrink-0" />
                              )}
                              {nextTaskInfo.isOverdue ? 'ATRASADO: ' : ''}
                              {nextTaskInfo.formattedDate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic font-normal text-xs">Ninguno</span>
                        )}
                      </td>

                      {/* Column 6: Acciones */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelect(contact.id)}
                            className="p-1.5 text-textMuted hover:text-primary rounded hover:bg-gray-100 transition-colors"
                            title="Ver detalle"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(contact.id)}
                            className="p-1.5 text-textMuted hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            title="Eliminar contacto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-background px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-textMuted font-medium">
              Mostrando <span className="text-text font-bold">{contacts.length}</span> de{' '}
              <span className="text-text font-bold">{total}</span> contactos
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3.5 py-1.5 text-xs font-bold bg-surface border border-border rounded text-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <span className="text-xs text-textMuted font-bold px-3">
                Pág. {page} de {totalPages || 1}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3.5 py-1.5 text-xs font-bold bg-surface border border-border rounded text-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
