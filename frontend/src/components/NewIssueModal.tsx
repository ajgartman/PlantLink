import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { issuesAPI, projectsAPI } from '../services/api';

// 🎓 Type for the prop callback — parent passes a function, we call it on success
interface NewIssueModalProps {
  onClose: () => void;
  onIssueCreated: (newIssue: any) => void;
}

interface Project {
  id: string;
  name: string;
}

export default function NewIssueModal({ onClose, onIssueCreated }: NewIssueModalProps) {
  const { isDark } = useTheme();

  // ── Form state — one piece per field (controlled inputs) ──────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState('');

  // ── Async state ───────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  // ── Fetch projects on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await projectsAPI.getAllProjects();
        if (cancelled) return;
        setProjects(data);
        // Auto-select first project if there's only one
        if (data.length > 0) setProjectId(data[0].id);
      } catch (err) {
        if (!cancelled) setError('Could not load projects.');
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Focus the title field when the modal opens
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Escape key closes the modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!projectId) {
      setError('Please select a project.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const newIssue = await issuesAPI.createIssue({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        location: location.trim() || undefined,
        project_id: projectId,
      });
      onIssueCreated(newIssue); // 🎓 Tell the parent — lifting state up
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create issue.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const t = isDark ? {
    overlay: 'bg-black/75',
    modal: 'bg-[#0d1420] border-white/[0.08]',
    header: 'border-white/[0.07]',
    title: 'text-white',
    closeBtn: 'text-slate-500 hover:text-white hover:bg-white/[0.07]',
    label: 'text-slate-400',
    input: 'bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20',
    cancelBtn: 'bg-white/[0.06] hover:bg-white/[0.10] text-slate-300',
    errorBox: 'bg-red-500/10 border-red-500/20 text-red-300',
  } : {
    overlay: 'bg-black/50',
    modal: 'bg-white border-slate-200',
    header: 'border-slate-200',
    title: 'text-slate-900',
    closeBtn: 'text-slate-400 hover:text-slate-900 hover:bg-slate-100',
    label: 'text-slate-600',
    input: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20',
    cancelBtn: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
    errorBox: 'bg-red-50 border-red-200 text-red-700',
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
          <h2 className={`text-lg font-semibold ${t.title}`}>New Issue</h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.closeBtn}`}
          >
            ✕
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Title *</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conveyor belt vibration"
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's the problem?"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 ${t.input}`}
            />
          </div>

          {/* Priority + Location side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Production A"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
              />
            </div>
          </div>

          {/* Project dropdown */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${t.label}`}>Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loadingProjects}
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${t.input}`}
            >
              {loadingProjects && <option>Loading projects…</option>}
              {!loadingProjects && projects.length === 0 && (
                <option value="">No projects available</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Error message */}
          {error && (
            <div className={`px-3 py-2 rounded-lg border text-sm ${t.errorBox}`}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 px-6 py-4 border-t ${t.header}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${t.cancelBtn}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingProjects}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}