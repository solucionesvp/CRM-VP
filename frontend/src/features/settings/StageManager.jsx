import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { fetchStages, createStage, updateStage, deleteStage } from '../../lib/api';

const PRESET_COLORS = [
  '#6B7280', // Gray
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#10B981', // Green
  '#EF4444', // Red
];

export default function StageManager({ pipelineId, pipelineName }) {
  const [stages, setStages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states for creation
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [newOrder, setNewOrder] = useState(1);
  const [newIsWon, setNewIsWon] = useState(false);
  const [newIsLost, setNewIsLost] = useState(false);

  // Form states for edit
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editOrder, setEditOrder] = useState(1);
  const [editIsWon, setEditIsWon] = useState(false);
  const [editIsLost, setEditIsLost] = useState(false);

  // Error/Loading states
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStagesList = async () => {
    if (!pipelineId) return;
    setLoadingList(true);
    setError(null);
    try {
      const data = await fetchStages(pipelineId);
      // Sort by order
      data.sort((a, b) => a.order - b.order);
      setStages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadStagesList();
    resetForm();
  }, [pipelineId]);

  const resetForm = () => {
    setNewName('');
    setNewSlug('');
    setNewColor('#6B7280');
    setNewOrder(stages.length + 1);
    setNewIsWon(false);
    setNewIsLost(false);
    setIsCreating(false);
    setError(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      setError('El nombre y el slug son requeridos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createStage({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        color: newColor,
        order: parseInt(newOrder) || 1,
        is_won: newIsWon,
        is_lost: newIsLost,
        pipeline_id: parseInt(pipelineId),
      });
      resetForm();
      loadStagesList();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditColor(s.color);
    setEditOrder(s.order);
    setEditIsWon(s.is_won);
    setEditIsLost(s.is_lost);
    setError(null);
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateStage(id, {
        name: editName.trim(),
        color: editColor,
        order: parseInt(editOrder) || 1,
        is_won: editIsWon,
        is_lost: editIsLost,
      });
      setEditingId(null);
      loadStagesList();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea desactivar esta etapa?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteStage(id);
      loadStagesList();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!pipelineId) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-sm p-8 text-center text-xs text-textMuted font-bold uppercase tracking-wider">
        Selecciona un Pipeline para gestionar sus etapas.
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">
            Etapas comerciales
          </h3>
          <span className="text-[10px] text-textMuted font-semibold uppercase tracking-wide">
            Pipeline activo: <span className="text-primary font-bold">{pipelineName}</span>
          </span>
        </div>
        {!isCreating && (
          <button
            onClick={() => {
              setNewOrder(stages.length + 1);
              setIsCreating(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Etapa
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stage Creation Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-background/40 border border-border p-4 rounded-lg space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-textMuted font-bold mb-1">Nombre de Etapa</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Diagnóstico"
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="block text-textMuted font-bold mb-1">Slug único</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="ej-diagnostico"
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-textMuted font-bold mb-1.5">Color identificador</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    newColor === c ? 'border-primary scale-110 shadow-sm' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent p-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-textMuted font-bold mb-1">Orden</label>
              <input
                type="number"
                value={newOrder}
                onChange={(e) => setNewOrder(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-4">
              <input
                type="checkbox"
                id="isWonCheck"
                checked={newIsWon}
                onChange={(e) => {
                  setNewIsWon(e.target.checked);
                  if (e.target.checked) setNewIsLost(false);
                }}
                className="w-4 h-4 text-primary border-border focus:ring-primary rounded"
              />
              <label htmlFor="isWonCheck" className="text-text font-bold cursor-pointer select-none">
                Cerrado Ganador
              </label>
            </div>
            <div className="flex items-center gap-1.5 pt-4">
              <input
                type="checkbox"
                id="isLostCheck"
                checked={newIsLost}
                onChange={(e) => {
                  setNewIsLost(e.target.checked);
                  if (e.target.checked) setNewIsWon(false);
                }}
                className="w-4 h-4 text-primary border-border focus:ring-primary rounded"
              />
              <label htmlFor="isLostCheck" className="text-text font-bold cursor-pointer select-none">
                Cerrado Perdido
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-2.5 py-1.5 border border-border rounded hover:bg-gray-50 text-textMuted font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-2.5 py-1.5 bg-primary text-white rounded hover:bg-primary/95 font-bold shadow-sm"
            >
              {loading ? 'Guardando...' : 'Guardar Etapa'}
            </button>
          </div>
        </form>
      )}

      {/* Stages List */}
      {loadingList ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-[10px] text-textMuted font-bold">Cargando etapas...</p>
        </div>
      ) : stages.length === 0 ? (
        <div className="py-8 text-center text-xs text-textMuted border border-dashed border-border rounded-lg">
          Este pipeline aún no tiene etapas comerciales configuradas.
        </div>
      ) : (
        <div className="space-y-2.5">
          {stages.map((s) => {
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                className="border border-border rounded-lg p-3 bg-white flex items-center justify-between gap-4 text-xs font-semibold"
              >
                {isEditing ? (
                  <div className="w-full space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="col-span-2 px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-bold"
                      />
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium text-center"
                      />
                    </div>

                    {/* Color selector edit */}
                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full border transition-all ${
                            editColor === c ? 'border-primary scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent p-0"
                      />
                    </div>

                    <div className="flex gap-4 pt-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          id={`editWon-${s.id}`}
                          checked={editIsWon}
                          onChange={(e) => {
                            setEditIsWon(e.target.checked);
                            if (e.target.checked) setEditIsLost(false);
                          }}
                          className="w-4 h-4 text-primary border-border focus:ring-primary rounded"
                        />
                        <label htmlFor={`editWon-${s.id}`} className="text-text cursor-pointer select-none">
                          Ganador (won)
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          id={`editLost-${s.id}`}
                          checked={editIsLost}
                          onChange={(e) => {
                            setEditIsLost(e.target.checked);
                            if (e.target.checked) setEditIsWon(false);
                          }}
                          className="w-4 h-4 text-primary border-border focus:ring-primary rounded"
                        />
                        <label htmlFor={`editLost-${s.id}`} className="text-text cursor-pointer select-none">
                          Perdido (lost)
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:bg-gray-100 rounded text-textMuted"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(s.id)}
                        disabled={loading}
                        className="p-1 hover:bg-primary/10 rounded text-primary"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 select-none">
                      {/* Drag handle or color dot */}
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-sm"
                        style={{ backgroundColor: s.color }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text">
                            {s.order}. {s.name}
                          </span>
                          <span className="text-[9px] font-mono text-textMuted px-1 bg-gray-50 border rounded uppercase tracking-wider">
                            {s.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {s.is_won && (
                            <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 uppercase font-bold tracking-wide">
                              Ganador
                            </span>
                          )}
                          {s.is_lost && (
                            <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 uppercase font-bold tracking-wide">
                              Perdido
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(s)}
                        title="Editar"
                        className="p-1 text-textMuted hover:text-primary rounded hover:bg-gray-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        title="Desactivar"
                        className="p-1 text-textMuted hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
