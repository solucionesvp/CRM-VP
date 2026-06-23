import { useState, useEffect, useRef } from 'react';
import {
  fetchOpportunityAttachments,
  uploadOpportunityAttachment,
  deleteOpportunityAttachment
} from '../../lib/api';

const getAttachmentIcon = (contentType) => {
  if (!contentType) return '📎';
  const mime = contentType.toLowerCase();
  if (mime.startsWith('image/')) return '📷';
  if (mime === 'application/pdf') return '📄';
  if (mime.includes('word') || mime.includes('officedocument.wordprocessingml') || mime.includes('msword')) {
    return '📝';
  }
  if (mime.includes('excel') || mime.includes('spreadsheetml') || mime.includes('ms-excel')) {
    return '📊';
  }
  return '📎';
};

const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const truncateFilename = (filename, maxLen = 30) => {
  if (!filename) return '';
  if (filename.length <= maxLen) return filename;
  const extIndex = filename.lastIndexOf('.');
  if (extIndex !== -1 && filename.length - extIndex < 8) {
    const ext = filename.slice(extIndex);
    const base = filename.slice(0, extIndex);
    return base.slice(0, maxLen - 3 - ext.length) + '...' + ext;
  }
  return filename.slice(0, maxLen - 3) + '...';
};

export default function OpportunityAttachments({ opportunityId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadAttachments = async () => {
    if (!opportunityId) return;
    setLoading(true);
    try {
      const data = await fetchOpportunityAttachments(opportunityId);
      setAttachments(data || []);
    } catch (err) {
      console.error('Error al cargar adjuntos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !opportunityId) return;

    setUploading(true);
    try {
      await uploadOpportunityAttachment(opportunityId, file);
      await loadAttachments();
    } catch (err) {
      alert(err.message || 'Error al subir el adjunto');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este archivo adjunto?')) return;
    try {
      await deleteOpportunityAttachment(opportunityId, attachmentId);
      await loadAttachments();
    } catch (err) {
      alert(err.message || 'Error al eliminar el adjunto');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-textMuted">
          Adjuntos
        </h4>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-primary text-white hover:bg-primary/95 disabled:bg-primary/50 disabled:cursor-not-allowed rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            {uploading ? 'Subiendo...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[10px] text-textMuted py-1">
          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando adjuntos...</span>
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-[10px] text-textMuted italic py-1">Sin adjuntos</p>
      ) : (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between gap-3 p-2 bg-background border border-border rounded text-[11px] hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <span className="text-base shrink-0 select-none">
                  {getAttachmentIcon(att.content_type)}
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="font-medium text-text truncate" title={att.filename}>
                    {truncateFilename(att.filename, 30)}
                  </div>
                  <div className="text-[9px] text-textMuted flex items-center gap-1.5">
                    <span>{formatFileSize(att.file_size)}</span>
                    {att.created_at && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(att.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10 rounded transition-colors font-bold uppercase tracking-wider"
                >
                  Ver
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  className="w-5 h-5 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors text-xs font-bold"
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
