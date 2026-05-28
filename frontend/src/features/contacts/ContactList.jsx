import React from 'react';
import { User, Building, Phone, Mail, Trash2, ArrowRight } from 'lucide-react';

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
}) {
  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-16 text-center shadow-sm">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-textMuted font-semibold tracking-wide">Cargando contactos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center shadow-sm">
        <p className="text-sm text-red-600 font-bold mb-4">No se pudo establecer conexión: {error}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-red-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border p-20 text-center shadow-sm">
        <p className="text-base font-bold text-text mb-2">No se encontraron contactos</p>
        <p className="text-sm text-textMuted max-w-md mx-auto mb-6">
          Agrega contactos reales en la base de datos o verifica tu criterio de búsqueda actual.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / size);

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background text-textMuted text-xs font-bold uppercase tracking-widest border-b border-border">
              <th className="px-6 py-4">Nombre / Contacto</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Empresa</th>
              <th className="px-6 py-4">Teléfono</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {contacts.map((contact) => {
              const isSelected = selectedId === contact.id;
              return (
                <tr
                  key={contact.id}
                  className={`hover:bg-primary/5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary/[0.04] font-semibold border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => onSelect(contact.id)}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-text">{contact.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.type === 'company' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold border border-gray-200 uppercase tracking-wider">
                        <Building className="w-3.5 h-3.5" /> Empresa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5" /> Persona
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-textMuted">{contact.company_name || '-'}</td>
                  <td className="px-6 py-4 text-textMuted">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-textMuted/70" /> {contact.phone || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-textMuted">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-textMuted/70" /> {contact.email || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelect(contact.id)}
                        className="p-2 text-textMuted hover:text-primary rounded hover:bg-gray-100 transition-colors"
                        title="Ver detalle"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(contact.id)}
                        className="p-2 text-textMuted hover:text-red-600 rounded hover:bg-red-50 transition-colors"
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
    </div>
  );
}
