import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { companiesAPI } from '../services/api';
import NewContractorModal from '../components/NewContractorModal.tsx';

interface Company {
  id: string;
  name: string;
  company_type: 'plant' | 'contractor';
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export default function Contractors() {
  const { isDark } = useTheme();

  const [contractors, setContractors] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // 🎓 Fetch on mount, filter to contractors only
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await companiesAPI.getAllCompanies();
        setContractors(data.filter((c: Company) => c.company_type === 'contractor'));
      } catch (err) {
        setError('Failed to load contractors.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Called by the modal on success — prepend so newest appears first
  const handleContractorCreated = (newContractor: Company) => {
    setContractors((prev) => [newContractor, ...prev]);
  };

  // Theme tokens — only what this page needs
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
    activePill:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    inactivePill:'bg-slate-700/40 text-slate-500 border border-slate-600/25',
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
    activePill:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
    inactivePill:'bg-slate-100 text-slate-500 border border-slate-200',
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
              Contractors
            </h1>
            <div className={`text-[10px] mt-0.5 tracking-wide ${t.breadcrumb}`}>HOME › MANAGEMENT › CONTRACTORS</div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 glow-cyan"
          >
            <span className="text-xs">+</span>
            <span className="hidden sm:inline">New Contractor</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 lg:p-8">
        <div className={`rounded-2xl border overflow-hidden ${t.panelBorder}`} style={{ background: t.panelBg }}>
          <div className={`px-5 py-4 border-b ${t.headerBorder}`}>
            <h2 className={`text-sm font-semibold ${t.panelTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
              All Contractors
            </h2>
            <p className={`text-[10px] mt-0.5 ${t.panelCount}`}>{contractors.length} total</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${t.rowBorder}`}>
                  {['Name', 'Email', 'Phone', 'Status', 'Created'].map((h) => (
                    <th key={h} className={`px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-widest ${t.thText}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className={`px-5 py-12 text-center text-sm ${t.emptyText}`}>Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-red-400">{error}</td></tr>
                ) : contractors.length === 0 ? (
                  <tr><td colSpan={5} className={`px-5 py-12 text-center text-sm ${t.emptyText}`}>
                    No contractors yet. Click "New Contractor" to add one.
                  </td></tr>
                ) : (
                  contractors.map((c) => (
                    <tr key={c.id} className={`border-b ${t.rowBorder}`}>
                      <td className={`px-5 py-4 text-sm font-medium ${t.rowText}`}>{c.name}</td>
                      <td className={`px-5 py-4 text-xs ${t.rowMuted}`}>{c.email || '—'}</td>
                      <td className={`px-5 py-4 text-xs ${t.rowMuted}`}>{c.phone || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold ${c.is_active ? t.activePill : t.inactivePill}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-[10px] whitespace-nowrap ${t.rowMuted}`}>
                        {new Date(c.created_at).toLocaleDateString('en-GB')}
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
        <NewContractorModal
          onClose={() => setShowNewModal(false)}
          onContractorCreated={handleContractorCreated}
        />
      )}
    </>
  );
}