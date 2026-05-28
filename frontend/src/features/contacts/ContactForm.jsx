import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { createContact, updateContact } from '../../lib/api';

const SOURCES = [
  { value: 'referral', label: 'Recomendado / Referido' },
  { value: 'cold_call', label: 'Llamada en Frío' },
  { value: 'social_media', label: 'Redes Sociales' },
  { value: 'walk_in', label: 'Visita al Local' },
  { value: 'web', label: 'Página Web' },
  { value: 'exhibition', label: 'Expo / Exhibición' },
  { value: 'other', label: 'Otro' },
];

export default function ContactForm({ contact, onSave, onCancel }) {
  const isEdit = !!contact;

  // Form states
  const [type, setType] = useState('person');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Tepic');
  const [notes, setNotes] = useState('');

  // UI state
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Load values if editing
  useEffect(() => {
    if (contact) {
      setType(contact.type || 'person');
      setName(contact.name || '');
      setCompanyName(contact.company_name || '');
      setPhone(contact.phone || '');
      setWhatsapp(contact.whatsapp || '');
      setEmail(contact.email || '');
      setSource(contact.source || '');
      setAddress(contact.address || '');
      setCity(contact.city || 'Tepic');
      setNotes(contact.notes || '');
    } else {
      // Reset form
      setType('person');
      setName('');
      setCompanyName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setSource('');
      setAddress('');
      setCity('Tepic');
      setNotes('');
    }
    setErrors({});
    setSubmitError(null);
  }, [contact]);

  // Validations
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Formato de correo inválido';
      }
    }

    if (phone.trim()) {
      const phoneRegex = /^[0-9+\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        newErrors.phone = 'Teléfono inválido (mínimo 7 dígitos)';
      }
    }

    if (whatsapp.trim()) {
      const phoneRegex = /^[0-9+\s\-()]{7,15}$/;
      if (!phoneRegex.test(whatsapp)) {
        newErrors.whatsapp = 'WhatsApp inválido (mínimo 7 dígitos)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      type,
      name: name.trim(),
      company_name: type === 'company' ? companyName.trim() || null : null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      source: source || null,
      address: address.trim() || null,
      city: city.trim() || 'Tepic',
      notes: notes.trim() || null,
    };

    try {
      let savedContact;
      if (isEdit) {
        savedContact = await updateContact(contact.id, payload);
      } else {
        savedContact = await createContact(payload);
      }
      onSave(savedContact);
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar el contacto en el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-sm flex flex-col space-y-6">
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-bold font-heading text-text">
          {isEdit ? 'Editar Contacto' : 'Nuevo Contacto'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1 text-textMuted hover:text-text hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Type selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-2">
            Tipo de Contacto *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('person')}
              className={`py-2 px-3 border rounded font-semibold text-xs uppercase tracking-wider transition-all duration-150 ${
                type === 'person'
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-background text-text border-border hover:bg-gray-50'
              }`}
            >
              Persona
            </button>
            <button
              type="button"
              onClick={() => setType('company')}
              className={`py-2 px-3 border rounded font-semibold text-xs uppercase tracking-wider transition-all duration-150 ${
                type === 'company'
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-background text-text border-border hover:bg-gray-50'
              }`}
            >
              Empresa / Distribuidor
            </button>
          </div>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
            Nombre / Razón Social *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Juan Pérez o Evans de Occidente"
            className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
              errors.name
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            }`}
          />
          {errors.name && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.name}</p>}
        </div>

        {/* Company Name (only if company type selected) */}
        {type === 'company' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
              Nombre de la Empresa Comercial
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej. Evans Nayarit SA"
              className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        )}

        {/* Phone & WhatsApp row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
              Teléfono
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 3111234567"
              className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
                errors.phone
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
            {errors.phone && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
              WhatsApp
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ej. 3119876543"
              className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
                errors.whatsapp
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
            {errors.whatsapp && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.whatsapp}</p>
            )}
          </div>
        </div>

        {/* Email input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
            Correo Electrónico
          </label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej. taller@evans.com"
            className={`w-full px-3 py-2 bg-background border rounded text-text focus:outline-none focus:ring-1 transition-all ${
              errors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-primary focus:ring-primary/20'
            }`}
          />
          {errors.email && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email}</p>}
        </div>

        {/* Source Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
            Origen / Canal
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="">Selecciona una opción</option>
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Address and City */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
              Dirección
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, colonia"
              className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
              Ciudad
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Tepic"
              className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Notes textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-textMuted mb-1.5">
            Observaciones Iniciales
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade especificaciones del cliente o taller aquí..."
            className="w-full h-24 p-3 bg-background border border-border rounded text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border bg-white text-text hover:bg-gray-50 rounded text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
