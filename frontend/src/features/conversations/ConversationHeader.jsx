import { useState } from 'react';
import { X, UserCheck, ChevronDown, ExternalLink, Plus } from 'lucide-react';
import { updateConversation, assignConversation, createConversationOpportunity } from '../../lib/api';
import { fetchPipelines } from '../../lib/api';

const STATUS_LABELS = { open: 'Abierta', assigned: 'Asignada', pending: 'Pendiente', closed: 'Cerrada' };
const STATUS_COLORS = { open: 'bg-green-100 text-green-700', assigned: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700', closed: 'bg-gray-100 text-gray-500' };

export default function ConversationHeader({ conversation, departments, onUpdate, onNavigateToContact }) {
  const [showOppModal, setShowOppModal] = useState(false);
  const [oppForm, setOppForm] = useState({ title: '', product_interest: '', pipeline_id: '' });
  const [pipelines, setPipelines] = useState([]);
  const [oppLoading, setOppLoading] = useState(false);

  const contact = conversation?.contact;
  const status = conversation?.status || 'open';

  const openOppModal = async () => {
    setShowOppModal(true);
    try {
      const data = await fetchPipelines();
      setPipelines(data);
      if (data.length) setOppForm(f => ({ ...f, pipeline_id: data[0].id }));
    } catch {}
  };

  const handleToggleBot = async () => {
    try {
      const updated = await updateConversation(conversation.id, { bot_active: !conversation.bot_active });
      onUpdate(updated);
    } catch (e) { console.error(e); }
  };

  const handleDeptChange = async (e) => {
    const dept = e.target.value;
    try {
      const updated = await assignConversation(conversation.id, dept || null, null);
      onUpdate(updated);
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (e) => {
    try {
      const updated = await updateConversation(conversation.id, { status: e.target.value });
      onUpdate(updated);
    } catch (e) { console.error(e); }
  };

  const handleCreateOpp = async () => {
    if (!oppForm.title || !oppForm.pipeline_id) return;
    setOppLoading(true);
    try {
      await createConversationOpportunity(conversation.id, {
        pipeline_id: Number(oppForm.pipeline_id),
        title: oppForm.title,
        product_interest: oppForm.product_interest || oppForm.title,
      });
      setShowOppModal(false);
      setOppForm({ title: '', product_interest: '', pipeline_id: pipelines[0]?.id || '' });
    } catch (e) { console.error(e); } finally { setOppLoading(false); }
  };

  if (!conversation) return null;

  const dept = departments.find(d => d.slug === conversation.assigned_department);

  return (
    <>
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-4 flex-wrap">
        {/* Contact info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FC6621]/10 text-[#FC6621] font-bold text-sm flex items-center justify-center flex-shrink-0">
              {contact?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{contact?.name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-500">{conversation.channel_identifier}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status */}
          <select
            value={status}
            onChange={handleStatusChange}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-1 focus:ring-[#FC6621]/30 ${STATUS_COLORS[status]}`}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {/* Department */}
          <div className="relative">
            <select
              value={conversation.assigned_department || ''}
              onChange={handleDeptChange}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30 appearance-none bg-white"
              style={dept ? { borderColor: dept.color, color: dept.color } : {}}
            >
              <option value="">Sin departamento</option>
              {departments.map(d => (
                <option key={d.id} value={d.slug}>{d.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
          </div>

          {/* Bot toggle */}
          <button
            onClick={handleToggleBot}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              conversation.bot_active
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${conversation.bot_active ? 'bg-orange-500' : 'bg-gray-400'}`} />
            Bot {conversation.bot_active ? 'activo' : 'inactivo'}
          </button>

          {/* View contact */}
          {contact && (
            <button
              onClick={() => onNavigateToContact?.(contact.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#FC6621] transition-colors"
              title="Ver contacto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Create opportunity */}
          <button
            onClick={openOppModal}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#FC6621] text-white rounded-lg hover:bg-[#e05a1a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Oportunidad
          </button>
        </div>
      </div>

      {/* Create opportunity modal */}
      {showOppModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Nueva oportunidad</h3>
              <button onClick={() => setShowOppModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Pipeline</label>
                <select
                  value={oppForm.pipeline_id}
                  onChange={e => setOppForm(f => ({ ...f, pipeline_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
                >
                  {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Título</label>
                <input
                  value={oppForm.title}
                  onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Cotización bomba de agua"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Interés / Producto</label>
                <input
                  value={oppForm.product_interest}
                  onChange={e => setOppForm(f => ({ ...f, product_interest: e.target.value }))}
                  placeholder="Ej: Bomba centrífuga 3HP"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowOppModal(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleCreateOpp}
                disabled={oppLoading || !oppForm.title}
                className="flex-1 py-2 rounded-lg bg-[#FC6621] text-white text-sm font-semibold hover:bg-[#e05a1a] disabled:opacity-50"
              >
                {oppLoading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
