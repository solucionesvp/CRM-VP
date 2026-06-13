/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Plus, GitBranch, FileText, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

const ICONS_CONFIG = {
  created: { icon: Plus, color: 'text-green-500 bg-green-50 border-green-100' },
  stage_change: { icon: GitBranch, color: 'text-orange-500 bg-orange-50 border-orange-100' },
  note_added: { icon: FileText, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  closed_won: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  closed_lost: { icon: XCircle, color: 'text-red-500 bg-red-50 border-red-100' },
  follow_up: { icon: Clock, color: 'text-gray-500 bg-gray-50 border-gray-200' },
  other: { icon: Activity, color: 'text-gray-400 bg-gray-50 border-gray-100' },
};

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

export default function OpportunityActivityFeed({ opportunityId, onRef }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadActivities = () => {
    if (!opportunityId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/opportunities/${opportunityId}/activities`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar el historial de actividades');
        return res.json();
      })
      .then((data) => setActivities(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  useEffect(() => {
    if (onRef) {
      onRef(loadActivities);
    }
    return () => {
      if (onRef) onRef(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRef, opportunityId]);

  if (loading) {
    return (
      <div className="space-y-4 py-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gray-100" />
            <div className="space-y-1.5 flex-1 py-1">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-2 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 text-red-600 rounded text-xs border border-red-100 my-2">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-xs text-textMuted font-medium py-4 text-center">
        Sin actividad registrada
      </p>
    );
  }

  return (
    <div className="relative border-l border-border/80 ml-3.5 pl-6 py-2 space-y-6">
      {activities.map((act) => {
        const config = ICONS_CONFIG[act.action_type] || ICONS_CONFIG.other;
        const Icon = config.icon;

        return (
          <div key={act.id} className="relative text-xs">
            {/* Left timeline connector and icon */}
            <span
              className={`absolute -left-[38px] top-0.5 p-1 rounded-full border shrink-0 ${config.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-text leading-relaxed">
                  {act.display_text}
                </span>
                {!act.is_system && act.action_type === 'note_added' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded uppercase tracking-wider">
                    Manual
                  </span>
                )}
              </div>
              {act.description && act.action_type !== 'follow_up' && (
                <p className="text-textMuted font-medium">{act.description}</p>
              )}
              <p className="text-[10px] text-textMuted font-semibold">
                {getRelativeTime(act.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
