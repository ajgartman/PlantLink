import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { commentsAPI } from '../services/api';

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

export default function IssueDetailModal({ issue, onClose }: IssueDetailModalProps) {
  const { isDark } = useTheme();

  const [comments, setComments]             = useState<Comment[]>([]);
  const [newComment, setNewComment]         = useState('');
  const [sending, setSending]               = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError]     = useState('');

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const p = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium;
  const s = STATUS_CONFIG[issue.status]     || STATUS_CONFIG.new;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingComments(true);
        const data = await commentsAPI.getComments(issue.id);
        if (!cancelled) setComments(data);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [issue.id]);

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
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* Left panel — issue details */}
          <div className={`flex-1 overflow-y-auto p-6 ${isDark ? '' : 'bg-white'}`}>

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

            {/* Resolved badge */}
            {issue.resolved_at && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 px-4 py-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                <span>✓</span>
                <span>Resolved on {fmtDate(issue.resolved_at)}</span>
              </div>
            )}
          </div>

          {/* Right panel — comments */}
          <div className={`lg:w-[360px] flex flex-col border-t lg:border-t-0 lg:border-l ${t.panelRight} ${t.chatBg}`}>

            {/* Chat header */}
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
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${t.sendBtn}`}
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}