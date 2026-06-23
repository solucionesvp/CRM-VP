import React, { useState, useEffect } from 'react';
import { Columns, LayoutGrid, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchPipelines, fetchStages, fetchAllOpportunities, fetchContacts, updateOpportunityStage } from '../../lib/api';
import KanbanColumn from './KanbanColumn';
import OpportunityForm from '../contacts/OpportunityForm';

export default function KanbanBoard() {
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');

  const [stages, setStages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [contactMap, setContactMap] = useState({});

  // Loading/Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load pipelines and contacts on mount
  useEffect(() => {
    async function initBoard() {
      try {
        const [pipelinesData, contactsData] = await Promise.all([
          fetchPipelines(),
          fetchContacts({ size: 100 }),
        ]);

        setPipelines(pipelinesData);
        if (pipelinesData.length > 0) {
          setSelectedPipelineId(pipelinesData[0].id.toString());
        }

        // Build contact lookup map
        const lookup = {};
        if (contactsData && contactsData.items) {
          contactsData.items.forEach((c) => {
            lookup[c.id] = c.name;
          });
        }
        setContactMap(lookup);
      } catch (err) {
        setError('Error al inicializar el tablero: ' + err.message);
        setLoading(false);
      }
    }
    initBoard();
  }, []);

  // Fetch stages and opportunities when selected pipeline changes
  const loadPipelineData = async () => {
    if (!selectedPipelineId) return;
    setLoading(true);
    setError(null);
    try {
      const [stagesData, oppsData] = await Promise.all([
        fetchStages(), // fetch all stages then filter, or pass pipeline_id query param
      ]);

      // Filter stages for selected pipeline
      const pipelineStages = stagesData.filter(
        (s) => s.pipeline_id === parseInt(selectedPipelineId)
      );
      // Sort stages by order
      pipelineStages.sort((a, b) => a.order - b.order);
      setStages(pipelineStages);

      // Load opportunities for this pipeline
      const data = await fetchAllOpportunities({
        page: 1,
        size: 100,
        pipeline_id: parseInt(selectedPipelineId),
      });
      setOpportunities(data.items || []);
    } catch (err) {
      setError('Error al cargar datos del pipeline: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
  }, [selectedPipelineId]);

  // Handle opportunity stage drag and drop update (optimistic with rollback)
  const handleOpportunityMove = async (oppId, newStageId) => {
    const targetStage = stages.find((s) => s.id === newStageId);
    if (!targetStage) return;

    // 1. Keep backup state for rollback
    const backupOpps = [...opportunities];

    // 2. Optimistic update in UI
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              stage_id: newStageId,
              stage: {
                id: targetStage.id,
                name: targetStage.name,
                slug: targetStage.slug,
                order: targetStage.order,
                color: targetStage.color,
                is_won: targetStage.is_won,
                is_lost: targetStage.is_lost,
                is_active: targetStage.is_active,
              },
            }
          : o
      )
    );

    // 3. API PATCH Call
    try {
      await updateOpportunityStage(oppId, newStageId);
    } catch (err) {
      // 4. Rollback in case of server failure
      alert(`Error al mover oportunidad: ${err.message}. Revirtiendo cambios.`);
      setOpportunities(backupOpps);
    }
  };

  return (
    <div className="space-y-5 h-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-border rounded-lg p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <Columns className="w-5 h-5 text-primary" />
            Tablero Comercial (Kanban)
          </h2>
          <p className="text-xs text-textMuted mt-0.5">
            Arrastra y suelta las cotizaciones y reparaciones para actualizar sus etapas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
            Pipeline:
          </label>
          <select
            value={selectedPipelineId}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded text-xs font-bold text-text cursor-pointer focus:outline-none focus:border-primary"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadPipelineData}
            title="Recargar tablero"
            className="p-1.5 border border-border hover:bg-gray-50 rounded transition-colors text-textMuted hover:text-text"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Kanban Board Container */}
      {loading ? (
        <div className="bg-surface border border-border rounded-lg p-24 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-textMuted font-bold tracking-wide">Cargando tablero...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 pr-4 h-[calc(100vh-200px)] scrollbar-thin">
          {stages.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stage_id === stage.id);
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                opportunities={stageOpps}
                contactMap={contactMap}
                onOpportunityMove={handleOpportunityMove}
                onSelectOpportunity={(opp) => setSelectedOpp(opp)}
              />
            );
          })}
        </div>
      )}

      {selectedOpp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-xl">
            <OpportunityForm
              contactId={selectedOpp.contact_id}
              opportunity={selectedOpp}
              onSave={(updated) => {
                setSelectedOpp(updated);
                loadPipelineData();
              }}
              onCancel={() => setSelectedOpp(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
