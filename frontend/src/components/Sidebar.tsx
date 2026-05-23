import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { User } from '../types/user';

interface SidebarProps {
  user: User;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  issuesCount?: number;
}

// minRole: minimum roles that can see this item (empty = everyone)
const navItems = [
  { id: 'Dashboard',   icon: '▦', label: 'Dashboard',   section: 'main',   path: '/dashboard',   roles: [] as string[] },
  { id: 'Issues',      icon: '◫', label: 'Issues',      section: 'main',   path: '/issues',      roles: [] as string[] },
  { id: 'Plant Map',   icon: '⬡', label: 'Plant Map',   section: 'main',   path: '/plant-map',   roles: [] as string[] },
  { id: 'Contractors', icon: '◈', label: 'Contractors', section: 'manage', path: '/contractors', roles: ['admin', 'manager', 'operator'] },
  { id: 'Projects',    icon: '⬗', label: 'Projects',    section: 'manage', path: '/projects',    roles: ['admin', 'manager', 'operator'] },
  { id: 'Reports',     icon: '⬗', label: 'Reports',     section: 'manage', path: '/reports',     roles: ['admin', 'manager'] },
  { id: 'Files',       icon: '⬚', label: 'Files',       section: 'other',  path: '/files',       roles: [] as string[] },
  { id: 'Chat',        icon: '◻', label: 'Chat',        section: 'other',  path: '/chat',        roles: [] as string[] },
  { id: 'Settings',    icon: '◎', label: 'Settings',    section: 'other',  path: '/settings',    roles: ['admin', 'manager'] },
];

export default function Sidebar({ user, isSidebarOpen, setIsSidebarOpen, issuesCount = 0 }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = (name: string): string =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 🎓 Theme tokens — same pattern as Dashboard, just the sidebar subset
  const t = isDark ? {
    sidebar:           'border-white/[0.05]',
    sidebarBg:         'linear-gradient(180deg, #0d1420 0%, #080c14 100%)',
    logoBorder:        'border-white/[0.05]',
    logoSubtext:       'text-cyan-500/70',
    navSectionLabel:   'text-slate-600',
    navActive:         'text-cyan-400 border-cyan-400',
    navActiveBg:       'linear-gradient(90deg, rgba(6,182,212,0.12) 0%, transparent 100%)',
    navInactive:       'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]',
    navIconActive:     'text-cyan-400',
    navIconInactive:   'text-slate-600 group-hover:text-slate-400',
    userSectionBorder: 'border-white/[0.05]',
    userMenuBg:        'bg-[#131c2e] border-white/[0.08]',
    userMenuDivider:   'border-white/[0.06]',
    userMenuName:      'text-white',
    userMenuEmail:     'text-slate-500',
    userMenuCompany:   'text-cyan-500/70',
    signOutBtn:        'text-slate-400 hover:text-red-400 hover:bg-red-500/5',
    userName:          'text-white',
    userRole:          'text-slate-500',
    userHover:         'hover:bg-white/[0.04]',
    dotMuted:          'text-slate-600',
  } : {
    sidebar:           'border-slate-200',
    sidebarBg:         '#ffffff',
    logoBorder:        'border-slate-200',
    logoSubtext:       'text-cyan-600/80',
    navSectionLabel:   'text-slate-400',
    navActive:         'text-cyan-600 border-cyan-600',
    navActiveBg:       'linear-gradient(90deg, rgba(8,145,178,0.08) 0%, transparent 100%)',
    navInactive:       'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
    navIconActive:     'text-cyan-600',
    navIconInactive:   'text-slate-400 group-hover:text-slate-600',
    userSectionBorder: 'border-slate-200',
    userMenuBg:        'bg-white border-slate-200',
    userMenuDivider:   'border-slate-100',
    userMenuName:      'text-slate-900',
    userMenuEmail:     'text-slate-500',
    userMenuCompany:   'text-cyan-600/80',
    signOutBtn:        'text-slate-500 hover:text-red-500 hover:bg-red-50',
    userName:          'text-slate-900',
    userRole:          'text-slate-400',
    userHover:         'hover:bg-slate-100',
    dotMuted:          'text-slate-300',
  };

  // 🎓 URL-driven active state — replaces the old activeNavItem state
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`w-[220px] border-r flex flex-col fixed h-full z-50 transition-all duration-300 ${t.sidebar} ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{ background: t.sidebarBg }}
    >
      {/* Logo */}
      <div className={`px-5 py-6 border-b ${t.logoBorder}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex-shrink-0">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#lg1)" opacity="0.15"/>
              <rect x="4" y="4" width="40" height="40" rx="10" stroke="url(#lg1)" strokeWidth="1.5" fill="none"/>
              <path d="M13 24L21 32L35 16" stroke="url(#lg2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="lg1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22d3ee"/><stop offset="1" stopColor="#0891b2"/>
                </linearGradient>
                <linearGradient id="lg2" x1="13" y1="16" x2="35" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22d3ee"/><stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <span
              className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              PlantSync
            </span>
            <div className={`text-[9px] tracking-widest uppercase font-medium ${t.logoSubtext}`}>
              Issue Tracker
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-5">
        {(['main', 'manage', 'other'] as const).map((section) => {
          const labels: Record<string, string> = { main: 'Main', manage: 'Management', other: 'Other' };
          // Filter by section AND role visibility
          const items = navItems.filter(
            (n) => n.section === section && (n.roles.length === 0 || n.roles.includes(user.role))
          );
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <div className={`px-3 mb-2 text-[9px] font-semibold uppercase tracking-widest ${t.navSectionLabel}`}>
                {labels[section]}
              </div>
              {items.map((item) => {
                const active = isActive(item.path);
                return (
                    <a
                    key={item.id}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 group border-l-2 rounded-l-none ${
                      active ? t.navActive : `border-transparent ${t.navInactive}`
                    }`}
                    style={active ? { background: t.navActiveBg } : {}}
                  >
                    <span className={`text-base w-5 text-center transition-colors ${active ? t.navIconActive : t.navIconInactive}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.id === 'Issues' && issuesCount > 0 && (
                      <span className="ml-auto text-[9px] bg-cyan-500/15 text-cyan-500 border border-cyan-500/20 rounded-full px-1.5 py-0.5 font-semibold">
                        {issuesCount}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className={`p-3 border-t relative ${t.userSectionBorder}`}>
        <div
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${t.userHover}`}
        >
          <div className="w-8 h-8 rounded-lg logo-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate ${t.userName}`}>{user.full_name}</div>
            <div className={`text-[10px] capitalize ${t.userRole}`}>{user.role}</div>
          </div>
          <span className={`text-xs ${t.dotMuted}`}>⋮</span>
        </div>

        {showUserMenu && (
          <div className={`absolute bottom-full left-3 right-3 mb-2 rounded-xl shadow-2xl overflow-hidden border ${t.userMenuBg}`}>
            <div className={`px-4 py-3 border-b ${t.userMenuDivider}`}>
              <div className={`text-xs font-medium ${t.userMenuName}`}>{user.full_name}</div>
              <div className={`text-[10px] mt-0.5 ${t.userMenuEmail}`}>{user.email}</div>
              {user.company_name && (
                <div className={`text-[10px] mt-1 ${t.userMenuCompany}`}>⬡ {user.company_name}</div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-colors ${t.signOutBtn}`}
            >
              <span>→</span> Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}