import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Building, TrendingUp, CheckSquare, X, Loader2, Package } from 'lucide-react';
import { fetchGlobalSearch } from '../../lib/api';

export default function GlobalSearch({ onNavigateToContact }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGlobalSearch(q.trim());
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('Error global search:', err);
        setError(err.message || 'Error al buscar');
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [q]);

  const handleClear = () => {
    setQ('');
    setResults(null);
    setIsOpen(false);
  };

  const handleResultClick = (contactId) => {
    if (contactId) {
      onNavigateToContact(contactId);
    }
    setIsOpen(false);
    setQ('');
    setResults(null);
  };

  const hasResults =
    results &&
    (results.contacts?.length > 0 ||
      results.opportunities?.length > 0 ||
      results.tasks?.length > 0 ||
      results.product_services?.length > 0);

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-textMuted" />
          )}
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar contactos, cotizaciones, tareas..."
          className="w-full pl-9 pr-8 py-1.5 bg-background border border-border rounded text-xs text-text font-medium placeholder-textMuted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
        />
        {q && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-textMuted hover:text-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && q.trim().length >= 2 && (
        <div className="absolute top-full mt-1.5 left-0 w-[480px] bg-secondary border border-border/20 rounded shadow-xl max-h-[420px] overflow-y-auto z-50 text-xs animate-fadeIn text-gray-200">
          
          {loading && !results && (
            <div className="p-4 text-center text-textMuted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span>Buscando en la base de datos de VP...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-400 font-semibold">
              Error de conexión: {error}
            </div>
          )}

          {!loading && !error && !hasResults && (
            <div className="p-4 text-center text-gray-400">
              No se encontraron resultados para <span className="font-bold text-white">"{q}"</span>
            </div>
          )}

          {results && hasResults && (
            <div className="divide-y divide-border/10">
              
              {/* CONTACTS GROUP */}
              {results.contacts && results.contacts.length > 0 && (
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Contactos ({results.contacts.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleResultClick(contact.id)}
                        className="w-full text-left p-2 hover:bg-white/5 rounded transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="overflow-hidden">
                          <div className="font-bold text-white group-hover:text-primary transition-colors truncate">
                            {contact.name}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                            {contact.company_name && (
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-gray-500" />
                                {contact.company_name}
                              </span>
                            )}
                            {contact.phone && <span>• {contact.phone}</span>}
                            {contact.email && <span>• {contact.email}</span>}
                          </div>
                        </div>
                        {contact.type === 'company' ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-bold border border-gray-600 shrink-0 uppercase tracking-wide">
                            Empresa
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold border border-primary/30 shrink-0 uppercase tracking-wide">
                            Persona
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* OPPORTUNITIES GROUP */}
              {results.opportunities && results.opportunities.length > 0 && (
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span>Oportunidades ({results.opportunities.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.opportunities.map((opp) => (
                      <button
                        key={opp.id}
                        onClick={() => handleResultClick(opp.contact_id)}
                        className="w-full text-left p-2 hover:bg-white/5 rounded transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="overflow-hidden">
                          <div className="font-bold text-white group-hover:text-primary transition-colors truncate">
                            {opp.title}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">
                            Interés: <span className="text-gray-300 font-semibold">{opp.product_interest}</span> • Cliente: <span className="text-gray-300">{opp.contact_name}</span>
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide shrink-0 ${
                          opp.status === 'won'
                            ? 'bg-green-950/45 text-green-400 border-green-800/40'
                            : opp.status === 'lost'
                              ? 'bg-red-950/45 text-red-400 border-red-800/40'
                              : 'bg-primary/20 text-primary border-primary/30'
                        }`}>
                          {opp.status === 'won' ? 'Ganada' : opp.status === 'lost' ? 'Perdida' : 'Activa'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TASKS GROUP */}
              {results.tasks && results.tasks.length > 0 && (
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    <span>Seguimientos ({results.tasks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleResultClick(task.contact_id)}
                        className="w-full text-left p-2 hover:bg-white/5 rounded transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="overflow-hidden">
                          <div className="font-bold text-white group-hover:text-primary transition-colors truncate">
                            {task.title}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">
                            {task.contact_name && <span>Cliente: <span className="text-gray-300">{task.contact_name}</span></span>}
                            {task.opportunity_title && <span> • Cotiz: <span className="text-gray-300">{task.opportunity_title}</span></span>}
                            {task.due_date && (
                              <span className="text-gray-400 ml-1.5 font-medium">
                                • Vence: {new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-green-950/45 text-green-400 border-green-800/40'
                            : task.status === 'cancelled'
                              ? 'bg-gray-800 text-gray-400 border-gray-700'
                              : 'bg-yellow-950/45 text-yellow-400 border-yellow-800/40'
                        }`}>
                          {task.status === 'completed' ? 'Hecho' : task.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUCT SERVICES GROUP */}
              {results.product_services && results.product_services.length > 0 && (
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    <span>Catálogo ({results.product_services.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.product_services.map((ps) => (
                      <div
                        key={ps.id}
                        className="w-full text-left p-2 hover:bg-white/5 rounded transition-colors flex items-center justify-between gap-3 group cursor-default"
                      >
                        <div className="overflow-hidden">
                          <div className="font-bold text-white group-hover:text-primary transition-colors truncate">
                            {ps.name}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">
                            {ps.sku && <span>SKU: <span className="text-gray-300">{ps.sku}</span></span>}
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide shrink-0 ${
                          ps.type === 'product'
                            ? 'bg-blue-950/45 text-blue-400 border-blue-800/40'
                            : 'bg-green-950/45 text-green-400 border-green-800/40'
                        }`}>
                          {ps.type === 'product' ? 'Producto' : 'Servicio'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </div>
  );
}
