import { useState, useEffect, useRef } from 'react';
import { fetchConversations, fetchDepartments } from '../../lib/api';
import ConversationList from './ConversationList';
import ConversationDetail from './ConversationDetail';

export default function ConversationsPage({ onNavigateToContact }) {
  const [conversations, setConversations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const loadDepts = async () => {
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch {}
  };

  const loadConvs = async () => {
    try {
      const data = await fetchConversations({ size: 50 });
      setConversations(data);
      // Keep selected fresh
      if (selected) {
        const fresh = data.find(c => c.id === selected.id);
        if (fresh) setSelected(prev => ({ ...prev, ...fresh }));
      }
    } catch {}
  };

  useEffect(() => {
    loadDepts();
    loadConvs().finally(() => setLoading(false));

    // Polling cada 5s
    pollRef.current = setInterval(loadConvs, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleSelect = (conv) => setSelected(conv);

  const handleUpdate = (updated) => {
    setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setSelected(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  };

  return (
    <div className="flex h-full w-full min-h-0">
      <ConversationList
        conversations={conversations}
        departments={departments}
        loading={loading}
        selectedId={selected?.id}
        onSelect={handleSelect}
      />
      <ConversationDetail
        conversation={selected}
        departments={departments}
        onUpdate={handleUpdate}
        onNavigateToContact={onNavigateToContact}
      />
    </div>
  );
}
