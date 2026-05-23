import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { projectsAPI, companiesAPI } from '../services/api';
import NewProjectModal from '../components/NewProjectModal';
import type { User } from '../types/user';

interface Company {
  id: string;
  name: string;
  company_type: 'plant' | 'contractor';
}

interface CompanyBrief {
  id: string;
  name: string;
  company_type: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  plant_id: string;
  contractor_id: string;
  plant?: CompanyBrief;
  contractor?: CompanyBrief;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export default function Projects() {
  const { isDark } = useTheme();
  const { user } = useOutletContext<{ user: User }>();
  const canManage = ['admin', 'manager'].includes(user.role);

  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [projectsData, companiesData] = await Promise.all([
          projectsAPI.getAllProjects(),
          companiesAPI.getAllCompanies(),
        ]);
        setProjects(projectsData);
        setCompanies(companiesData);
      } catch (err) {
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  // Theme tokens
  const t = isDark ? {
    title:       'text-white',
    breadcrumb:  'text-slate-600',
    panelBg:     'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    panelBorder: 'border-white/[0.06]',
    headerBorder:'border-white/[0.05]',
    panelTitle:  'text-white',
    panelCount:  'text-slate-600',
    thText:      'text-slate-600',
    rowBorder:   'border-white/[0.03]',
    rowText:     'text-slate-300',
    rowMuted:    'text-slate-500',
    emptyText:   'text-slate-600',
  } : {
    title:       'text-slate-900',
    breadcrumb:  'text-slate-400',
    panelBg:     '#ffffff',
    panelBorder: 'border-slate-200',
    headerBorder:'border-slate-100',
    panelTitle:  'text-slate-900',
    panelCount:  'text-slate-400',
    thText:      'text-slate-400',
    rowBorder:   'border-slate-100',
    rowText:     'text-slate-700',
    rowMuted:    'text-slate-500',
    emptyText:   'text-slate-400',
  };

  return (
    <>
      {/* Top bar */}
      <div
        className={`border-b px-4 lg:px-8 py-4 sticky top-0 z-40 backdrop-blur-md ${isDark ? 'border-white/[0.05]' : 'border-slate-200'}`}
        style={{ background: isDark ? 'rgba(8,12,20,0.9)' : 'rgba(248,250,252,0.95)' }}
      >
        <div className="flex justify-between items-center">
          <div className="ml-12 lg:ml-0">
            <h1 className={`text-xl lg:text-2xl font-bold tracking-tight ${t.title}`} style={{ fontFamily: "'Sora', sans-serif" }}>
              Projects
            </h1>
            <div className={`text-[10px] mt-0.5 tracking-wide ${t.breadcrumb}`}>HOME › MANAGEMENT › PROJECTS</div>
          </div>
          {canManage && (
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 glow-cyan"
            >
              <span className="text-xs">+</span>
              <span className="hidden sm:inline">New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 lg:p-8">
        <div className={`rounded-2xl border overflow-hidden ${t.panelBorder}`} style={{ background: t.panelBg }}>
          <div className={`px-5 py-4 border-b ${t.headerBorder}`}>
            <h2 className={`text-sm font-semibold ${t.panelTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
              All Projects
            </h2>
            <p className={`text-[10px] mt-0.5 ${t.panelCount}`}>{projects.length} total</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${t.rowBorder}`}>
                  {['Project', 'Plant', 'Contractor', 'Start', 'End', 'Created'].map((h) => (
                    <th key={h} className={`px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-widest ${t.thText}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className={`px-5 py-12 text-center text-sm ${t.emptyText}`}>Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-red-400">{error}</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={6} className={`px-5 py-12 text-center text-sm ${t.emptyText}`}>
                    No projects yet. Click "New Project" to add one.
                  </td></tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className={`border-b ${t.rowBorder}`}>
                      <td className={`px-5 py-4 text-sm font-medium ${t.rowText}`}>
                        <div>{p.name}</div>
                        {p.description && (
                          <div className={`text-[10px] mt-0.5 ${t.rowMuted}`}>{p.description}</div>
                        )}
                      </td>
                      <td className={`px-5 py-4 text-xs ${t.rowText}`}>{p.plant?.name || '—'}</td>
                      <td className={`px-5 py-4 text-xs ${t.rowText}`}>{p.contractor?.name || '—'}</td>
                      <td className={`px-5 py-4 text-[10px] whitespace-nowrap ${t.rowMuted}`}>
                        {p.start_date ? new Date(p.start_date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className={`px-5 py-4 text-[10px] whitespace-nowrap ${t.rowMuted}`}>
                        {p.end_date ? new Date(p.end_date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className={`px-5 py-4 text-[10px] whitespace-nowrap ${t.rowMuted}`}>
                        {new Date(p.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNewModal && (
        <NewProjectModal
          companies={companies}
          onClose={() => setShowNewModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </>
  );
}