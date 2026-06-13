/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  GitBranch,
  FileText,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Plus,
  Activity,
  XCircle,
  CheckSquare,
  CreditCard,
  Truck,
  MapPin
} from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

const PRIORITY_STYLES = {
  low: { label: 'Baja', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  medium: { label: 'Media', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'Alta', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgente', color: 'bg-red-50 text-red-700 border-red-200' },
};

const TYPE_STYLES = {
  call: { label: 'Llamada', icon: Phone, color: 'text-blue-500' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
  quote_follow_up: { label: 'Cotización', icon: FileText, color: 'text-orange-500' },
  visit: { label: 'Visita', icon: MapPin, color: 'text-purple-500' },
  diagnosis: { label: 'Diagnóstico', icon: Activity, color: 'text-red-500' },
  payment: { label: 'Pago', icon: CreditCard, color: 'text-emerald-500' },
  delivery: { label: 'Entrega', icon: Truck, color: 'text-sky-500' },
  general: { label: 'General', icon: CheckSquare, color: 'text-gray-500' },
};

const ACTIVITY_ICONS = {
  stage_change: GitBranch,
  note_added: FileText,
  call_made: Phone,
  whatsapp_sent: MessageSquare,
  email_sent: Mail,
  follow_up: Clock,
  created: Plus,
  closed_won: CheckCircle,
  closed_lost: XCircle,
  other: Activity
};

// 10-line relative time helper function
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  if (diffSec < 60) return 'hace unos segundos';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHr < 24) return `hace ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
  if (diffDays === 1) return 'ayer';
  return `hace ${diffDays} días`;
}

export default function Dashboard({ onNavigateToContact, onNavigateToOpportunity }) {
  // Section loading states
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Section error states
  const [summaryError, setSummaryError] = useState(null);
  const [todayError, setTodayError] = useState(null);
  const [activityError, setActivityError] = useState(null);

  // Data states
  const [summary, setSummary] = useState(null);
  const [todayData, setTodayData] = useState({ overdue: [], today: [] });
  const [activity, setActivity] = useState([]);

  const formatMXN = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const loadData = () => {
    setLoadingSummary(true);
    setLoadingToday(true);
    setLoadingActivity(true);
    setSummaryError(null);
    setTodayError(null);
    setActivityError(null);

    // Fetch summary
    fetch(`${API_BASE_URL}/dashboard/summary`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar resumen');
        return res.json();
      })
      .then((data) => setSummary(data))
      .catch((err) => setSummaryError(err.message))
      .finally(() => setLoadingSummary(false));

    // Fetch today tasks
    fetch(`${API_BASE_URL}/dashboard/today`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar tareas urgentes');
        return res.json();
      })
      .then((data) => setTodayData(data))
      .catch((err) => setTodayError(err.message))
      .finally(() => setLoadingToday(false));

    // Fetch activity
    fetch(`${API_BASE_URL}/dashboard/activity`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar actividades');
        return res.json();
      })
      .then((data) => setActivity(data))
      .catch((err) => setActivityError(err.message))
      .finally(() => setLoadingActivity(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error al completar la tarea');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Max opportunities for pipeline progress bar
  const maxPipelineOpps = summary?.pipelines?.length > 0
    ? Math.max(...summary.pipelines.map((p) => p.open_count))
    : 1;

  return (
    <div className="space-y-8 p-1 bg-[#F5F5F5] min-h-screen text-text">
      {/* SECCIÓN 1 — Seguimientos urgentes (arriba, siempre visible) */}
      <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-6">
        <h2 className="font-heading font-bold text-base text-text uppercase tracking-wider">
          Seguimientos Urgentes
        </h2>

        {loadingToday ? (
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : todayError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded text-xs">
            {todayError}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vencidos Group */}
            {todayData.overdue.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Tareas Vencidas
                </h3>
                <div className="space-y-2.5">
                  {todayData.overdue.map((task) => {
                    const typeStyle = TYPE_STYLES[task.task_type] || TYPE_STYLES.general;
                    const Icon = typeStyle.icon;
                    const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

                    return (
                      <div
                        key={task.id}
                        className="p-4 bg-red-50/20 border border-red-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icon className={`w-4 h-4 shrink-0 ${typeStyle.color}`} />
                            <span className="font-bold text-text truncate">{task.title}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${priorityStyle.color}`}
                            >
                              {priorityStyle.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-x-3 gap-y-1 text-xs text-textMuted flex-wrap font-medium">
                            {task.due_date && (
                              <span className="text-red-600 font-bold">
                                Venció:{' '}
                                {new Date(task.due_date).toLocaleString('es-MX', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                            {task.contact_name && (
                              <span>
                                Contacto:{' '}
                                <span className="font-semibold text-text">{task.contact_name}</span>
                              </span>
                            )}
                            {task.opportunity_title && (
                              <span>
                                Oportunidad:{' '}
                                <span className="font-semibold text-text">
                                  {task.opportunity_title}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Completar
                          </button>
                          {task.contact_id && onNavigateToContact && (
                            <button
                              onClick={() => onNavigateToContact(task.contact_id)}
                              className="px-3 py-1.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Ver contacto
                            </button>
                          )}
                          {task.opportunity_id && onNavigateToOpportunity && (
                            <button
                              onClick={() => onNavigateToOpportunity(task.opportunity_id)}
                              className="px-3 py-1.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Ver oportunidad
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hoy Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">
                Tareas de Hoy
              </h3>
              {todayData.today.length === 0 ? (
                <div className="p-4 border border-dashed border-border rounded-lg text-center text-xs text-textMuted font-medium">
                  Sin seguimientos para hoy
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayData.today.map((task) => {
                    const typeStyle = TYPE_STYLES[task.task_type] || TYPE_STYLES.general;
                    const Icon = typeStyle.icon;
                    const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

                    return (
                      <div
                        key={task.id}
                        className="p-4 bg-white border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/20 transition-colors"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icon className={`w-4 h-4 shrink-0 ${typeStyle.color}`} />
                            <span className="font-bold text-text truncate">{task.title}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${priorityStyle.color}`}
                            >
                              {priorityStyle.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-x-3 gap-y-1 text-xs text-textMuted flex-wrap font-medium">
                            {task.due_date && (
                              <span className={task.is_overdue ? 'text-red-600 font-bold' : ''}>
                                Vence:{' '}
                                {new Date(task.due_date).toLocaleString('es-MX', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                            {task.contact_name && (
                              <span>
                                Contacto:{' '}
                                <span className="font-semibold text-text">{task.contact_name}</span>
                              </span>
                            )}
                            {task.opportunity_title && (
                              <span>
                                Oportunidad:{' '}
                                <span className="font-semibold text-text">
                                  {task.opportunity_title}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Completar
                          </button>
                          {task.contact_id && onNavigateToContact && (
                            <button
                              onClick={() => onNavigateToContact(task.contact_id)}
                              className="px-3 py-1.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Ver contacto
                            </button>
                          )}
                          {task.opportunity_id && onNavigateToOpportunity && (
                            <button
                              onClick={() => onNavigateToOpportunity(task.opportunity_id)}
                              className="px-3 py-1.5 border border-border bg-white text-text hover:bg-gray-50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Ver oportunidad
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 2 — Métricas rápidas */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : summaryError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded text-xs border border-red-100">
          {summaryError}
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Vencidos */}
            <div
              className={`p-6 rounded-lg border bg-white shadow-sm flex flex-col justify-between ${
                summary.overdue_tasks > 0
                  ? 'bg-red-50/50 border-red-200 text-red-700'
                  : 'border-border text-text'
              }`}
            >
              <span className="text-3xl font-bold tracking-tight">{summary.overdue_tasks}</span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider mt-2">
                Seguimientos vencidos
              </span>
            </div>

            {/* Card 2: Hoy */}
            <div className="p-6 rounded-lg border border-border bg-white shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-bold tracking-tight">{summary.today_tasks}</span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider mt-2">
                Seguimientos hoy
              </span>
            </div>

            {/* Card 3: Abiertas */}
            <div className="p-6 rounded-lg border border-border bg-white shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-bold tracking-tight">
                {summary.open_opportunities}
              </span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider mt-2">
                Oportunidades abiertas
              </span>
            </div>

            {/* Card 4: Valor */}
            <div className="p-6 rounded-lg border border-border bg-white shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-bold tracking-tight">
                {formatMXN(summary.open_value)}
              </span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider mt-2">
                Valor estimado abierto
              </span>
            </div>

            {/* Card 5: Contactos */}
            <div className="p-6 rounded-lg border border-border bg-white shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-bold tracking-tight">{summary.active_contacts}</span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider mt-2">
                Contactos activos
              </span>
            </div>

            {/* Card 6: Ganadas / Perdidas */}
            <div className="p-6 rounded-lg border border-border bg-white shadow-sm flex flex-col justify-between">
              <span className="text-3xl font-bold tracking-tight">
                {summary.won_opportunities} / {summary.lost_opportunities}
              </span>
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider mt-2">
                Ganadas / Perdidas
              </span>
            </div>
          </div>
        )
      )}

      {/* Grid for Pipelines, Stages, and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column Left (Pipelines & Stages) */}
        <div className="lg:col-span-2 space-y-8">
          {/* SECCIÓN 3 — Oportunidades por pipeline */}
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-text uppercase tracking-wider">
              Oportunidades por Pipeline
            </h3>

            {loadingSummary ? (
              <div className="space-y-3">
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : summaryError ? (
              <p className="text-xs text-red-500">{summaryError}</p>
            ) : summary?.pipelines?.length === 0 ? (
              <p className="text-xs text-textMuted font-medium">Sin datos de pipelines</p>
            ) : (
              <div className="space-y-4">
                {summary?.pipelines?.map((p) => {
                  const percent = (p.open_count / maxPipelineOpps) * 100;
                  return (
                    <div key={p.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <div className="font-bold text-text">{p.name}</div>
                        <div className="text-textMuted flex items-center gap-2">
                          <span className="font-bold text-text">
                            {p.open_count} {p.open_count === 1 ? 'oportunidad' : 'oportunidades'}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-primary">{formatMXN(p.open_value)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 4 — Oportunidades por etapa */}
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-text uppercase tracking-wider">
              Oportunidades por Etapa
            </h3>

            {loadingSummary ? (
              <div className="space-y-2">
                <div className="h-5 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : summaryError ? (
              <p className="text-xs text-red-500">{summaryError}</p>
            ) : summary?.stages?.length === 0 ? (
              <p className="text-xs text-textMuted font-medium">Sin datos de etapas</p>
            ) : (
              <div className="divide-y divide-border/60">
                {summary?.stages?.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <span className="text-xs font-semibold text-text">{s.stage_name}</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full uppercase tracking-wider">
                      {s.count} {s.count === 1 ? 'op.' : 'ops.'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column Right (Activity Feed) */}
        <div className="lg:col-span-1">
          {/* SECCIÓN 5 — Última actividad */}
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-text uppercase tracking-wider">
              Última Actividad
            </h3>

            {loadingActivity ? (
              <div className="space-y-4">
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : activityError ? (
              <div className="p-3 bg-red-50 text-red-600 rounded text-xs">
                {activityError}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-xs text-textMuted font-medium text-center py-6">
                Sin actividades registradas
              </p>
            ) : (
              <div className="relative border-l border-border/80 ml-2.5 pl-5 space-y-6">
                {activity.map((act) => {
                  const Icon = ACTIVITY_ICONS[act.action_type] || ACTIVITY_ICONS.other;
                  return (
                    <div key={act.id} className="relative text-xs">
                      {/* Left timeline icon connector */}
                      <span className="absolute -left-[29px] top-0.5 bg-white p-1 rounded-full border border-border">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </span>

                      <div className="space-y-1">
                        <p className="text-text font-medium leading-relaxed">
                          {act.description || 'Actividad comercial'}
                        </p>
                        {act.opportunity_title && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold">
                            <span className="text-textMuted">Oportunidad:</span>
                            {onNavigateToOpportunity ? (
                              <button
                                onClick={() => onNavigateToOpportunity(act.opportunity_id)}
                                className="text-primary hover:underline text-left"
                              >
                                {act.opportunity_title}
                              </button>
                            ) : (
                              <span className="text-text">{act.opportunity_title}</span>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-textMuted font-semibold">
                          {getRelativeTime(act.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
