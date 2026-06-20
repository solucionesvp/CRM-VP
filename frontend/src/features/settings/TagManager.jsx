import { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X, ChevronDown, ChevronUp, HelpCircle, Tag, Ban, RefreshCw } from 'lucide-react';
import { fetchTags, createTag, updateTag, deleteTag } from '../../lib/api';

const PRESET_COLORS = ['#FC6621', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

function ColorDot({ color, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 transition-transform ${selected ? 'scale-110 border-gray-700' : 'border-transparent'}`}
      style={{ background: color }}
    />
  );
}

export default function TagManager() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guideExpanded, setGuideExpanded] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null); // When null, we are in "Create" mode
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#FC6621');
  const [description, setDescription] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTags();
      setTags(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNameChange = (val) => {
    // Only lowercase letters, numbers, and underscores, no spaces
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setName(sanitized);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setLabel('');
    setColor('#FC6621');
    setDescription('');
    setError(null);
  };

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setLabel(tag.label);
    setColor(tag.color);
    setDescription(tag.description || '');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError('La etiqueta visible es requerida.');
      return;
    }

    if (!editingId && !name.trim()) {
      setError('El nombre (slug) es requerido.');
      return;
    }

    try {
      if (editingId) {
        await updateTag(editingId, {
          label: label.trim(),
          color,
          description: description.trim() || null
        });
      } else {
        await createTag({
          name: name.trim(),
          label: label.trim(),
          color,
          description: description.trim() || null
        });
      }
      handleCancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (tag) => {
    setError(null);
    try {
      await updateTag(tag.id, { is_active: !tag.is_active });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#FC6621]" />
          Administración de Etiquetas
        </h3>
      </div>

      {/* 1. GUÍA INFORMATIVA */}
      <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setGuideExpanded(!guideExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            ¿Para qué sirven las etiquetas?
          </div>
          {guideExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {guideExpanded && (
          <div className="px-4 pb-4 text-xs text-gray-600 space-y-2 border-t border-gray-200/50 pt-3 animate-fadeIn">
            <p className="font-medium">Las etiquetas te permiten clasificar y segmentar tus contactos para:</p>
            <ul className="list-disc pl-5 space-y-1 font-medium">
              <li>Identificar el perfil del cliente (ferretero, mecánico, hotelero, etc.)</li>
              <li>Agrupar contactos para campañas de WhatsApp personalizadas</li>
              <li>Automatizar flujos según el tipo de cliente</li>
              <li>Filtrar contactos por sector o interés</li>
            </ul>
            <p className="font-medium text-gray-700">
              El bot las asigna automáticamente según lo que detecta en la conversación.
            </p>
            <p className="font-semibold text-[#FC6621]">
              Crea las etiquetas que necesites — el nombre no se puede cambiar después.
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. FORMULARIO DE CREACIÓN / EDICIÓN */}
      <form onSubmit={handleSubmit} className="border border-gray-200 bg-white rounded-xl p-4 space-y-4 shadow-sm">
        <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
          {editingId ? 'Editar etiqueta' : 'Nueva etiqueta'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Nombre (Slug) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={!!editingId}
              placeholder="ej: cliente_vip"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30 disabled:bg-gray-100 disabled:text-gray-400"
            />
            {!editingId && (
              <p className="text-[9px] text-gray-400 mt-1">
                Solo minúsculas, números y guiones bajos (_), sin espacios. No se puede cambiar después.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Etiqueta Visible *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ej: Cliente VIP"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Descripción (Opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Para qué se usa esta etiqueta?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Color de la etiqueta ({color})
          </label>
          <div className="flex gap-2 flex-wrap items-center">
            {PRESET_COLORS.map((c) => (
              <ColorDot
                key={c}
                color={c}
                selected={color.toUpperCase() === c.toUpperCase()}
                onClick={() => setColor(c)}
              />
            ))}
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 shrink-0">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                title="Color personalizado"
              />
              <span className="text-xs font-mono text-gray-600 uppercase">{color}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#FC6621] text-white text-xs font-bold hover:bg-[#e05a1a] flex items-center gap-1 transition-colors"
          >
            {editingId ? (
              <>
                <Check className="w-3.5 h-3.5" /> Guardar Cambios
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Crear Etiqueta
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3. LISTA DE ETIQUETAS */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Etiquetas Existentes
        </p>

        {loading ? (
          <div className="h-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#FC6621] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50">
            No hay etiquetas creadas todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center justify-between p-3 border rounded-xl transition-all ${
                  tag.is_active
                    ? 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50/50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${tag.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {tag.label}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {tag.name}
                      </span>
                      {!tag.is_active && (
                        <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0">
                          Inactiva
                        </span>
                      )}
                    </div>
                    {tag.description && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {tag.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-4">
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="p-1.5 text-gray-400 hover:text-[#FC6621] rounded-lg hover:bg-orange-50 transition-colors"
                    title="Editar etiqueta"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(tag)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tag.is_active
                        ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={tag.is_active ? 'Desactivar etiqueta' : 'Reactivar etiqueta'}
                  >
                    {tag.is_active ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
