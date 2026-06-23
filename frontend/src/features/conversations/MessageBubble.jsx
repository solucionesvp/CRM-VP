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
            const type     = message.message_type?.toLowerCase();
            const content  = message.content || '';
            const mediaUrl = message.media_url;
            const filename = message.media_filename || 'archivo';

            // ── Imagen ─────────────────────────────────────────────────────────
            if (type === 'image' || (type === 'system' && mediaUrl && message.media_mime_type?.startsWith('image/'))) {
              if (mediaUrl) return (
                <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={mediaUrl}
                    alt={filename}
                    className="max-w-[240px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </a>
              );
              return <span className="flex items-center gap-1.5 text-xs italic text-gray-400">📷 Imagen</span>;
            }

            // ── Audio ──────────────────────────────────────────────────────────
            if (type === 'audio' || (type === 'system' && mediaUrl && message.media_mime_type?.startsWith('audio/'))) {
              if (mediaUrl) return (
                <audio controls className="max-w-[240px] h-8" src={mediaUrl}>
                  Tu navegador no soporta audio.
                </audio>
              );
              return <span className="flex items-center gap-1.5 text-xs italic text-gray-400">🎤 Audio</span>;
            }

            // ── Video ──────────────────────────────────────────────────────────
            if (type === 'video' || (type === 'system' && mediaUrl && message.media_mime_type?.startsWith('video/'))) {
              if (mediaUrl) return (
                <video controls className="max-w-[240px] rounded-lg" src={mediaUrl}>
                  Tu navegador no soporta video.
                </video>
              );
              return <span className="flex items-center gap-1.5 text-xs italic text-gray-400">🎥 Video</span>;
            }

            // ── Documento / PDF ────────────────────────────────────────────────
            if (type === 'document' || (type === 'system' && mediaUrl)) {
              if (mediaUrl) return (
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold underline hover:opacity-80"
                >
                  📄 {filename}
                </a>
              );
              return <span className="flex items-center gap-1.5 text-xs italic text-gray-400">📄 Documento</span>;
            }

            // ── System sin media_url ───────────────────────────────────────────
            if (type === 'system' && content === '[media]') return (
              <span className="flex items-center gap-1.5 text-xs italic text-gray-400">
                📎 Archivo multimedia
              </span>
            );

            // ── Texto normal ───────────────────────────────────────────────────
            return content || (
              <span className="italic text-gray-400 text-xs">Mensaje vacío</span>
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
