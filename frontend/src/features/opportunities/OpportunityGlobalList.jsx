import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Calendar, ArrowRight, User } from 'lucide-react';
import { fetchAllOpportunities, fetchPipelines, fetchStages, fetchContacts } from '../../lib/api';
import OpportunityForm from '../contacts/OpportunityForm';

const PRIORITY_LABELS = {
  low: { label: 'Baja', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  medium: { label: 'Media', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'Alta', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function OpportunityGlobalList({ onNavigateToContact }) {
  // Lists from backend
  const [opportunities, setOpportunities] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [contactMap, setContactMap] = useState({});

  // Filters state
  const [q, setQ] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);

  // Loading/Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load catalogs and contacts lookup on mount
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [pipelinesData, stagesData, contactsData] = await Promise.all([
          fetchPipelines(),
          fetchStages(),
          fetchContacts({ size: 100 }), // Load contacts for name lookup
        ]);

        setPipelines(pipelinesData);
        setStages(stagesData);

        // Build lookup map for contact names
        const lookup = {};
        if (contactsData && contactsData.items) {
          contactsData.items.forEach((c) => {
            lookup[c.id] = c.name;
          });
        }
        setContactMap(lookup);
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    }
    loadCatalogs();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllOpportunities({
        page: 1,
        size: 100, // Load a large batch to allow hybrid client-side filters
        pipeline_id: selectedPipeline,
        stage_id: selectedStage,
      });
      setOpportunities(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch opportunities when backend-supported filters change
  useEffect(() => {
    loadOpportunities();
  }, [selectedPipeline, selectedStage]);

  // Client-side filtering for priority and text search (matches opportunity title or contact name)
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesPriority = !selectedPriority || opp.priority === selectedPriority;
    
    const contactName = contactMap[opp.contact_id] || '';
    const searchLower = q.toLowerCase();
    const matchesSearch =
      !q ||
      opp.title.toLowerCase().includes(searchLower) ||
      (opp.product_interest && opp.product_interest.toLowerCase().includes(searchLower)) ||
      (opp.product_service?.name?.toLowerCase().includes(searchLower)) ||
      (opp.product_service?.sku?.toLowerCase().includes(searchLower)) ||
      contactName.toLowerCase().includes(searchLower);

    return matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Panel General de Oportunidades</h2>
          <p className="text-xs text-textMuted mt-1">
            Supervisa y gestiona las cotizaciones, reparaciones de taller y ventas activas en Evans Tepic.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors shadow-sm"
        >
          Nueva Oportunidad
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-textMuted" />
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar oportunidad o contacto..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Pipeline select */}
        <div>
          <select
            value={selectedPipeline}
            onChange={(e) => {
              setSelectedPipeline(e.target.value);
              setSelectedStage('');
            }}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Todos los Pipelines</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stage select */}
        <div>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            disabled={!selectedPipeline}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
          >
            <option value="">Todas las Etapas</option>
            {stages
              .filter((s) => !selectedPipeline || s.pipeline_id.toString() === selectedPipeline.toString())
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        {/* Priority select */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Todas las Prioridades</option>
            <option value="low">Prioridad Baja</option>
            <option value="medium">Prioridad Media</option>
            <option value="high">Prioridad Alta</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      {loading ? (
        <div className="bg-surface border border-border rounded-lg p-16 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-textMuted font-bold tracking-wide">Cargando oportunidades...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center text-sm text-red-600 font-bold">
          Error al obtener oportunidades: {error}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-16 text-center shadow-sm">
          <p className="text-base font-bold text-text mb-1">No se encontraron oportunidades</p>
          <p className="text-xs text-textMuted">
            Ajusta los filtros o realiza otra búsqueda en tu catálogo.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background text-textMuted text-xs font-bold uppercase tracking-wider border-b border-border">
                  <th className="px-6 py-4">Oportunidad / Producto</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Pipeline</th>
                  <th className="px-6 py-4">Etapa</th>
                  <th className="px-6 py-4">Valor Estimado</th>
                  <th className="px-6 py-4">Prioridad</th>
                  <th className="px-6 py-4">Actualizado</th>
                  <th className="px-6 py-4 text-right">Foco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredOpportunities.map((opp) => {
                  const stageColor = opp.stage?.color || '#6B7280';
                  const priorityInfo = PRIORITY_LABELS[opp.priority] || PRIORITY_LABELS.medium;
                  const contactName = contactMap[opp.contact_id] || 'Ver cliente';

                  return (
                    <tr key={opp.id} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text">{opp.title}</div>
                        <div className="text-xs text-textMuted font-medium">
                          {opp.product_service ? `${opp.product_service.name} ${opp.product_service.sku ? `(${opp.product_service.sku})` : ''}` : opp.product_interest}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onNavigateToContact(opp.contact_id)}
                          className="text-primary hover:underline font-bold flex items-center gap-1 text-left"
                          title="Ir al contacto"
                        >
                          <User className="w-3.5 h-3.5" />
                          {contactName}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-textMuted text-xs uppercase tracking-wider">
                        {opp.pipeline?.name || 'Venta'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded border"
                          style={{
                            borderColor: `${stageColor}30`,
                            backgroundColor: `${stageColor}10`,
                            color: stageColor,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: stageColor }}
                          />
                          {opp.stage?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {opp.expected_value
                          ? new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: opp.currency || 'MXN',
                            }).format(opp.expected_value)
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.color}`}
                        >
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-textMuted text-xs">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(opp.updated_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onNavigateToContact(opp.contact_id)}
                          className="p-1.5 text-textMuted hover:text-primary rounded hover:bg-gray-100 transition-colors"
                          title="Ir al contacto"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-xl p-1">
            <OpportunityForm
              onSave={() => {
                setShowAddForm(false);
                loadOpportunities();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
