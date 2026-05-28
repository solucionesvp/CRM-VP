import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { fetchPipelines, fetchStages, createOpportunity } from '../../lib/api';

export default function OpportunityForm({ contactId, onSave, onCancel }) {
  // Fields
  const [title, setTitle] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');

  // Dropdown options loaded from backend
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);

  // States
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Load pipelines and stages dynamically
  useEffect(() => {
    async function loadOptions() {
      try {
        const [pipelinesData, stagesData] = await Promise.all([
          fetchPipelines(),
          fetchStages(),
        ]);
        setPipelines(pipelinesData);
        setStages(stagesData);

        // Preselect first pipeline if available
        if (pipelinesData.length > 0) {
          setPipelineId(pipelinesData[0].id.toString());
        }
        // Preselect first stage if available
        if (stagesData.length > 0) {
          setStageId(stagesData[0].id.toString());
        }
      } catch (err) {
        setSubmitError('Error al cargar opciones desde el servidor: ' + err.message);
      } finally {
        setLoadingData(false);
      }
    }
    loadOptions();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'El título de la oportunidad es obligatorio';
    }
    if (!productInterest.trim()) {
      newErrors.product_interest = 'El equipo/producto de interés es obligatorio';
    }
    if (!pipelineId) {
      newErrors.pipeline_id = 'Debes seleccionar un pipeline';
    }
    if (!stageId) {
      newErrors.stage_id = 'Debes seleccionar una etapa inicial';
    }
    if (expectedValue && isNaN(Number(expectedValue))) {
      newErrors.expected_value = 'El valor estimado debe ser un número válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      contact_id: contactId,
      title: title.trim(),
      product_interest: productInterest.trim(),
      pipeline_id: parseInt(pipelineId),
      stage_id: parseInt(stageId),
      expected_value: expectedValue.trim() ? parseFloat(expectedValue) : null,
      priority,
      expected_close_date: expectedCloseDate || null,
    };

    try {
      const saved = await createOpportunity(payload);
      onSave(saved);
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar la oportunidad.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="border border-border rounded-lg p-6 bg-white space-y-4">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-textMuted text-center font-medium">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <h3 className="font-bold text-sm text-text">Nueva Oportunidad</h3>
        <button
          onClick={onCancel}
          className="p-1 text-textMuted hover:text-text hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded p-2.5 text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Título de la Oportunidad *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Compra de motobombas Evans"
            className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
              errors.title
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            }`}
          />
          {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Product Interest */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Equipo / Producto de Interés *
          </label>
          <input
            type="text"
            value={productInterest}
            onChange={(e) => setProductInterest(e.target.value)}
            placeholder="Ej. Bomba Autocebante 3 HP Evans"
            className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
              errors.product_interest
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            }`}
          />
          {errors.product_interest && (
            <p className="text-[10px] text-red-500 mt-1">{errors.product_interest}</p>
          )}
        </div>

        {/* Pipeline & Stage Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Pipeline *
            </label>
            <select
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Etapa Inicial *
            </label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expected Value & Priority Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Valor Estimado (MXN)
            </label>
            <input
              type="text"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              placeholder="Ej. 12500"
              className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
                errors.expected_value
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
            {errors.expected_value && (
              <p className="text-[10px] text-red-500 mt-1">{errors.expected_value}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>

        {/* Close Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Fecha Estimada de Cierre
          </label>
          <input
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-1.5 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
