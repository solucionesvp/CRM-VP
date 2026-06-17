import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchWhatsAppStatus, connectWhatsApp } from '../../lib/api';

export default function WhatsAppConnect() {
  const [status, setStatus] = useState('close');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWhatsAppStatus();
      setStatus(data.status || 'close');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getStatus(); }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCode('');
    try {
      const data = await connectWhatsApp(phone);
      setCode(data.pairingCode);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto py-2">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-text">Conexión con WhatsApp</h3>
          <p className="text-xs text-textMuted">Monitorea el estado y vincula el número de la empresa.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            status === 'open' ? 'bg-green-50 text-green-700 border border-green-200' :
            status === 'connecting' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${status === 'open' ? 'bg-green-500 animate-pulse' : status === 'connecting' ? 'bg-yellow-500 animate-spin' : 'bg-red-500'}`} />
            {status === 'open' ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
          </span>
          <button onClick={getStatus} disabled={loading} className="p-1.5 text-textMuted hover:text-text rounded-lg border border-border hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status !== 'open' && (
        <div className="space-y-5">
          <form onSubmit={handleConnect} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-border">
            <div>
              <label className="text-xs font-bold text-text block mb-1">Número de Teléfono</label>
              <input
                type="text"
                placeholder="Ej: 523114997717 (con código de país)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <button type="submit" disabled={submitting || !phone} className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
              {submitting ? 'Generando...' : 'Generar código de vinculación'}
            </button>
          </form>

          {code && (
            <div className="border border-border rounded-xl overflow-hidden animate-fadeIn">
              <div className="bg-primary/5 p-4 text-center border-b border-border">
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Código de vinculación</span>
                <div className="text-3xl font-mono font-black tracking-widest text-primary py-2 select-all">{code}</div>
              </div>
              <div className="p-4 space-y-2 bg-white">
                <h5 className="text-xs font-bold text-text">Instrucciones de Vinculación:</h5>
                <ol className="list-decimal list-inside text-xs text-textMuted space-y-1.5 pl-1">
                  <li>Abre WhatsApp en el teléfono de la empresa.</li>
                  <li>Ve a <span className="font-semibold text-text">Configuración → Dispositivos vinculados</span>.</li>
                  <li>Presiona <span className="font-semibold text-text">"Vincular un dispositivo"</span> y luego <span className="font-semibold text-text">"Vincular con número de teléfono en su lugar"</span>.</li>
                  <li>Escribe el código mostrado arriba.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'open' && (
        <div className="bg-green-50/50 border border-green-200/50 rounded-xl p-5 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
          <h4 className="text-sm font-bold text-green-800">Conexión Activa</h4>
          <p className="text-xs text-green-700/80">El CRM está conectado correctamente con Evolution API y listo para operar.</p>
        </div>
      )}
    </div>
  );
}
