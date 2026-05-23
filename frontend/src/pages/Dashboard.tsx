// ─── src/pages/Dashboard.tsx ─────────────────────────────────────────────────
//
// 🎓 THEME SYSTEM EXPLAINED
// We use a `t` (tokens) object to map semantic names → Tailwind classes.
// Based on `isDark`, we swap the entire token set.
//
// WHY NOT just scatter `isDark ? 'dark-class' : 'light-class'` everywhere?
// Because then your theme logic is buried in 200 JSX lines. With tokens,
// ALL theme decisions live in one object you can read in 30 seconds.
//
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate, useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { issuesAPI } from '../services/api';
import type { User } from '../types/user';
import { useTheme } from '../contexts/ThemeContext';
import IssueDetailModal from '../components/IssueDetailModal';
import NewIssueModal from '../components/NewIssueModal';

function Dashboard() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useOutletContext<{ user: User }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [issues, setIssues] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const pageSize = 50;

  // Role-based UI: who can create issues
  const canCreateIssue = ['admin', 'manager', 'operator'].includes(user.role);

  const fetchIssues = async (params?: Record<string, string | number>) => {
    try {
      setLoading(true);
      const result = await issuesAPI.getAllIssues(params as any);
      setIssues(result.data);
      setTotalIssues(result.total);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      setError('Failed to load issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    issuesAPI.getRecentHistory(8).then(setRecentActivity).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const params: Record<string, string | number> = { skip: 0, limit: pageSize };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (activeTab === 'Critical') params.priority = 'critical';
      else if (activeTab === 'High') params.priority = 'high';
      else if (activeTab === 'Medium') params.priority = 'medium';
      else if (activeTab === 'In Progress') params.status = 'in_progress';
      setCurrentPage(1);
      await fetchIssues(params);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  const handleNewIssue = () => {
  setShowNewIssueModal(true);
  };

  const handleIssueCreated = (newIssue: any) => {
  // 🎓 Prepend so the newest issue appears at the top of the table
  setIssues((prev) => [newIssue, ...prev]);
  };

  const handleIssueStatusUpdate = (issueId: string, newStatus: string) => {
  setIssues((prev) =>
    prev.map((issue) =>
      issue.id === issueId ? { ...issue, status: newStatus } : issue
    )
  );
};

  const handleIssuePriorityUpdate = (issueId: string, newPriority: string) => {
  setIssues((prev) =>
    prev.map((issue) =>
      issue.id === issueId ? { ...issue, priority: newPriority } : issue
    )
  );
};

  const handleAssigneeUpdate = (issueId: string, assignee: any) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, assigned_to: assignee } : issue
      )
    );
  };

  // ── Priority & Status config (same for both themes — colours are semantic) ──
  const priorityConfig: Record<string, { color: string; bg: string; bar: string; dot: string }> = {
    critical: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',       bar: 'bg-red-500',     dot: 'bg-red-400' },
    high:     { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   bar: 'bg-amber-500',   dot: 'bg-amber-400' },
    medium:   { color: 'text-cyan-500',    bg: 'bg-cyan-500/10 border-cyan-500/20',     bar: 'bg-cyan-500',    dot: 'bg-cyan-500' },
    low:      { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    resolved:    { label: 'Resolved',    color: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' },
    in_progress: { label: 'In Progress', color: 'bg-cyan-500/15 text-cyan-600 border border-cyan-500/30' },
    assigned:    { label: 'Assigned',    color: 'bg-amber-500/15 text-amber-600 border border-amber-500/30' },
    new:         { label: 'New',         color: isDark ? 'bg-slate-500/15 text-slate-400 border border-slate-500/25' : 'bg-slate-100 text-slate-600 border border-slate-300' },
    closed:      { label: 'Closed',      color: isDark ? 'bg-slate-700/40 text-slate-500 border border-slate-600/25' : 'bg-slate-200 text-slate-500 border border-slate-300' },
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    const params: Record<string, string | number> = { skip: 0, limit: pageSize };
    if (tab === 'Critical') params.priority = 'critical';
    else if (tab === 'High') params.priority = 'high';
    else if (tab === 'Medium') params.priority = 'medium';
    else if (tab === 'In Progress') params.status = 'in_progress';
    await fetchIssues(params);
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    const skip = (page - 1) * pageSize;
    const params: Record<string, string | number> = { skip, limit: pageSize };
    if (activeTab === 'Critical') params.priority = 'critical';
    else if (activeTab === 'High') params.priority = 'high';
    else if (activeTab === 'Medium') params.priority = 'medium';
    else if (activeTab === 'In Progress') params.status = 'in_progress';
    await fetchIssues(params);
  };

  const totalPages = Math.max(1, Math.ceil(totalIssues / pageSize));

  // ── 🎨 THEME TOKENS ──────────────────────────────────────────────────────────
  // This is the heart of the theme system. All visual differences live here.
  // If you want to tweak a colour, you change it in ONE place, not scattered
  // across hundreds of JSX attributes.
  // ─────────────────────────────────────────────────────────────────────────────
  const t = isDark ? {
    // Root
    root:               'bg-[#080c14] text-white',
    fontFamily:         "'DM Sans', 'Sora', system-ui, sans-serif",

    // Sidebar
    sidebar:            'border-white/[0.05]',
    sidebarBg:          'linear-gradient(180deg, #0d1420 0%, #080c14 100%)',
    logoBorder:         'border-white/[0.05]',
    logoSubtext:        'text-cyan-500/70',
    navSectionLabel:    'text-slate-600',
    navActive:          'text-cyan-400 border-cyan-400',
    navActiveBg:        'linear-gradient(90deg, rgba(6,182,212,0.12) 0%, transparent 100%)',
    navInactive:        'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]',
    navIconActive:      'text-cyan-400',
    navIconInactive:    'text-slate-600 group-hover:text-slate-400',
    userSectionBorder:  'border-white/[0.05]',
    userMenuBg:         'bg-[#131c2e] border-white/[0.08]',
    userMenuDivider:    'border-white/[0.06]',
    userMenuName:       'text-white',
    userMenuEmail:      'text-slate-500',
    userMenuCompany:    'text-cyan-500/70',
    signOutBtn:         'text-slate-400 hover:text-red-400 hover:bg-red-500/5',
    userName:           'text-white',
    userRole:           'text-slate-500',
    mobileToggle:       'bg-slate-800 border-slate-700 text-slate-300',

    // Top bar
    topBar:             'border-white/[0.05]',
    topBarBg:           'rgba(8,12,20,0.9)',
    topBarTitle:        'text-white',
    breadcrumb:         'text-slate-600',
    searchBg:           'bg-slate-800/60 border-white/[0.07]',
    searchText:         'text-slate-300 placeholder:text-slate-600',
    searchFocus:        'focus:border-cyan-500/40 focus:ring-cyan-500/20',
    notifBtn:           'bg-slate-800/60 border-white/[0.07] hover:border-white/[0.12]',
    notifIcon:          'text-slate-400',

    // Cards
    cardBg:             'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    cardBorder:         'border-white/[0.06]',
    cardLabel:          'text-slate-500',
    cardValue:          'text-white',

    // Table panel
    tablePanelBg:       'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    tablePanelBorder:   'border-white/[0.06]',
    tableHeaderBorder:  'border-white/[0.05]',
    tablePanelTitle:    'text-white',
    tablePanelCount:    'text-slate-600',
    tabActive:          'bg-cyan-500 text-slate-900',
    tabInactive:        'bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.07] border border-white/[0.05]',
    thText:             'text-slate-600',
    rowBorder:          'border-white/[0.03]',
    rowHoverBg:         'rgba(6,182,212,0.03)',
    issueTitleText:     'text-white/90',
    issueLocText:       'text-slate-600',
    descText:           'text-slate-500',
    assignedText:       'text-slate-400',
    dateText:           'text-slate-600',
    emptyText:          'text-slate-600',
    unassignedText:     'text-slate-700 italic',

    // Right sidebar
    sidePanelBg:        'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    sidePanelBorder:    'border-white/[0.06]',
    sidePanelTitle:     'text-white',
    sidePanelDivider:   'border-white/[0.05]',
    actionItemBg:       'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.04] hover:border-white/[0.08]',
    actionItemLabel:    'text-white/80 group-hover:text-white',
    actionItemDesc:     'text-slate-600',
    actionItemArrow:    'text-slate-700 group-hover:text-slate-500',
    activityText:       'text-slate-300',
    activityTime:       'text-slate-700',

    // System status
    statusPanelBg:      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    statusPanelBorder:  'border-white/[0.06]',
    statusPanelTitle:   'text-white',
    statusLabel:        'text-slate-500',
    statusValue:        'text-slate-400',
    statusBarTrack:     'bg-white/[0.05]',

    // Theme toggle
    toggleBg:           'bg-slate-800/60 border-white/[0.07] hover:border-white/[0.12]',
    toggleIcon:         '☀️',
    toggleLabel:        'Light mode',
  } : {
    // Root
    root:               'bg-slate-50 text-slate-900',
    fontFamily:         "'DM Sans', 'Sora', system-ui, sans-serif",

    // Sidebar
    sidebar:            'border-slate-200',
    sidebarBg:          '#ffffff',
    logoBorder:         'border-slate-200',
    logoSubtext:        'text-cyan-600/80',
    navSectionLabel:    'text-slate-400',
    navActive:          'text-cyan-600 border-cyan-600',
    navActiveBg:        'linear-gradient(90deg, rgba(8,145,178,0.08) 0%, transparent 100%)',
    navInactive:        'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
    navIconActive:      'text-cyan-600',
    navIconInactive:    'text-slate-400 group-hover:text-slate-600',
    userSectionBorder:  'border-slate-200',
    userMenuBg:         'bg-white border-slate-200',
    userMenuDivider:    'border-slate-100',
    userMenuName:       'text-slate-900',
    userMenuEmail:      'text-slate-500',
    userMenuCompany:    'text-cyan-600/80',
    signOutBtn:         'text-slate-500 hover:text-red-500 hover:bg-red-50',
    userName:           'text-slate-900',
    userRole:           'text-slate-400',
    mobileToggle:       'bg-white border-slate-200 text-slate-700',

    // Top bar
    topBar:             'border-slate-200',
    topBarBg:           'rgba(248,250,252,0.95)',
    topBarTitle:        'text-slate-900',
    breadcrumb:         'text-slate-400',
    searchBg:           'bg-white border-slate-200',
    searchText:         'text-slate-700 placeholder:text-slate-400',
    searchFocus:        'focus:border-cyan-400 focus:ring-cyan-400/20',
    notifBtn:           'bg-white border-slate-200 hover:border-slate-300',
    notifIcon:          'text-slate-500',

    // Cards
    cardBg:             '#ffffff',
    cardBorder:         'border-slate-200',
    cardLabel:          'text-slate-500',
    cardValue:          'text-slate-900',

    // Table panel
    tablePanelBg:       '#ffffff',
    tablePanelBorder:   'border-slate-200',
    tableHeaderBorder:  'border-slate-100',
    tablePanelTitle:    'text-slate-900',
    tablePanelCount:    'text-slate-400',
    tabActive:          'bg-cyan-500 text-white',
    tabInactive:        'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 border border-slate-200',
    thText:             'text-slate-400',
    rowBorder:          'border-slate-100',
    rowHoverBg:         'rgba(8,145,178,0.03)',
    issueTitleText:     'text-slate-800',
    issueLocText:       'text-slate-400',
    descText:           'text-slate-500',
    assignedText:       'text-slate-600',
    dateText:           'text-slate-400',
    emptyText:          'text-slate-400',
    unassignedText:     'text-slate-400 italic',

    // Right sidebar
    sidePanelBg:        '#ffffff',
    sidePanelBorder:    'border-slate-200',
    sidePanelTitle:     'text-slate-900',
    sidePanelDivider:   'border-slate-100',
    actionItemBg:       'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300',
    actionItemLabel:    'text-slate-700 group-hover:text-slate-900',
    actionItemDesc:     'text-slate-400',
    actionItemArrow:    'text-slate-300 group-hover:text-slate-500',
    activityText:       'text-slate-700',
    activityTime:       'text-slate-400',

    // System status
    statusPanelBg:      '#ffffff',
    statusPanelBorder:  'border-slate-200',
    statusPanelTitle:   'text-slate-900',
    statusLabel:        'text-slate-500',
    statusValue:        'text-slate-600',
    statusBarTrack:     'bg-slate-100',

    // Theme toggle
    toggleBg:           'bg-white border-slate-200 hover:border-slate-300',
    toggleIcon:         '🌙',
    toggleLabel:        'Dark mode',
  };

  // ── Loading / error / no-user states ─────────────────────────────────────────
  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-2 border-teal-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className={`text-sm tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading PlantSync
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-[#0a0f1a]' : 'bg-slate-50'}`}>
        <div className={`text-center max-w-md p-8 rounded-2xl border border-red-500/20 ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-lg'}`}>
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Something went wrong
          </h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold text-sm transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}

        {/* Top Bar */}
        <div
          className={`border-b px-4 lg:px-8 py-4 sticky top-0 z-40 backdrop-blur-md ${t.topBar}`}
          style={{ background: t.topBarBg }}
        >
          <div className="flex justify-between items-center">
            <div className="ml-12 lg:ml-0">
              <h1 className={`text-xl lg:text-2xl font-bold tracking-tight ${t.topBarTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Dashboard
              </h1>
              <div className={`text-[10px] mt-0.5 tracking-wide ${t.breadcrumb}`}>HOME › DASHBOARD</div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>⊘</span>
                <input
                  type="text"
                  placeholder="Search issues, equipment..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setActiveTab('All'); }}
                  className={`w-[180px] lg:w-[280px] pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${t.searchBg} ${t.searchText} ${t.searchFocus}`}
                />
              </div>

              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                title={t.toggleLabel}
                className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${t.toggleBg}`}
              >
                <span className="text-sm">{t.toggleIcon}</span>
              </button>

              {/* Notifications */}
              <button className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${t.notifBtn}`}>
                <span className={`text-sm ${t.notifIcon}`}>🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full badge-dot border-2 ${isDark ? 'border-[#080c14]' : 'border-white'}"></span>
              </button>

              {/* New Issue — only for admin / manager / operator */}
              {canCreateIssue && (
                <button
                  onClick={handleNewIssue}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 glow-cyan"
                >
                  <span className="text-xs">+</span>
                  <span className="hidden sm:inline">New Issue</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Issues',    value: issues.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length, change: null, changeColor: 'text-emerald-500', icon: '◫', iconBg: 'from-cyan-500/20 to-cyan-600/5',    iconColor: 'text-cyan-500',    accent: isDark ? 'border-t-cyan-500/30' : 'border-t-cyan-400' },
              { label: 'Critical Priority', value: issues.filter((i) => i.priority === 'critical').length,                        change: null, changeColor: 'text-red-500',     icon: '⚠', iconBg: 'from-red-500/20 to-red-600/5',      iconColor: 'text-red-500',     accent: isDark ? 'border-t-red-500/30' : 'border-t-red-400' },
              { label: 'Resolved',          value: issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length, change: null, changeColor: 'text-emerald-500', icon: '⚡', iconBg: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-500', accent: isDark ? 'border-t-emerald-500/30' : 'border-t-emerald-400' },
              { label: 'Total Issues',      value: issues.length,                                                                 change: null, changeColor: 'text-emerald-500', icon: '◈', iconBg: 'from-violet-500/20 to-violet-600/5',  iconColor: 'text-violet-500',  accent: isDark ? 'border-t-violet-500/30' : 'border-t-violet-400' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`stat-card rounded-2xl p-5 border border-t-2 ${t.cardBorder} ${stat.accent}`}
                style={{ background: t.cardBg }}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-medium tracking-wide ${t.cardLabel}`}>{stat.label}</span>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center border ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                    <span className={`text-sm ${stat.iconColor}`}>{stat.icon}</span>
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-1.5 ${t.cardValue}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stat.value}
                </div>
                {stat.change && (
                  <div className={`text-xs font-medium ${stat.changeColor}`}>{stat.change}</div>
                )}
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

            {/* Issues Table */}
            <div
              className={`rounded-2xl border overflow-hidden ${t.tablePanelBorder}`}
              style={{ background: t.tablePanelBg }}
            >
              <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${t.tableHeaderBorder}`}>
                <div>
                  <h2 className={`text-sm font-semibold ${t.tablePanelTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                    Recent Issues
                  </h2>
                  <p className={`text-[10px] mt-0.5 ${t.tablePanelCount}`}>{issues.length} total records</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Critical', 'High', 'Medium', 'In Progress'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? t.tabActive : t.tabInactive}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${t.rowBorder}`}>
                      <th className="w-1"></th>
                      {['Priority', 'Issue', 'Description', 'Assigned To', 'Created By', 'Created At', 'Status'].map((h) => (
                        <th key={h} className={`px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-widest ${t.thText}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {issues.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={`px-5 py-12 text-center text-sm ${t.emptyText}`}>
                          No issues found
                        </td>
                      </tr>
                    ) : (
                      issues.map((issue) => {
                        const p = priorityConfig[issue.priority] || priorityConfig.low;
                        const s = statusConfig[issue.status] || statusConfig.new;
                        return (
                          <tr key={issue.id} className={`issue-row border-b cursor-pointer transition-all ${t.rowBorder}`}
                          onClick={() => setSelectedIssue(issue)}>
                            <td className="py-4 w-1">
                              <div className={`w-0.5 h-8 rounded-full ${p.bar} opacity-80`}></div>
                            </td>
                            <td className="px-5 py-4">
                              <div className={`flex items-center gap-1.5 text-xs font-semibold ${p.color}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`}></div>
                                {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className={`text-sm font-medium mb-0.5 ${t.issueTitleText}`}>{issue.title}</div>
                              <div className={`text-[10px] ${t.issueLocText}`}>{issue.location || 'No location'}</div>
                            </td>
                            <td className={`px-5 py-4 text-xs max-w-[160px] ${t.descText}`}>
                              <span className="line-clamp-2">{issue.description || '—'}</span>
                            </td>
                            <td className={`px-5 py-4 text-xs ${t.assignedText}`}>
                              {issue.assigned_to?.full_name || <span className={t.unassignedText}>Unassigned</span>}
                            </td>
                            <td className={`px-5 py-4 text-xs ${t.assignedText}`}>
                              {issue.created_by?.full_name || '—'}
                            </td>
                            <td className={`px-5 py-4 text-[10px] whitespace-nowrap ${t.dateText}`}>
                              {new Date(issue.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold ${s.color}`}>
                                {s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className={`px-5 py-3 border-t flex items-center justify-between ${t.tableHeaderBorder}`}>
                  <span className={`text-xs ${t.tablePanelCount}`}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : ''} ${t.tabInactive}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentPage >= totalPages ? 'opacity-40 cursor-not-allowed' : ''} ${t.tabInactive}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">

              {/* Quick Actions */}
              <div className={`rounded-2xl border overflow-hidden ${t.sidePanelBorder}`} style={{ background: t.sidePanelBg }}>
                <div className={`px-5 py-4 border-b ${t.sidePanelDivider}`}>
                  <h2 className={`text-sm font-semibold ${t.sidePanelTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>Quick Actions</h2>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    canCreateIssue && { icon: '+', label: 'New Issue',          desc: 'Report a problem',     color: 'text-cyan-500',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
                    ['admin', 'manager'].includes(user.role) && { icon: '◈', label: 'Assign Contractor',  desc: 'Manage assignments',   color: 'text-violet-500',  bg: 'bg-violet-500/10 border-violet-500/20' },
                    { icon: '⬗', label: 'Generate Report',   desc: 'Performance analytics', color: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/20' },
                  ].filter(Boolean).map((action, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${t.actionItemBg}`}>
                      <div className={`w-9 h-9 rounded-xl ${action.bg} border flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-sm ${action.color}`}>{action.icon}</span>
                      </div>
                      <div>
                        <div className={`text-xs font-semibold transition-colors ${t.actionItemLabel}`}>{action.label}</div>
                        <div className={`text-[10px] ${t.actionItemDesc}`}>{action.desc}</div>
                      </div>
                      <span className={`ml-auto text-xs transition-colors ${t.actionItemArrow}`}>›</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity — real data from issue history */}
              <div className={`rounded-2xl border overflow-hidden ${t.sidePanelBorder}`} style={{ background: t.sidePanelBg }}>
                <div className={`px-5 py-4 border-b ${t.sidePanelDivider}`}>
                  <h2 className={`text-sm font-semibold ${t.sidePanelTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>Recent Activity</h2>
                </div>
                <div className="p-4 space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className={`text-xs text-center py-4 ${t.activityTime}`}>No recent activity</p>
                  ) : (
                    recentActivity.map((entry: any) => {
                      const fieldColors: Record<string, string> = {
                        status:         'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
                        priority:       'bg-amber-500/10 text-amber-500 border-amber-500/20',
                        assigned_to_id: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
                      };
                      const fieldIcons: Record<string, string> = {
                        status: '◫', priority: '⚡', assigned_to_id: '◈',
                      };
                      const color = fieldColors[entry.field_changed] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
                      const icon = fieldIcons[entry.field_changed] || '◻';
                      const diff = (Date.now() - new Date(entry.created_at).getTime()) / 1000;
                      const timeAgo = diff < 60 ? 'just now'
                        : diff < 3600 ? `${Math.floor(diff / 60)}m ago`
                        : diff < 86400 ? `${Math.floor(diff / 3600)}h ago`
                        : new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

                      return (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg border ${color} flex items-center justify-center flex-shrink-0 text-xs mt-0.5`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium leading-snug ${t.activityText}`}>
                              {entry.user?.full_name || 'Someone'} changed {entry.field_changed.replace('_', ' ')} to {entry.new_value}
                            </div>
                            <div className={`text-[10px] mt-0.5 ${t.activityTime}`}>{timeAgo}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* System Status */}
              <div
                className={`rounded-2xl border p-4 ${t.statusPanelBorder}`}
                style={{ background: t.statusPanelBg }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className={`text-xs font-semibold ${t.statusPanelTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>System Status</h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full badge-dot"></div>
                    Operational
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'API Response',  value: '48ms',                   bar: 95, color: 'bg-emerald-500' },
                    { label: 'Database',      value: '12ms',                   bar: 99, color: 'bg-cyan-500' },
                    { label: 'Issue Queue',   value: `${issues.length} items`, bar: 60, color: 'bg-amber-500' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] ${t.statusLabel}`}>{s.label}</span>
                        <span className={`text-[10px] font-medium ${t.statusValue}`}>{s.value}</span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${t.statusBarTrack}`}>
                        <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.bar}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
        {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onStatusUpdate={handleIssueStatusUpdate}
          onPriorityUpdate={handleIssuePriorityUpdate}
          onAssigneeUpdate={handleAssigneeUpdate}
        />
      )}
        {showNewIssueModal && (
        <NewIssueModal
        onClose={() => setShowNewIssueModal(false)}
        onIssueCreated={handleIssueCreated}
        />
        )}
      </>
  );
}

export default Dashboard;