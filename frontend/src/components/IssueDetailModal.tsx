import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { commentsAPI, issuesAPI, usersAPI, attachmentsAPI } from '../services/api';

interface AttachmentItem {
  id: string;
  issue_id: string;
  filename: string;
  url: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: { full_name: string; email: string } | null;
  created_at: string;
}

interface HistoryEntry {
  id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user: { full_name: string; email: string } | null;
}

interface IssueAuthor {
  full_name: string;
  email: string;
  role: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  location: string | null;
  project_id: string | null;
  created_by_id: string;
  assigned_to_id: string | null;
  created_by?: IssueAuthor;
  assigned_to?: IssueAuthor;
  due_date?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: IssueAuthor;
}

interface IssueDetailModalProps {
  issue: Issue;
  onClose: () => void;
  onStatusUpdate: (issueId: string, newStatus: string) => void;
  onPriorityUpdate: (issueId: string, newPriority: string) => void;
  onAssigneeUpdate?: (issueId: string, assignee: any) => void;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/25',         dot: 'bg-red-400' },
  high:     { label: 'High',     color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/25',     dot: 'bg-amber-400' },
  medium:   { label: 'Medium',   color: 'text-cyan-500',    bg: 'bg-cyan-500/15 border-cyan-500/25',       dot: 'bg-cyan-500' },
  low:      { label: 'Low',      color: 'text-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500/25', dot: 'bg-emerald-500' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:         { label: 'New',         color: 'bg-slate-500/15 text-slate-400 border border-slate-500/25' },
  assigned:    { label: 'Assigned',    color: 'bg-amber-500/15 text-amber-500 border border-amber-500/25' },
  in_progress: { label: 'In Progress', color: 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/25' },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25' },
  closed:      { label: 'Closed',      color: 'bg-slate-700/40 text-slate-500 border border-slate-600/25' },
};

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function IssueDetailModal({ issue, onClose, onStatusUpdate, onPriorityUpdate, onAssigneeUpdate }: IssueDetailModalProps) {
  const { isDark } = useTheme();

  const [comments, setComments]             = useState<Comment[]>([]);
  const [newComment, setNewComment]         = useState('');
  const [sending, setSending]               = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError]     = useState('');
  const [status, setStatus] = useState(issue.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [priority, setPriority] = useState(issue.priority);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [assignedToId, setAssignedToId] = useState(issue.assigned_to_id || '');
  const [updatingAssignee, setUpdatingAssignee] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const p = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium;
  const s = STATUS_CONFIG[issue.status]     || STATUS_CONFIG.new;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingComments(true);
        const [commentsData, historyData, attachmentsData] = await Promise.all([
          commentsAPI.getComments(issue.id),
          issuesAPI.getIssueHistory(issue.id),
          attachmentsAPI.getAttachments(issue.id),
        ]);
        if (!cancelled) {
          setComments(commentsData);
          setHistory(historyData);
          setAttachments(attachmentsData);
        }
      } catch (err) {
        console.error('Failed to load comments/history:', err);
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [issue.id]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await usersAPI.getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    loadUsers();
  }, []);

  const handleAssigneeChange = async (userId: string) => {
    if (updatingAssignee) return;
    setUpdatingAssignee(true);
    try {
      const updateData: Record<string, any> = { assigned_to_id: userId || undefined };
      // Auto-update status to assigned if issue is new
      if (userId && status === 'new') {
        updateData.status = 'assigned';
      }
      await issuesAPI.updateIssue(issue.id, updateData);
      setAssignedToId(userId);
      const assignedUser = users.find((u) => u.id === userId);
      if (onAssigneeUpdate) {
        onAssigneeUpdate(issue.id, assignedUser ? { id: assignedUser.id, full_name: assignedUser.full_name, email: assignedUser.email } : null);
      }
      if (userId && status === 'new') {
        setStatus('assigned');
        onStatusUpdate(issue.id, 'assigned');
      }
    } catch (err) {
      console.error('Failed to update assignee:', err);
    } finally {
      setUpdatingAssignee(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleStatusChange = async (newStatus: string) => {
  if (newStatus === status || updatingStatus) return;
  setUpdatingStatus(true);
  try {
    await issuesAPI.updateIssue(issue.id, { status: newStatus });
    setStatus(newStatus);
    onStatusUpdate(issue.id, newStatus);
  } catch (err) {
    console.error('Failed to update status:', err);
  } finally {
    setUpdatingStatus(false);
  }
};

  const handlePriorityChange = async (newPriority: string) => {
  if (newPriority === priority || updatingPriority) return;
  setUpdatingPriority(true);
  try {
    await issuesAPI.updateIssue(issue.id, { priority: newPriority });
    setPriority(newPriority);
    onPriorityUpdate(issue.id, newPriority);
  } catch (err) {
    console.error('Failed to update priority:', err);
  } finally {
    setUpdatingPriority(false);
  }
};

  const handleSend = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setCommentError('');
    try {
      const created = await commentsAPI.createComment(issue.id, trimmed);
      setComments((prev) => [...prev, created]);
      setNewComment('');
      textareaRef.current?.focus();
    } catch (err: any) {
      setCommentError(err.response?.data?.detail || 'Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const newAttachment = await attachmentsAPI.uploadAttachment(issue.id, file);
      setAttachments((prev) => [...prev, newAttachment]);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await attachmentsAPI.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const t = isDark ? {
    overlay:      'bg-black/75',
    modal:        'bg-[#0d1420] border-white/[0.08]',
    header:       'border-white/[0.07]',
    title:        'text-white',
    closeBtn:     'text-slate-500 hover:text-white hover:bg-white/[0.07]',
    descBox:      'bg-white/[0.03] border-white/[0.07] text-slate-300',
    metaGrid:     'bg-white/[0.02] border-white/[0.06]',
    metaLabel:    'text-slate-600',
    metaValue:    'text-slate-300',
    chatBg:       'bg-[#080c14]',
    chatHeader:   'border-white/[0.07]',
    chatTitle:    'text-white',
    chatCount:    'text-slate-600',
    bubbleOther:  'bg-white/[0.05] border-white/[0.07] text-slate-200',
    bubbleSelf:   'bg-cyan-500/15 border-cyan-500/20 text-cyan-100',
    bubbleName:   'text-slate-500',
    bubbleTime:   'text-slate-700',
    rolePill:     'bg-white/[0.05] text-slate-600',
    inputBorder:  'border-white/[0.07]',
    textarea:     'bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20',
    sendBtn:      'bg-cyan-500 hover:bg-cyan-400 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500',
    sendHint:     'text-slate-700',
    emptyChat:    'text-slate-700',
    panelRight:   'border-white/[0.07]',
    sectionLabel: 'text-slate-500',
    divider:      'border-white/[0.06]',
  } : {
    overlay:      'bg-black/50',
    modal:        'bg-white border-slate-200',
    header:       'border-slate-200',
    title:        'text-slate-900',
    closeBtn:     'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
    descBox:      'bg-slate-50 border-slate-200 text-slate-700',
    metaGrid:     'bg-slate-50 border-slate-200',
    metaLabel:    'text-slate-400',
    metaValue:    'text-slate-700',
    chatBg:       'bg-slate-50',
    chatHeader:   'border-slate-200',
    chatTitle:    'text-slate-900',
    chatCount:    'text-slate-400',
    bubbleOther:  'bg-white border-slate-200 text-slate-700',
    bubbleSelf:   'bg-cyan-50 border-cyan-200 text-cyan-900',
    bubbleName:   'text-slate-400',
    bubbleTime:   'text-slate-400',
    rolePill:     'bg-slate-100 text-slate-400',
    inputBorder:  'border-slate-200',
    textarea:     'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20',
    sendBtn:      'bg-cyan-500 hover:bg-cyan-600 text-white disabled:bg-slate-200 disabled:text-slate-400',
    sendHint:     'text-slate-400',
    emptyChat:    'text-slate-400',
    panelRight:   'border-slate-200',
    sectionLabel: 'text-slate-400',
    divider:      'border-slate-100',
  };

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${t.overlay} backdrop-blur-sm`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${t.modal}`}
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className={`flex items-start gap-4 px-6 py-5 border-b flex-shrink-0 ${t.header}`}>
          <div className={`w-1 h-14 rounded-full flex-shrink-0 mt-0.5 ${p.dot}`}></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${p.bg} ${p.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`}></span>
                {p.label}
              </span>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${s.color}`}>
                {s.label}
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>
                #{issue.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h2 className={`text-lg font-bold leading-snug ${t.title}`} style={{ fontFamily: "'Sora', sans-serif" }}>
              {issue.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${t.closeBtn}`}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-row flex-1 overflow-hidden">

          {/* Left panel — issue details */}
          <div className={`flex-1 overflow-y-auto p-5 min-w-0 ${isDark ? '' : 'bg-white'}`}>

            {/* Meta grid */}
            <div className={`grid grid-cols-2 gap-3 p-4 rounded-xl border mb-5 ${t.metaGrid}`}>
              {[
                { label: 'Location',    value: issue.location || '—' },
                { label: 'Created by',  value: issue.created_by?.full_name || '—' },
                { label: 'Assigned to', value: issue.assigned_to?.full_name || 'Unassigned' },
                { label: 'Created',     value: fmtDate(issue.created_at) },
                { label: 'Updated',     value: fmtDate(issue.updated_at) },
                { label: 'Due date',    value: issue.due_date ? fmtDate(issue.due_date) : '—' },
              ].map((item) => (
                <div key={item.label}>
                  <div className={`text-[9px] font-semibold uppercase tracking-widest mb-0.5 ${t.metaLabel}`}>
                    {item.label}
                  </div>
                  <div className={`text-sm font-medium ${t.metaValue}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Status selector */}
          <div className="mb-5">
            <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${t.sectionLabel}`}>
              Update Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'new',         label: 'New',         color: 'border-slate-500/30 text-slate-400 hover:bg-slate-500/10' },
                { value: 'assigned',    label: 'Assigned',    color: 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10' },
                { value: 'in_progress', label: 'In Progress', color: 'border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10' },
                { value: 'resolved',    label: 'Resolved',    color: 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' },
                { value: 'closed',      label: 'Closed',      color: 'border-slate-600/30 text-slate-500 hover:bg-slate-600/10' },
              ].map((option) => {
                const isActive = status === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={updatingStatus}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${option.color} ${
                      isActive
                        ? 'opacity-100 ring-2 ring-offset-1 ' + (isDark ? 'ring-offset-[#0d1420]' : 'ring-offset-white') + ' ring-current'
                        : 'opacity-50 hover:opacity-100'
                    } disabled:cursor-not-allowed`}
                  >
                    {updatingStatus && isActive ? 'Saving…' : option.label}
                  </button>
                );
              })}
            </div>
          </div>
            {/* Priority selector */}
          <div className="mb-5">
            <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${t.sectionLabel}`}>
              Update Priority
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'low',      label: 'Low',      color: 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' },
                { value: 'medium',   label: 'Medium',   color: 'border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10' },
                { value: 'high',     label: 'High',     color: 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10' },
                { value: 'critical', label: 'Critical', color: 'border-red-500/30 text-red-400 hover:bg-red-500/10' },
              ].map((option) => {
                const isActive = priority === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handlePriorityChange(option.value)}
                    disabled={updatingPriority}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${option.color} ${
                      isActive
                        ? 'opacity-100 ring-2 ring-offset-1 ' + (isDark ? 'ring-offset-[#0d1420]' : 'ring-offset-white') + ' ring-current'
                        : 'opacity-50 hover:opacity-100'
                    } disabled:cursor-not-allowed`}
                  >
                    {updatingPriority && isActive ? 'Saving…' : option.label}
                  </button>
                );
              })}
            </div>
          </div>
            {/* Assign To */}
            <div className="mb-5">
              <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${t.sectionLabel}`}>
                Assign To
              </div>
              <select
                value={assignedToId}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={updatingAssignee}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-400 focus:ring-cyan-400/20'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-5">
              <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${t.sectionLabel}`}>
                Description
              </div>
              <div className={`text-sm leading-relaxed rounded-xl border p-4 min-h-[80px] whitespace-pre-wrap ${t.descBox}`}>
                {issue.description?.trim() || (
                  <span className={`italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    No description provided.
                  </span>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="mb-5">
              <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${t.sectionLabel}`}>
                Attachments {attachments.length > 0 && `(${attachments.length})`}
              </div>

              {/* Upload area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`w-full mb-3 px-4 py-3 rounded-xl border-2 border-dashed text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  isDark
                    ? 'border-white/[0.08] text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 hover:bg-cyan-500/5'
                    : 'border-slate-200 text-slate-400 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">⟳</span> Uploading…
                  </>
                ) : (
                  <>
                    <span>📎</span> Click to attach a file (JPG, PNG, WebP, PDF — max 10 MB)
                  </>
                )}
              </button>
              {uploadError && (
                <p className="text-xs text-red-400 mb-2">{uploadError}</p>
              )}

              {/* Attachment thumbnails */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {attachments.map((att) => {
                    const isImage = att.content_type.startsWith('image/');
                    return (
                      <div
                        key={att.id}
                        className={`group relative rounded-xl border overflow-hidden ${
                          isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        {isImage ? (
                          <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${att.url}`} target="_blank" rel="noopener noreferrer">
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${att.url}`}
                              alt={att.filename}
                              className="w-full h-24 object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${att.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-24"
                          >
                            <span className="text-3xl opacity-40">📄</span>
                          </a>
                        )}
                        <div className="px-2.5 py-2">
                          <div className={`text-[10px] font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {att.filename}
                          </div>
                          <div className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {formatFileSize(att.size_bytes)} · {att.uploaded_by?.full_name || 'Unknown'}
                          </div>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40'
                              : 'bg-red-100 text-red-500 hover:bg-red-200'
                          }`}
                          title="Delete attachment"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History timeline */}
            {history.length > 0 && (
              <div className="mb-5">
                <div className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${t.sectionLabel}`}>
                  Activity Log
                </div>
                <div className={`rounded-xl border p-3 space-y-2.5 ${t.metaGrid}`}>
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        entry.field_changed === 'status' ? 'bg-cyan-500' :
                        entry.field_changed === 'priority' ? 'bg-amber-500' : 'bg-violet-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs leading-snug ${t.metaValue}`}>
                          <span className="font-medium">{entry.user?.full_name || 'Unknown'}</span>
                          {' changed '}
                          <span className="font-medium">{entry.field_changed.replace('_', ' ')}</span>
                          {entry.old_value && (
                            <> from <span className="font-mono text-[10px]">{entry.old_value}</span></>
                          )}
                          {' to '}
                          <span className="font-mono text-[10px]">{entry.new_value}</span>
                        </div>
                        <div className={`text-[10px] mt-0.5 ${t.metaLabel}`}>{fmtTime(entry.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved badge */}
            {issue.resolved_at && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 px-4 py-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                <span>✓</span>
                <span>Resolved on {fmtDate(issue.resolved_at)}</span>
              </div>
            )}
          </div>

          {/* Right panel — comments */}
          <div className={`w-[320px] flex-shrink-0 flex flex-col border-l ${t.panelRight} ${t.chatBg}`}>            {/* Chat header */}
            <div className={`px-5 py-4 border-b flex-shrink-0 ${t.chatHeader}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${t.chatTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                  Discussion
                </h3>
                <span className={`text-[10px] ${t.chatCount}`}>
                  {comments.length} {comments.length === 1 ? 'message' : 'messages'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className={`w-7 h-7 rounded-lg flex-shrink-0 ${isDark ? 'bg-white/[0.05]' : 'bg-slate-200'}`}></div>
                      <div className="flex-1 space-y-2">
                        <div className={`h-3 rounded w-24 ${isDark ? 'bg-white/[0.05]' : 'bg-slate-200'}`}></div>
                        <div className={`h-3 rounded w-full ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-12 text-center ${t.emptyChat}`}>
                  <div className="text-3xl mb-3 opacity-30">💬</div>
                  <p className="text-sm font-medium mb-1">No messages yet</p>
                  <p className="text-xs opacity-70">Be the first to comment on this issue.</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isSelf = comment.user_id === currentUser.id;
                  return (
                    <div key={comment.id} className={`flex gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
                      >
                        {initials(comment.user.full_name)}
                      </div>
                      <div className={`flex-1 min-w-0 flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-[10px] font-semibold ${t.bubbleName}`}>
                            {isSelf ? 'You' : comment.user.full_name}
                          </span>
                          <span className={`text-[9px] ${t.bubbleTime}`}>
                            {fmtTime(comment.created_at)}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md capitalize ${t.rolePill}`}>
                            {comment.user.role}
                          </span>
                        </div>
                        <div className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed max-w-[280px] whitespace-pre-wrap ${isSelf ? t.bubbleSelf : t.bubbleOther}`}>
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef}></div>
            </div>

           {/* Input */}
            <div className={`p-4 border-t flex-shrink-0 ${t.inputBorder}`}>
              {commentError && (
                <p className="text-xs text-red-400 mb-2">{commentError}</p>
              )}
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                rows={3}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-1 transition-all ${t.textarea}`}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[9px] ${t.sendHint}`}>Ctrl+Enter to send</span>
                <button
                  onClick={handleSend}
                  disabled={!newComment.trim() || sending}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${t.sendBtn}`}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Close button — bottom left */}
        <div className={`px-5 py-3 flex justify-start border-t flex-shrink-0 ${t.header}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${isDark ? 'bg-white/[0.06] hover:bg-white/[0.10] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}