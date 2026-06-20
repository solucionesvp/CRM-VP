import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bot, User } from 'lucide-react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+')
    ? dateStr
    : dateStr + 'Z';
  return format(new Date(normalized), 'HH:mm');
}

function formatRelative(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const mins = differenceInMinutes(new Date(), d);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'ayer';
  return format(d, 'd MMM', { locale: es });
}

export function DateSeparator({ date }) {
  const d = new Date(date);
  let label = format(d, 'd \'de\' MMMM yyyy', { locale: es });
  if (isToday(d)) label = 'Hoy';
  else if (isYesterday(d)) label = 'Ayer';

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isInbound = message.direction?.toLowerCase() === 'inbound';
  const isBot = message.sender_type?.toLowerCase() === 'bot';
  const isHuman = message.sender_type?.toLowerCase() === 'human';

  const bubbleClass = isInbound
    ? 'bg-[#F3F4F6] text-gray-800 rounded-tl-sm self-start'
    : isBot
      ? 'bg-[#FFF3ED] border border-[#FC6621] text-gray-800 rounded-tr-sm self-end'
      : 'bg-[#FC6621] text-white rounded-tr-sm self-end';

  const senderLabel = isInbound
    ? 'Cliente'
    : isBot
      ? '🤖 Bot'
      : '👤 Agente';

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-2`}>
      <div className={`max-w-[75%] flex flex-col gap-0.5`}>
        <div className={`flex items-center gap-1.5 ${isInbound ? 'flex-row' : 'flex-row-reverse'}`}>
          {!isInbound && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold mb-0.5">
              {senderLabel}
            </span>
          )}
        </div>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${bubbleClass}`}>
          {(() => {
            const type = message.message_type?.toLowerCase();
            if (type === 'image') return (
              <span className="flex items-center gap-1.5 text-xs italic text-gray-400">
                📷 Imagen recibida por WhatsApp
              </span>
            );
            if (type === 'audio') return (
              <span className="flex items-center gap-1.5 text-xs italic text-gray-400">
                🎤 Audio recibido por WhatsApp
              </span>
            );
            if (type === 'video') return (
              <span className="flex items-center gap-1.5 text-xs italic text-gray-400">
                🎥 Video recibido por WhatsApp
              </span>
            );
            if (type === 'document') return (
              <span className="flex items-center gap-1.5 text-xs italic text-gray-400">
                📄 Documento recibido por WhatsApp
              </span>
            );
            return message.content || (
              <span className="italic text-gray-400 text-xs">Mensaje no textual</span>
            );
          })()}
        </div>
        <span className={`text-[10px] text-gray-400 ${isInbound ? 'text-left' : 'text-right'} mt-0.5`}>
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
