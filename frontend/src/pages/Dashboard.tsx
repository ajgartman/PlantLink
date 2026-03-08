import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { issuesAPI } from '../services/api';
import type { User } from '../types/user';

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [issues, setIssues] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('All');
  const [activeNavItem, setActiveNavItem] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const issuesData = await issuesAPI.getAllIssues();
        setIssues(issuesData);
      } catch (error) {
        console.error('Failed to fetch issues:', error);
        setError('Failed to load issues.');
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNewIssue = () => {
    console.log('Create new issue clicked');
  };

  const priorityConfig: Record<string, { color: string; bg: string; bar: string; dot: string }> = {
    critical: { color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20',   bar: 'bg-red-500',    dot: 'bg-red-400' },
    high:     { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-500', dot: 'bg-amber-400' },
    medium:   { color: 'text-cyan-400',  bg: 'bg-cyan-500/10 border-cyan-500/20',  bar: 'bg-cyan-500',   dot: 'bg-cyan-400' },
    low:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500', dot: 'bg-emerald-400' },
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    resolved:    { label: 'Resolved',    color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' },
    in_progress: { label: 'In Progress', color: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' },
    assigned:    { label: 'Assigned',    color: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' },
    new:         { label: 'New',         color: 'bg-slate-500/15 text-slate-400 border border-slate-500/25' },
    closed:      { label: 'Closed',      color: 'bg-slate-700/40 text-slate-500 border border-slate-600/25' },
  };

  const navItems = [
    { id: 'Dashboard',   icon: '▦',  label: 'Dashboard',   section: 'main' },
    { id: 'Issues',      icon: '◫',  label: 'Issues',       section: 'main' },
    { id: 'Plant Map',   icon: '⬡',  label: 'Plant Map',    section: 'main' },
    { id: 'Contractors', icon: '◈',  label: 'Contractors',  section: 'manage' },
    { id: 'Equipment',   icon: '⚙',  label: 'Equipment',    section: 'manage' },
    { id: 'Reports',     icon: '⬗',  label: 'Reports',      section: 'manage' },
    { id: 'Files',       icon: '⬚',  label: 'Files',        section: 'other' },
    { id: 'Chat',        icon: '◻',  label: 'Chat',         section: 'other' },
    { id: 'Settings',    icon: '◎',  label: 'Settings',     section: 'other' },
  ];

  const filteredIssues = activeTab === 'All'
    ? issues
    : issues.filter(i => {
        if (activeTab === 'In Progress') return i.status === 'in_progress';
        return i.priority === activeTab.toLowerCase();
      });

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0a0f1a] items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-2 border-teal-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Loading PlantSync</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[#0a0f1a] items-center justify-center">
        <div className="text-center max-w-md p-8 rounded-2xl bg-slate-800/50 border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-semibold text-sm transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-[#0a0f1a] items-center justify-center">
        <button onClick={() => navigate('/login')} className="text-cyan-400 hover:text-cyan-300 text-sm">
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080c14] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
        .nav-item-active { background: linear-gradient(90deg, rgba(6,182,212,0.12) 0%, transparent 100%); }
        .glass-card { background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%); backdrop-filter: blur(12px); }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-card { transition: all 0.25s ease; }
        .glow-cyan { box-shadow: 0 0 20px rgba(6,182,212,0.15); }
        .sidebar-bg { background: linear-gradient(180deg, #0d1420 0%, #080c14 100%); }
        .top-bar-bg { background: rgba(8,12,20,0.9); backdrop-filter: blur(16px); }
        tr.issue-row:hover td { background: rgba(6,182,212,0.03); }
        .logo-gradient { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%); }
        .noise::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; border-radius: inherit; }
        .badge-dot { animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      {/* Mobile Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <aside className={`sidebar-bg w-[220px] border-r border-white/[0.05] flex flex-col fixed h-full z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            {/* PlantSync SVG Logo */}
            <div className="w-9 h-9 flex-shrink-0">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#lg1)" opacity="0.15"/>
                <rect x="4" y="4" width="40" height="40" rx="10" stroke="url(#lg1)" strokeWidth="1.5" fill="none"/>
                <path d="M13 24L21 32L35 16" stroke="url(#lg2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="lg1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee"/>
                    <stop offset="1" stopColor="#0891b2"/>
                  </linearGradient>
                  <linearGradient id="lg2" x1="13" y1="16" x2="35" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee"/>
                    <stop offset="1" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white" style={{ fontFamily: "'Sora', sans-serif" }}>PlantSync</span>
              <div className="text-[9px] text-cyan-500/70 tracking-widest uppercase font-medium">Issue Tracker</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-5">
          {(['main', 'manage', 'other'] as const).map(section => {
            const labels: Record<string, string> = { main: 'Main', manage: 'Management', other: 'Other' };
            const items = navItems.filter(n => n.section === section);
            return (
              <div key={section}>
                <div className="px-3 mb-2 text-[9px] font-semibold text-slate-600 uppercase tracking-widest">{labels[section]}</div>
                {items.map(item => {
                  const active = activeNavItem === item.id;
                  return (
                    <a key={item.id} href="#" onClick={e => { e.preventDefault(); setActiveNavItem(item.id); setIsSidebarOpen(false); }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 group ${active ? 'nav-item-active text-cyan-400 border-l-2 border-cyan-400 rounded-l-none' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'}`}>
                      <span className={`text-base w-5 text-center transition-colors ${active ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {item.id === 'Issues' && issues.length > 0 && (
                        <span className="ml-auto text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 rounded-full px-1.5 py-0.5 font-semibold">{issues.length}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.05] relative">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-lg logo-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user.full_name}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user.role}</div>
            </div>
            <span className="text-slate-600 text-xs">⋮</span>
          </div>

          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#131c2e] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="text-xs font-medium text-white">{user.full_name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{user.email}</div>
                {user.company_name && <div className="text-[10px] text-cyan-500/70 mt-1">⬡ {user.company_name}</div>}
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/5 flex items-center gap-2 transition-colors"
              >
                <span>→</span> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────── */}
      <main className="lg:ml-[220px] flex-1 overflow-auto w-full">

        {/* Top Bar */}
        <div className="top-bar-bg border-b border-white/[0.05] px-4 lg:px-8 py-4 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                Dashboard
              </h1>
              <div className="text-[10px] text-slate-600 mt-0.5 tracking-wide">HOME › DASHBOARD</div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="relative hidden md:block">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs">⊘</span>
                <input
                  type="text"
                  placeholder="Search issues, equipment..."
                  className="w-[180px] lg:w-[280px] pl-9 pr-4 py-2 bg-slate-800/60 border border-white/[0.07] rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <button className="relative w-9 h-9 rounded-xl bg-slate-800/60 border border-white/[0.07] hover:border-white/[0.12] flex items-center justify-center transition-all">
                <span className="text-slate-400 text-sm">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full badge-dot border border-[#080c14]"></span>
              </button>
              <button
                onClick={handleNewIssue}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 glow-cyan"
              >
                <span className="text-xs">+</span>
                <span className="hidden sm:inline">New Issue</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Issues', value: issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length || 24, change: '↓ 12% from yesterday', changeColor: 'text-emerald-400', icon: '◫', iconBg: 'from-cyan-500/20 to-cyan-600/5', iconColor: 'text-cyan-400', accentColor: 'border-t-cyan-500/30' },
              { label: 'Critical Priority', value: issues.filter(i => i.priority === 'critical').length || 5, change: '↑ 2 need attention', changeColor: 'text-red-400', icon: '⚠', iconBg: 'from-red-500/20 to-red-600/5', iconColor: 'text-red-400', accentColor: 'border-t-red-500/30' },
              { label: 'Avg Resolution', value: '3.2 hrs', change: '↓ 16% this month', changeColor: 'text-emerald-400', icon: '⚡', iconBg: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400', accentColor: 'border-t-emerald-500/30' },
              { label: 'Downtime Cost', value: '$12.4k', change: '↓ 30% below target', changeColor: 'text-emerald-400', icon: '◈', iconBg: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-400', accentColor: 'border-t-violet-500/30' },
            ].map((stat, i) => (
              <div key={i} className={`stat-card glass-card rounded-2xl p-5 border border-white/[0.06] border-t-2 ${stat.accentColor} relative overflow-hidden noise`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs text-slate-500 font-medium tracking-wide">{stat.label}</span>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center border border-white/[0.06]`}>
                      <span className={`text-sm ${stat.iconColor}`}>{stat.icon}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1.5" style={{ fontFamily: "'Sora', sans-serif" }}>{stat.value}</div>
                  <div className={`text-xs font-medium ${stat.changeColor}`}>{stat.change}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

            {/* Issues Table */}
            <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.05] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Recent Issues</h2>
                  <p className="text-[10px] text-slate-600 mt-0.5">{issues.length} total records</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['All', 'Critical', 'High', 'Medium', 'In Progress'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? 'bg-cyan-500 text-slate-900' : 'bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.07] border border-white/[0.05]'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="w-1"></th>
                      <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Priority</th>
                      <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Issue</th>
                      <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Description</th>
                      <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Assigned To</th>
                      <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Created By</th>
                      <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Created At</th>
                      <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-600 text-sm">
                          No issues found
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map(issue => {
                        const p = priorityConfig[issue.priority] || priorityConfig.low;
                        const s = statusConfig[issue.status] || statusConfig.new;
                        return (
                          <tr key={issue.id} className="issue-row border-b border-white/[0.03] cursor-pointer transition-all">
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
                              <div className="text-sm font-medium text-white/90 mb-0.5">{issue.title}</div>
                              <div className="text-[10px] text-slate-600">{issue.location || 'No location'}</div>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500 max-w-[160px]">
                              <span className="line-clamp-2">{issue.description || '—'}</span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-400">
                              {issue.assigned_to?.full_name || <span className="text-slate-700 italic">Unassigned</span>}
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-400">
                              {issue.created_by?.full_name || '—'}
                            </td>
                            <td className="px-5 py-4 text-[10px] text-slate-600 whitespace-nowrap">
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
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">

              {/* Quick Actions */}
              <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Quick Actions</h2>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { icon: '+', label: 'New Issue', desc: 'Report a problem', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/15' },
                    { icon: '◈', label: 'Assign Contractor', desc: 'Manage assignments', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/15' },
                    { icon: '⬗', label: 'Generate Report', desc: 'Performance analytics', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15' },
                  ].map((action, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-all group">
                      <div className={`w-9 h-9 rounded-xl ${action.bg} border flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-sm ${action.color}`}>{action.icon}</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">{action.label}</div>
                        <div className="text-[10px] text-slate-600">{action.desc}</div>
                      </div>
                      <span className="ml-auto text-slate-700 group-hover:text-slate-500 transition-colors text-xs">›</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Recent Activity</h2>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { icon: '◫', text: 'Issue #1234 resolved', time: '3 min ago', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15' },
                    { icon: '↑', text: 'New issue created', time: '15 min ago', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
                    { icon: '◻', text: 'Mike updated issue #1238', time: '1 hour ago', color: 'bg-amber-500/10 text-amber-400 border-amber-500/15' },
                    { icon: '↑', text: 'Comment added to #1239', time: '3 hours ago', color: 'bg-violet-500/10 text-violet-400 border-violet-500/15' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg border ${item.color} flex items-center justify-center flex-shrink-0 text-xs mt-0.5`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300 font-medium leading-snug">{item.text}</div>
                        <div className="text-[10px] text-slate-700 mt-0.5">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div className="glass-card rounded-2xl border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>System Status</h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full badge-dot"></div>
                    Operational
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'API Response', value: '48ms', bar: 95, color: 'bg-emerald-500' },
                    { label: 'Database', value: '12ms', bar: 99, color: 'bg-cyan-500' },
                    { label: 'Issue Queue', value: `${issues.length} items`, bar: 60, color: 'bg-amber-500' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-500">{s.label}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{s.value}</span>
                      </div>
                      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.bar}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;