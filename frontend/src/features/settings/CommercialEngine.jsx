import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sliders, FileText, ToggleLeft, ToggleRight, Sparkles, AlertCircle, Info, HelpCircle } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

const CATEGORY_LABELS = {
  primer_contacto: 'Primer Contacto',
  seguimiento: 'Seguimiento',
  cotizacion: 'Cotización',
  diagnostico: 'Diagnóstico',
  entrega: 'Entrega',
  general: 'General'
};

const ACTION_LABELS = {
  create_task: 'Crear Tarea',
  suggest_reply: 'Sugerir Respuesta',
  notify: 'Notificación'
};

const TASK_TYPE_LABELS = {
  call: 'Llamada',
  whatsapp: 'WhatsApp',
  quote_follow_up: 'Cotización',
  visit: 'Visita',
  diagnosis: 'Diagnóstico',
  payment: 'Pago',
  delivery: 'Entrega',
  general: 'General'
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

export default function CommercialEngine() {
  const [subTab, setSubTab] = useState('quick_replies');
  
  // Lists
  const [quickReplies, setQuickReplies] = useState([]);
  const [stageRules, setStageRules] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');

  // Modals / Forms
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingQR, setEditingQR] = useState(null);
  const [qrForm, setQrForm] = useState({
    name: '',
    category: 'general',
    content: '',
    tags: '',
    is_active: true
  });

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    pipeline_id: '',
    stage_id: '',
    trigger_event: 'on_enter',
    action_type: 'create_task',
    task_type: 'general',
    task_title_template: '',
    quick_reply_id: '',
    priority: 'medium',
    description: '',
    is_active: true
  });

  // Selected Pipeline's stages (for Stage Rule Form)
  const [formStages, setFormStages] = useState([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all catalogs on mount
  useEffect(() => {
    loadPipelines();
    loadQuickReplies();
    loadStageRules();
  }, []);

  const loadPipelines = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/pipelines/`);
      if (res.ok) {
        const data = await res.json();
        setPipelines(data);
        if (data.length > 0) {
          setPipelineFilter(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error loading pipelines:', err);
    }
  };

  const loadQuickReplies = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = categoryFilter 
        ? `${API_BASE_URL}/quick-replies/?category=${categoryFilter}`
        : `${API_BASE_URL}/quick-replies/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener plantillas');
      const data = await res.json();
      setQuickReplies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStageRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = pipelineFilter 
        ? `${API_BASE_URL}/stage-rules/?pipeline_id=${pipelineFilter}`
        : `${API_BASE_URL}/stage-rules/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener reglas');
      const data = await res.json();
      setStageRules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuickReplies();
  }, [categoryFilter]);

  useEffect(() => {
    loadStageRules();
  }, [pipelineFilter]);

  // Load stages for Rule Form when pipeline changes
  const loadFormStages = async (pipelineId) => {
    if (!pipelineId) {
      setFormStages([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/stages/?pipeline_id=${pipelineId}`);
      if (res.ok) {
        const data = await res.json();
        setFormStages(data);
      }
    } catch (err) {
      console.error('Error loading stages for form:', err);
    }
  };

  // Handle Quick Reply CRUD Actions
  const handleOpenQRModal = (qr = null) => {
    if (qr) {
      setEditingQR(qr);
      setQrForm({
        name: qr.name,
        category: qr.category,
        content: qr.content,
        tags: qr.tags || '',
        is_active: qr.is_active
      });
    } else {
      setEditingQR(null);
      setQrForm({
        name: '',
        category: 'general',
        content: '',
        tags: '',
        is_active: true
      });
    }
    setShowQRModal(true);
  };

  const handleSaveQR = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const method = editingQR ? 'PATCH' : 'POST';
      const url = editingQR 
        ? `${API_BASE_URL}/quick-replies/${editingQR.id}`
        : `${API_BASE_URL}/quick-replies/`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qrForm)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar respuesta rápida');
      }
      setShowQRModal(false);
      loadQuickReplies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteQR = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta respuesta rápida?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/quick-replies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadQuickReplies();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Stage Rule CRUD Actions
  const handleOpenRuleModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        pipeline_id: rule.pipeline_id.toString(),
        stage_id: rule.stage_id.toString(),
        trigger_event: rule.trigger_event,
        action_type: rule.action_type,
        task_type: rule.task_type || 'general',
        task_title_template: rule.task_title_template || '',
        quick_reply_id: rule.quick_reply_id ? rule.quick_reply_id.toString() : '',
        priority: rule.priority,
        description: rule.description || '',
        is_active: rule.is_active
      });
      loadFormStages(rule.pipeline_id);
    } else {
      setEditingRule(null);
      const defaultPipeline = pipelines[0]?.id?.toString() || '';
      setRuleForm({
        pipeline_id: defaultPipeline,
        stage_id: '',
        trigger_event: 'on_enter',
        action_type: 'create_task',
        task_type: 'general',
        task_title_template: '',
        quick_reply_id: '',
        priority: 'medium',
        description: '',
        is_active: true
      });
      loadFormStages(defaultPipeline);
    }
    setShowRuleModal(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Validate conditional fields
      if (ruleForm.action_type === 'create_task' && !ruleForm.task_type) {
        throw new Error('El tipo de tarea es requerido para acciones de tipo Crear Tarea');
      }
      if (ruleForm.action_type === 'suggest_reply' && !ruleForm.quick_reply_id) {
        throw new Error('La plantilla de respuesta rápida es requerida para acciones de tipo Sugerir Respuesta');
      }

      const payload = {
        pipeline_id: parseInt(ruleForm.pipeline_id),
        stage_id: parseInt(ruleForm.stage_id),
        trigger_event: ruleForm.trigger_event,
        action_type: ruleForm.action_type,
        task_type: ruleForm.action_type === 'create_task' ? ruleForm.task_type : null,
        task_title_template: ruleForm.action_type === 'create_task' ? ruleForm.task_title_template : null,
        quick_reply_id: ruleForm.action_type === 'suggest_reply' ? parseInt(ruleForm.quick_reply_id) : null,
        priority: ruleForm.action_type === 'create_task' ? ruleForm.priority : 'medium',
        description: ruleForm.description || null,
        is_active: ruleForm.is_active
      };

      const method = editingRule ? 'PATCH' : 'POST';
      const url = editingRule 
        ? `${API_BASE_URL}/stage-rules/${editingRule.id}`
        : `${API_BASE_URL}/stage-rules/`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al guardar la regla');
      }
      setShowRuleModal(false);
      loadStageRules();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta regla?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/stage-rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadStageRules();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => { setSubTab('quick_replies'); setError(null); }}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
            subTab === 'quick_replies'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-white text-textMuted border-border hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Respuestas Rápidas
        </button>
        <button
          onClick={() => { setSubTab('stage_rules'); setError(null); }}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
            subTab === 'stage_rules'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-white text-textMuted border-border hover:bg-gray-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Reglas por Etapa
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* Pestaña 1: Respuestas Rápidas */}
      {subTab === 'quick_replies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Filter Category */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-textMuted uppercase">Filtrar Categoría:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-border rounded text-xs font-bold uppercase cursor-pointer"
              >
                <option value="">Todas</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenQRModal()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Respuesta
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-textMuted font-bold">
              Cargando plantillas...
            </div>
          ) : quickReplies.length === 0 ? (
            <div className="py-12 border border-dashed rounded-lg text-center text-xs text-textMuted font-semibold bg-background/50">
              No hay respuestas rápidas registradas en esta categoría.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-background text-textMuted font-bold uppercase border-b border-border">
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Categoría</th>
                    <th className="px-5 py-3">Vista Previa</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {quickReplies.map((qr) => (
                    <tr key={qr.id} className="hover:bg-primary/[0.01]">
                      <td className="px-5 py-3 font-bold text-text">{qr.name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 border bg-orange-50 border-orange-200/50 text-primary rounded text-[9px] font-bold uppercase">
                          {CATEGORY_LABELS[qr.category]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-textMuted max-w-sm truncate" title={qr.content}>
                        {qr.preview}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${
                          qr.is_active 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-gray-100 border-gray-300 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${qr.is_active ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                          {qr.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenQRModal(qr)}
                            className="p-1 text-textMuted hover:text-primary hover:bg-gray-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQR(qr.id)}
                            className="p-1 text-textMuted hover:text-red-600 hover:bg-gray-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pestaña 2: Reglas por Etapa */}
      {subTab === 'stage_rules' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-orange-50/50 border border-orange-200/40 rounded flex items-start gap-2 text-xs text-textMuted leading-relaxed">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-text">Reglas de Automatización:</span> Define qué acciones ejecuta el sistema automáticamente cuando una oportunidad cambia o entra a una determinada etapa de tu pipeline.
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Filter Pipeline */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-textMuted uppercase">Seleccionar Pipeline:</span>
              <select
                value={pipelineFilter}
                onChange={(e) => setPipelineFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-border rounded text-xs font-bold uppercase cursor-pointer"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenRuleModal()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Regla
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-textMuted font-bold">
              Cargando reglas...
            </div>
          ) : stageRules.length === 0 ? (
            <div className="py-12 border border-dashed rounded-lg text-center text-xs text-textMuted font-semibold bg-background/50">
              No hay reglas de automatización configuradas para este pipeline.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-background text-textMuted font-bold uppercase border-b border-border">
                    <th className="px-5 py-3">Pipeline</th>
                    <th className="px-5 py-3">Etapa</th>
                    <th className="px-5 py-3">Acción Automática</th>
                    <th className="px-5 py-3">Detalle</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {stageRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-primary/[0.01]">
                      <td className="px-5 py-3 font-bold text-text">{rule.pipeline?.name}</td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-text flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: rule.stage?.color || '#D1D5DB' }} />
                          {rule.stage?.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 border bg-orange-50 border-orange-200/50 text-primary rounded text-[9px] font-bold uppercase">
                          {ACTION_LABELS[rule.action_type]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-textMuted">
                        {rule.action_type === 'create_task' && (
                          <span>
                            Auto-crear {TASK_TYPE_LABELS[rule.task_type]}: <strong>{rule.task_title_template}</strong> ({PRIORITY_LABELS[rule.priority]})
                          </span>
                        )}
                        {rule.action_type === 'suggest_reply' && (
                          <span>Sugerir plantilla: <strong>{rule.quick_reply?.name || 'Respuesta rápida'}</strong></span>
                        )}
                        {rule.action_type === 'notify' && (
                          <span>Notificación interna {rule.description && `• ${rule.description}`}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${
                          rule.is_active 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-gray-100 border-gray-300 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                          {rule.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRuleModal(rule)}
                            className="p-1 text-textMuted hover:text-primary hover:bg-gray-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 text-textMuted hover:text-red-600 hover:bg-gray-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- QUICK REPLY MODAL FORM --- */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl p-6 relative">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider border-b pb-3 mb-4">
              {editingQR ? 'Editar Respuesta Rápida' : 'Nueva Respuesta Rápida'}
            </h3>
            
            <form onSubmit={handleSaveQR} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-textMuted uppercase mb-1">Nombre de Plantilla</label>
                <input
                  type="text"
                  required
                  value={qrForm.name}
                  onChange={(e) => setQrForm({ ...qrForm, name: e.target.value })}
                  placeholder="Ej: Cotización CCTV Evans"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-textMuted uppercase mb-1">Categoría</label>
                <select
                  value={qrForm.category}
                  onChange={(e) => setQrForm({ ...qrForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text cursor-pointer font-medium"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-textMuted uppercase mb-1">Contenido de la Respuesta</label>
                <textarea
                  required
                  rows={4}
                  value={qrForm.content}
                  onChange={(e) => setQrForm({ ...qrForm, content: e.target.value })}
                  placeholder="Ej: Estimado {nombre}, le adjunto la cotización de {producto} para {empresa}..."
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary resize-none font-medium leading-relaxed"
                />
                <span className="text-[10px] text-textMuted mt-1 block font-medium">
                  Variables dinámicas: <code className="bg-gray-100 px-1 py-0.5 rounded font-bold text-primary">{`{nombre}`}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded font-bold text-primary">{`{empresa}`}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded font-bold text-primary">{`{producto}`}</code>
                </span>
              </div>

              <div>
                <label className="block text-textMuted uppercase mb-1">Tags (Etiquetas de búsqueda)</label>
                <input
                  type="text"
                  value={qrForm.tags}
                  onChange={(e) => setQrForm({ ...qrForm, tags: e.target.value })}
                  placeholder="Ej: cctv, mantenimiento, evans (separado por coma)"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQrForm({ ...qrForm, is_active: !qrForm.is_active })}
                  className="p-1 focus:outline-none"
                >
                  {qrForm.is_active ? (
                    <ToggleRight className="w-8 h-8 text-primary" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
                <span className="text-xs text-text">Activar respuesta rápida para uso comercial</span>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 border border-border bg-white text-text hover:bg-gray-50 rounded uppercase tracking-wider font-bold text-[10px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded uppercase tracking-wider font-bold text-[10px] shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STAGE RULE MODAL FORM --- */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl p-6 relative">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider border-b pb-3 mb-4">
              {editingRule ? 'Editar Regla por Etapa' : 'Nueva Regla por Etapa'}
            </h3>
            
            <form onSubmit={handleSaveRule} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-textMuted uppercase mb-1">Pipeline de Venta</label>
                <select
                  required
                  value={ruleForm.pipeline_id}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, pipeline_id: e.target.value, stage_id: '' });
                    loadFormStages(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text cursor-pointer font-medium"
                >
                  <option value="" disabled>Selecciona pipeline...</option>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-textMuted uppercase mb-1">Etapa Disparadora</label>
                <select
                  required
                  value={ruleForm.stage_id}
                  onChange={(e) => setRuleForm({ ...ruleForm, stage_id: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text cursor-pointer font-medium"
                  disabled={!ruleForm.pipeline_id}
                >
                  <option value="" disabled>Selecciona etapa...</option>
                  {formStages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-textMuted uppercase mb-1">Tipo de Acción Automática</label>
                <select
                  value={ruleForm.action_type}
                  onChange={(e) => setRuleForm({ ...ruleForm, action_type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text cursor-pointer font-medium"
                >
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* ACTION TYPE: CREATE TASK */}
              {ruleForm.action_type === 'create_task' && (
                <div className="space-y-4 p-3 bg-gray-50 border border-border rounded-lg animate-fadeIn">
                  <div>
                    <label className="block text-textMuted uppercase mb-1">Tipo de Tarea</label>
                    <select
                      value={ruleForm.task_type}
                      onChange={(e) => setRuleForm({ ...ruleForm, task_type: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded text-text cursor-pointer font-medium"
                    >
                      {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-textMuted uppercase mb-1">Plantilla de Título de la Tarea</label>
                    <input
                      type="text"
                      required
                      value={ruleForm.task_title_template}
                      onChange={(e) => setRuleForm({ ...ruleForm, task_title_template: e.target.value })}
                      placeholder="Ej: Llamar a {nombre} para cotización"
                      className="w-full px-3 py-1.5 bg-white border border-border rounded text-text focus:outline-none focus:border-primary font-medium"
                    />
                    <span className="text-[9px] text-textMuted mt-1 block">
                      Puedes usar placeholders: `{`{nombre}`}`, `{`{empresa}`}`, `{`{producto}`}`.
                    </span>
                  </div>

                  <div>
                    <label className="block text-textMuted uppercase mb-1">Prioridad</label>
                    <select
                      value={ruleForm.priority}
                      onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded text-text cursor-pointer font-medium"
                    >
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ACTION TYPE: SUGGEST REPLY */}
              {ruleForm.action_type === 'suggest_reply' && (
                <div className="p-3 bg-gray-50 border border-border rounded-lg animate-fadeIn">
                  <label className="block text-textMuted uppercase mb-1">Plantilla de Respuesta Rápida</label>
                  <select
                    required
                    value={ruleForm.quick_reply_id}
                    onChange={(e) => setRuleForm({ ...ruleForm, quick_reply_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-border rounded text-text cursor-pointer font-medium"
                  >
                    <option value="" disabled>Selecciona plantilla...</option>
                    {quickReplies.filter(qr => qr.is_active).map((qr) => (
                      <option key={qr.id} value={qr.id}>{qr.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-textMuted uppercase mb-1">Descripción Interna (Propósito)</label>
                <input
                  type="text"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  placeholder="Ej: Regla para cotización rápida Evans"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRuleForm({ ...ruleForm, is_active: !ruleForm.is_active })}
                  className="p-1 focus:outline-none"
                >
                  {ruleForm.is_active ? (
                    <ToggleRight className="w-8 h-8 text-primary" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
                <span className="text-xs text-text">Regla activa</span>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 border border-border bg-white text-text hover:bg-gray-50 rounded uppercase tracking-wider font-bold text-[10px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded uppercase tracking-wider font-bold text-[10px] shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
