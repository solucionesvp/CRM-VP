import { useState, useMemo } from 'react';
import { Search, Bot, User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'bot', label: 'Bot activo' },
  { id: 'human', label: 'Asignadas' },
  { id: 'unassigned', label: 'Sin asignar' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
  } catch { return ''; }
}

function ConversationItem({ conv, isSelected, onClick, departments }) {
  const contact = conv.contact;
  const initial = contact?.name?.[0]?.toUpperCase() || '?';
  const dept = departments?.find(d => d.slug === conv.assigned_department);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-orange-50/60 transition-colors flex items-start gap-3 ${
        isSelected ? 'bg-orange-50 border-l-2 border-l-[#FC6621]' : 'border-l-2 border-l-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FC6621]/20 to-[#FC6621]/40 text-[#FC6621] font-bold text-sm flex items-center justify-center">
          {initial}
        </div>
        {conv.bot_active && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <Bot className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="font-semibold text-sm text-gray-900 truncate">{contact?.name || conv.channel_identifier}</span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(conv.last_message_at || conv.created_at)}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{conv.last_message_preview || 'Sin mensajes'}</p>
        <div className="flex items-center gap-2 mt-1">
          {dept && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: dept.color + '20', color: dept.color }}>
              {dept.name}
            </span>
          )}
          {conv.unread_count > 0 && (
            <span className="ml-auto text-[10px] bg-[#FC6621] text-white font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ConversationList({ conversations, loading, selectedId, onSelect, departments }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = conversations;
    if (tab === 'bot') list = list.filter(c => c.bot_active);
    else if (tab === 'human') list = list.filter(c => c.assigned_to_user_id);
    else if (tab === 'unassigned') list = list.filter(c => !c.assigned_to_user_id && !c.bot_active);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.contact?.name?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q) ||
        c.channel_identifier?.includes(q)
      );
    }
    return list;
  }, [conversations, tab, search]);

  return (
    <div className="w-[300px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <h2 className="font-bold text-sm text-gray-900 mb-3">Conversaciones</h2>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar contacto o mensaje..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FC6621]/30 bg-gray-50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2 text-[11px] font-semibold transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'text-[#FC6621] border-b-2 border-[#FC6621] bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-[#FC6621]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-12 px-4">
            {search ? 'Sin resultados para tu búsqueda' : 'No hay conversaciones aún'}
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv)}
              departments={departments}
            />
          ))
        )}
      </div>
    </div>
  );
}
