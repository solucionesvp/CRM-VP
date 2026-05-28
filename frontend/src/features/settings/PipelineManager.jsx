import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { createPipeline, updatePipeline, deletePipeline } from '../../lib/api';

export default function PipelineManager({
  pipelines,
  selectedPipelineId,
  onSelectPipeline,
  onRefresh,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states for creation
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOrder, setNewOrder] = useState(0);

  // Form states for edit
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOrder, setEditOrder] = useState(0);

  // Error/Loading states
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNewName('');
    setNewSlug('');
    setNewDesc('');
    setNewOrder(0);
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
      await createPipeline({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: newDesc.trim() || null,
        order: parseInt(newOrder) || 0,
      });
      resetForm();
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDesc(p.description || '');
    setEditOrder(p.order);
    setError(null);
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      setError('El nombre del pipeline no puede estar vacío.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updatePipeline(id, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        order: parseInt(editOrder) || 0,
      });
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea desactivar este pipeline?')) return;
    setLoading(true);
    setError(null);
    try {
      await deletePipeline(id);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <h3 className="text-sm font-bold text-text uppercase tracking-wider">
          Flujos de Venta (Pipelines)
        </h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Creation form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-background/40 border border-border p-4 rounded-lg space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-textMuted font-bold mb-1">Nombre</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Garantías"
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="block text-textMuted font-bold mb-1">Slug único</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="ej-garantias"
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-textMuted font-bold mb-1">Descripción</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descripción del pipeline..."
              className="w-full px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
            />
          </div>
          <div>
            <label className="block text-textMuted font-bold mb-1">Orden de despliegue</label>
            <input
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
              className="w-24 px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1.5">
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
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Pipelines list */}
      <div className="divide-y divide-border/60">
        {pipelines.map((p) => {
          const isSelected = selectedPipelineId === p.id;
          const isEditing = editingId === p.id;

          return (
            <div
              key={p.id}
              className={`py-3.5 px-2.5 rounded-lg transition-all duration-150 ${
                isSelected
                  ? 'bg-primary/[0.03] border-l-4 border-l-primary pl-1.5'
                  : 'hover:bg-gray-50'
              }`}
            >
              {isEditing ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-bold"
                    />
                    <input
                      type="number"
                      value={editOrder}
                      onChange={(e) => setEditOrder(e.target.value)}
                      className="w-16 px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium text-center"
                    />
                  </div>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Descripción..."
                    className="w-full px-2.5 py-1.5 bg-white border border-border rounded focus:outline-none focus:border-primary font-medium"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 hover:bg-gray-100 rounded text-textMuted"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdate(p.id)}
                      disabled={loading}
                      className="p-1 hover:bg-primary/10 rounded text-primary"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div
                    onClick={() => onSelectPipeline(p.id)}
                    className="flex-1 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text">{p.name}</span>
                      <span className="text-[9px] bg-gray-100 text-textMuted px-1.5 py-0.5 rounded font-mono font-medium">
                        {p.slug}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-textMuted mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(p)}
                      title="Editar"
                      className="p-1 text-textMuted hover:text-primary rounded hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      title="Desactivar"
                      className="p-1 text-textMuted hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
