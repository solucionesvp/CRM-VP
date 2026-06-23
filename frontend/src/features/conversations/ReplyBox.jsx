import { useState, useRef, useEffect } from 'react';
import { Send, Bot, BotOff, Paperclip, X, Mic, MicOff, Square } from 'lucide-react';
import { sendConversationMedia } from '../../lib/api';

export default function ReplyBox({ conversation, onSend, onToggleBot }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachPreview, setAttachPreview] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const botActive = conversation?.bot_active;

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        const file = new File([blob], 'audio_mensaje.ogg', { type: 'audio/ogg' });
        setSending(true);
        try {
          await sendConversationMedia(conversation.id, file, '');
        } catch (error) {
          console.error("Error sending recorded audio:", error);
        } finally {
          setSending(false);
        }
        audioChunksRef.current = [];
        stream.getTracks().forEach(t => t.stop());
      };

      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setRecording(false);
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      setAttachPreview(URL.createObjectURL(file));
    } else {
      setAttachPreview(null);
    }
    // Reset input so same file can be reselected
    e.target.value = '';
  };

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      if (attachedFile) {
        await sendConversationMedia(conversation.id, attachedFile, text.trim());
        setAttachedFile(null);
        setAttachPreview(null);
        setText('');
      } else {
        const trimmed = text.trim();
        if (!trimmed) return;
        await onSend(trimmed);
        setText('');
      }
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
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
      />

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

      {/* Timer de grabación */}
      {recording && (
        <div className="mx-3 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-semibold text-red-600">
            Grabando... {formatRecordingTime(recordingTime)}
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            Toca ■ para enviar
          </span>
        </div>
      )}

      {/* Preview del archivo seleccionado */}
      {!recording && attachedFile && (
        <div className="mx-3 mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
          {attachPreview ? (
            <img src={attachPreview} alt="preview" className="w-10 h-10 object-cover rounded" />
          ) : (
            <span className="text-lg">📄</span>
          )}
          <span className="text-xs text-gray-600 truncate flex-1">{attachedFile.name}</span>
          <button
            onClick={() => { setAttachedFile(null); setAttachPreview(null); }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 p-3">
        {/* Botón clip — adjuntar archivo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={botActive || recording}
          title="Adjuntar archivo"
          className="flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Botón micrófono */}
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={botActive || !!attachedFile}
            title="Grabar audio"
            className="flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Mic className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            title="Detener grabación"
            className="flex-shrink-0 p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors animate-pulse"
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        {/* Botón bot */}
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
            disabled={botActive || recording}
            placeholder={botActive ? 'Desactiva el bot para responder...' : 'Escribe un mensaje... (Enter para enviar)'}
            rows={1}
            className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors leading-snug ${
              botActive || recording
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 bg-white focus:border-[#FC6621] focus:ring-1 focus:ring-[#FC6621]/30'
            }`}
          />
          <span className="absolute right-2 bottom-2 text-[10px] text-gray-300">{text.length}</span>
        </div>

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !attachedFile) || botActive || sending || recording}
          className="flex-shrink-0 p-2.5 bg-[#FC6621] text-white rounded-xl hover:bg-[#e05a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
