import React from 'react';

export default function OpportunityFormFields({
  initialContactId,
  contactId,
  setContactId,
  contacts,
  loadingContacts,
  title,
  setTitle,
  productServiceId,
  setProductServiceId,
  productServices,
  productInterest,
  setProductInterest,
  pipelineId,
  handlePipelineChange,
  pipelines,
  stageId,
  setStageId,
  stages,
  expectedValue,
  setExpectedValue,
  priority,
  setPriority,
  expectedCloseDate,
  setExpectedCloseDate,
  errors,
}) {
  return (
    <>
      {/* Contact Selector */}
      {!initialContactId && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Contacto Relacionado *
          </label>
          {loadingContacts ? (
            <p className="text-[10px] text-textMuted">Cargando contactos...</p>
          ) : (
            <select
              value={contactId}
              required
              onChange={(e) => setContactId(e.target.value)}
              className={`w-full px-2 py-2 bg-background border rounded text-text font-medium focus:outline-none focus:ring-1 transition-all ${
                errors.contact_id
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            >
              <option value="">-- Seleccionar Contacto --</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          )}
          {errors.contact_id && <p className="text-[10px] text-red-500 mt-1">{errors.contact_id}</p>}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
          Título de la Oportunidad *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Compra de motobombas Evans"
          className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
            errors.title
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-border focus:border-primary focus:ring-primary/20'
          }`}
        />
        {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Product / Catalog */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Catálogo Comercial (Opcional)
          </label>
          <select
            value={productServiceId}
            onChange={(e) => {
              setProductServiceId(e.target.value);
              const selected = productServices.find(p => p.id === e.target.value);
              if (selected && !productInterest) {
                setProductInterest(selected.name);
              }
            }}
            className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">-- Seleccionar --</option>
            {productServices.map(ps => (
              <option key={ps.id} value={ps.id}>{ps.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Detalle / Equipo de Interés *
          </label>
          <input
            type="text"
            value={productInterest}
            onChange={(e) => setProductInterest(e.target.value)}
            placeholder="Ej. Bomba Autocebante 3 HP Evans"
            className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
              errors.product_interest
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            }`}
          />
          {errors.product_interest && (
            <p className="text-[10px] text-red-500 mt-1">{errors.product_interest}</p>
          )}
        </div>
      </div>

      {/* Pipeline & Stage Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Pipeline *
          </label>
          <select
            value={pipelineId}
            onChange={(e) => handlePipelineChange(e.target.value)}
            className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="" disabled>-- Seleccionar --</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Etapa Inicial *
          </label>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            disabled={!pipelineId}
            className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
          >
            {stages.filter(s => s.pipeline_id.toString() === pipelineId.toString()).length === 0 && (
              <option value="">-- Sin etapas --</option>
            )}
            {stages
              .filter(s => s.pipeline_id.toString() === pipelineId.toString())
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Expected Value & Priority Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Valor Estimado (MXN)
          </label>
          <input
            type="text"
            value={expectedValue}
            onChange={(e) => setExpectedValue(e.target.value)}
            placeholder="Ej. 12500"
            className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
              errors.expected_value
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            }`}
          />
          {errors.expected_value && (
            <p className="text-[10px] text-red-500 mt-1">{errors.expected_value}</p>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
            Prioridad
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-2 py-2 bg-background border border-border rounded text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>

      {/* Close Date */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
          Fecha Estimada de Cierre
        </label>
        <input
          type="date"
          value={expectedCloseDate}
          onChange={(e) => setExpectedCloseDate(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
        />
      </div>
    </>
  );
}
