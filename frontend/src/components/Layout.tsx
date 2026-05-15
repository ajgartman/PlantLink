import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import type { User } from '../types/user';
import Sidebar from './Sidebar';

export default function Layout() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🎓 Load user once on mount — same logic that was in Dashboard
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, []);

  // While user is loading, show a minimal spinner
  if (!user) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-[#080c14]' : 'bg-slate-50'}`}>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#080c14] text-white' : 'bg-slate-50 text-slate-900'
      }`}
      style={{ fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif" }}
    >
      {/* Global styles — moved out of Dashboard so every page gets them */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? '#1e293b' : '#e2e8f0'}; border-radius: 2px; }
        .logo-gradient { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%); }
        .glow-cyan { box-shadow: 0 0 20px rgba(6,182,212,0.2); }
        .badge-dot { animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-card { transition: all 0.25s ease; }
      `}</style>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm transition-colors ${
          isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* 🎓 Outlet renders whichever child route matches the URL */}
      <main className="lg:ml-[220px] flex-1 overflow-auto w-full">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}