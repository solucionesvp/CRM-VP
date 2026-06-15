import { useState, useRef, useEffect } from 'react';
import { Send, Bot, BotOff } from 'lucide-react';

export default function ReplyBox({ conversation, onSend, onToggleBot }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const botActive = conversation?.bot_active;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {botActive && (
        <div className="flex items-center justify-between bg-orange-50 border-b border-orange-100 px-4 py-2.5">
          <div className="flex items-center gap-2 text-[#e05a1a] text-xs font-semibold">
            <span>🤖 El bot está respondiendo. Desactívalo para escribir.</span>
          </div>
          <button
            onClick={onToggleBot}
            className="text-xs bg-[#FC6621] text-white px-3 py-1 rounded-lg hover:bg-[#e05a1a] transition-colors font-bold"
          >
            Desactivar bot
          </button>
        </div>
      )}
      <div className="flex items-end gap-3 p-3">
        <button
          onClick={onToggleBot}
          title={botActive ? 'Desactivar bot' : 'Activar bot'}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            botActive
              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {botActive ? <Bot className="w-4 h-4" /> : <BotOff className="w-4 h-4" />}
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={botActive}
            placeholder={botActive ? 'Desactiva el bot para responder...' : 'Escribe un mensaje... (Enter para enviar)'}
            rows={1}
            className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors leading-snug ${
              botActive
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 bg-white focus:border-[#FC6621] focus:ring-1 focus:ring-[#FC6621]/30'
            }`}
          />
          <span className="absolute right-2 bottom-2 text-[10px] text-gray-300">{text.length}</span>
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || botActive || sending}
          className="flex-shrink-0 p-2.5 bg-[#FC6621] text-white rounded-xl hover:bg-[#e05a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
