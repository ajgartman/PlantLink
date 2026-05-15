import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { companiesAPI } from '../services/api';

interface NewContractorModalProps {
  onClose: () => void;
  onContractorCreated: (newContractor: any) => void;
}

export default function NewContractorModal({ onClose, onContractorCreated }: NewContractorModalProps) {
  const { isDark } = useTheme();

  // Form state — controlled inputs, one piece per field
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);

  // Focus the name field when the modal opens
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Escape closes
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const newContractor = await companiesAPI.createCompany({
        name: name.trim(),
        company_type: 'contractor', // 🎓 hardcoded — see earlier discussion
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      onContractorCreated(newContractor);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create contractor.');
    } finally {
      setSubmitting(false);
    }
  };

  // Theme tokens
  const t = isDark ? {
    overlay:   'bg-black/75',
    modal:     'bg-[#0d1420] border-white/[0.08]',
    header:    'border-white/[0.07]',
    title:     'text-white',
    closeBtn:  'text-slate-500 hover:text-white hover:bg-white/[0.07]',
    label:     'text-slate-400',
    input:     'bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20',
    cancelBtn: 'bg-white/[0.06] hover:bg-white/[0.10] text-slate-300',
    errorBox:  'bg-red-500/10 border-red-500/20 text-red-300',
  } : {
    overlay:   'bg-black/50',
    modal:     'bg-white border-slate-200',
    header:    'border-slate-200',
    title:     'text-slate-900',
    closeBtn:  'text-slate-400 hover:text-slate-900 hover:bg-slate-100',
    label:     'text-slate-600',
    input:     'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20',
    cancelBtn: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
    errorBox:  'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div
      className={`fixed inset-0 z-[100] ${t.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border ${t.modal} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${t.header}`}>
          <h2 className={`text-lg font-semibold ${t.title}`}>New Contractor</h2>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.closeBtn}`}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Name *</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MechWorks Ltd"
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44..."
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Optional"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 ${t.input}`}
            />
          </div>

          {error && (
            <div className={`px-3 py-2 rounded-lg border text-sm ${t.errorBox}`}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 px-6 py-4 border-t ${t.header}`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${t.cancelBtn}`}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-white disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create Contractor'}
          </button>
        </div>
      </div>
    </div>
  );
}