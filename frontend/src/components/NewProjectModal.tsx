import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { projectsAPI } from '../services/api';

interface Company {
  id: string;
  name: string;
  company_type: 'plant' | 'contractor';
}

interface NewProjectModalProps {
  companies: Company[];
  onClose: () => void;
  onProjectCreated: (newProject: any) => void;
}

export default function NewProjectModal({ companies, onClose, onProjectCreated }: NewProjectModalProps) {
  const { isDark } = useTheme();

  // 🎓 Filter the same list two ways instead of fetching twice
  const plants      = companies.filter((c) => c.company_type === 'plant');
  const contractors = companies.filter((c) => c.company_type === 'contractor');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plantId, setPlantId] = useState(plants[0]?.id || '');
  const [contractorId, setContractorId] = useState(contractors[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    // 🎓 Validation — fail fast, fail loudly
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!plantId) {
      setError('Please select a plant.');
      return;
    }
    if (!contractorId) {
      setError('Please select a contractor.');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const newProject = await projectsAPI.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        plant_id: plantId,
        contractor_id: contractorId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      onProjectCreated(newProject);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project.');
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
    warnBox:   'bg-amber-500/10 border-amber-500/20 text-amber-300',
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
    warnBox:   'bg-amber-50 border-amber-200 text-amber-700',
  };

  // 🎓 Empty-state warnings — better UX than a blank dropdown
  const noPlants      = plants.length === 0;
  const noContractors = contractors.length === 0;
  const cannotSubmit  = noPlants || noContractors;

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
          <h2 className={`text-lg font-semibold ${t.title}`}>New Project</h2>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.closeBtn}`}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Empty-state warnings shown at the top */}
          {cannotSubmit && (
            <div className={`px-3 py-2 rounded-lg border text-xs ${t.warnBox}`}>
              {noPlants && <div>No plants exist yet. Add one in Supabase or via the plant setup.</div>}
              {noContractors && <div>No contractors exist yet. Create one on the Contractors page first.</div>}
            </div>
          )}

          {/* Name */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Project name *</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 boiler retrofit"
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Scope, goals, anything worth noting"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 ${t.input}`}
            />
          </div>

          {/* Plant + Contractor side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Plant *</label>
              <select
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                disabled={noPlants}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              >
                {noPlants
                  ? <option value="">— none —</option>
                  : plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                }
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Contractor *</label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                disabled={noContractors}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              >
                {noContractors
                  ? <option value="">— none —</option>
                  : contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                }
              </select>
            </div>
          </div>

          {/* Dates side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              />
            </div>
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
            disabled={submitting || cannotSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-white disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}