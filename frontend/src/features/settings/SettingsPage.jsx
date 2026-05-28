import React, { useState, useEffect } from 'react';
import { Settings, Sliders } from 'lucide-react';
import { fetchPipelines } from '../../lib/api';
import PipelineManager from './PipelineManager';
import StageManager from './StageManager';

export default function SettingsPage() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPipelinesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPipelines();
      setPipelines(data);
      if (data.length > 0 && selectedPipelineId === null) {
        setSelectedPipelineId(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelinesList();
  }, []);

  const activePipeline = pipelines.find((p) => p.id === selectedPipelineId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between bg-white border border-border rounded-lg p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configuración del Sistema
          </h2>
          <p className="text-xs text-textMuted mt-0.5">
            Administra los Pipelines de venta y las Etapas comerciales asociadas a VP Equipos & Soluciones.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-lg p-24 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-textMuted font-bold tracking-wide">Cargando configuración...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-600 font-semibold">
          Error al obtener pipelines: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fadeIn">
          {/* Pipelines management column */}
          <PipelineManager
            pipelines={pipelines}
            selectedPipelineId={selectedPipelineId}
            onSelectPipeline={setSelectedPipelineId}
            onRefresh={loadPipelinesList}
          />

          {/* Stages management column */}
          <StageManager
            pipelineId={selectedPipelineId}
            pipelineName={activePipeline ? activePipeline.name : ''}
          />
        </div>
      )}
    </div>
  );
}
