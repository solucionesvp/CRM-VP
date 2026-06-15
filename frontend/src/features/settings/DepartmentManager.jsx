import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../lib/api';

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

export default function DepartmentManager() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id, name, color, description }
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', color: '#FC6621', description: '' });

  const load = async () => {
    setLoading(true);
    try { setDepts(await fetchDepartments()); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: '', slug: '', color: '#FC6621', description: '' });
  };

  const startEdit = (dept) => {
    setEditing(dept);
    setCreating(false);
    setForm({ name: dept.name, slug: dept.slug, color: dept.color || '#FC6621', description: dept.description || '' });
  };

  const handleSave = async () => {
    if (!form.name) return;
    if (creating) {
      if (!form.slug) return;
      await createDepartment({ name: form.name, slug: form.slug, color: form.color, description: form.description });
    } else if (editing) {
      await updateDepartment(editing.id, { name: form.name, color: form.color, description: form.description });
    }
    setCreating(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este departamento?')) return;
    await deleteDepartment(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900">Departamentos</h3>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#FC6621] text-white rounded-lg hover:bg-[#e05a1a]"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <div className="border border-[#FC6621]/30 bg-orange-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-[#FC6621]">{creating ? 'Nuevo departamento' : 'Editar departamento'}</p>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nombre *"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
          />
          {creating && (
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              placeholder="Slug (identificador único) *"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
            />
          )}
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descripción (opcional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
          />
          <div>
            <p className="text-xs text-gray-500 mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <ColorDot key={c} color={c} selected={form.color === c} onClick={() => setForm(f => ({ ...f, color: c }))} />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-6 h-6 rounded cursor-pointer border-0"
                title="Color personalizado"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setCreating(false); setEditing(null); }} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button onClick={handleSave} className="flex-1 py-1.5 rounded-lg bg-[#FC6621] text-white text-sm font-semibold hover:bg-[#e05a1a] flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Department list */}
      {loading ? (
        <div className="h-12 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#FC6621] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {depts.map(dept => (
            <div key={dept.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: dept.color || '#ccc' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                <p className="text-xs text-gray-400">{dept.slug} {dept.description && `• ${dept.description}`}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(dept)} className="p-1.5 text-gray-400 hover:text-[#FC6621] rounded-lg hover:bg-orange-50">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
