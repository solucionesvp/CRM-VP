import { useEffect, useRef, useState } from 'react';
import { fetchConversationMessages, sendConversationMessage, updateConversation } from '../../lib/api';
import MessageBubble, { DateSeparator } from './MessageBubble';
import ConversationHeader from './ConversationHeader';
import ReplyBox from './ReplyBox';
import { MessageSquare } from 'lucide-react';
import { isSameDay } from 'date-fns';

export default function ConversationDetail({ conversation, departments, onUpdate, onNavigateToContact }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const loadMessages = async () => {
    if (!conversation?.id) return;
    try {
      const data = await fetchConversationMessages(conversation.id);
      setMessages(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!conversation?.id) { setMessages([]); return; }
    setLoading(true);
    loadMessages().finally(() => setLoading(false));

    // Polling cada 3s
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [conversation?.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const msg = await sendConversationMessage(conversation.id, text);
    setMessages(prev => [...prev, msg]);
  };

  const handleToggleBot = async () => {
    const updated = await updateConversation(conversation.id, { bot_active: !conversation.bot_active });
    onUpdate(updated);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Selecciona una conversación para ver el historial</p>
        </div>
      </div>
    );
  }

  // Group by date for separators
  const withSeparators = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = msg.created_at ? new Date(msg.created_at) : null;
    if (d && (!lastDate || !isSameDay(lastDate, d))) {
      withSeparators.push({ type: 'date', date: d, key: `sep-${d.toISOString()}` });
      lastDate = d;
    }
    withSeparators.push({ type: 'msg', msg, key: msg.id });
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      <ConversationHeader
        conversation={conversation}
        departments={departments}
        onUpdate={onUpdate}
        onNavigateToContact={onNavigateToContact}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#FC6621] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-12">Sin mensajes aún</div>
        ) : (
          <>
            {withSeparators.map(item =>
              item.type === 'date'
                ? <DateSeparator key={item.key} date={item.date} />
                : <MessageBubble key={item.key} message={item.msg} />
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <ReplyBox conversation={conversation} onSend={handleSend} onToggleBot={handleToggleBot} />
    </div>
  );
}
