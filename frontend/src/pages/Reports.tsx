import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { issuesAPI } from '../services/api';
import type { User } from '../types/user';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

export default function Reports() {
  const { isDark } = useTheme();
  const { user } = useOutletContext<{ user: User }>();

  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await issuesAPI.getAllIssues({ limit: 200 });
        setIssues(result.data);
      } catch (err) {
        console.error('Failed to load issues for reports:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Compute chart data ────────────────────────────────────────────────────

  // Issues by status
  const statusCounts = issues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Issues by priority
  const priorityCounts = issues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.priority] = (acc[issue.priority] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

  // Issues created per week (last 12 weeks)
  const weeklyData = (() => {
    const weeks: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      weeks[label] = 0;
    }
    issues.forEach((issue) => {
      const created = new Date(issue.created_at);
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 84) {
        const weekIndex = Math.floor(diffDays / 7);
        const labels = Object.keys(weeks);
        const idx = labels.length - 1 - weekIndex;
        if (idx >= 0 && idx < labels.length) {
          weeks[labels[idx]]++;
        }
      }
    });
    return Object.entries(weeks).map(([week, count]) => ({ week, count }));
  })();

  // Resolution time distribution (in hours)
  const resolutionData = (() => {
    const buckets = [
      { label: '<1h', min: 0, max: 1, count: 0 },
      { label: '1-4h', min: 1, max: 4, count: 0 },
      { label: '4-12h', min: 4, max: 12, count: 0 },
      { label: '12-24h', min: 12, max: 24, count: 0 },
      { label: '1-3d', min: 24, max: 72, count: 0 },
      { label: '3d+', min: 72, max: Infinity, count: 0 },
    ];
    issues.forEach((issue) => {
      if (issue.resolved_at && issue.created_at) {
        const hours = (new Date(issue.resolved_at).getTime() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60);
        const bucket = buckets.find((b) => hours >= b.min && hours < b.max);
        if (bucket) bucket.count++;
      }
    });
    return buckets.map(({ label, count }) => ({ label, count }));
  })();

  // ── Colours ───────────────────────────────────────────────────────────────

  const STATUS_COLORS: Record<string, string> = {
    new: '#64748b', assigned: '#f59e0b', in_progress: '#06b6d4',
    resolved: '#10b981', closed: '#475569',
  };

  const PRIORITY_COLORS: Record<string, string> = {
    low: '#10b981', medium: '#06b6d4', high: '#f59e0b', critical: '#ef4444',
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────

  const t = isDark ? {
    title:       'text-white',
    breadcrumb:  'text-slate-600',
    cardBg:      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    cardBorder:  'border-white/[0.06]',
    cardTitle:   'text-white',
    emptyText:   'text-slate-600',
    tooltipBg:   '#131c2e',
    tooltipText: '#e2e8f0',
    axisColor:   '#475569',
    gridColor:   'rgba(255,255,255,0.04)',
  } : {
    title:       'text-slate-900',
    breadcrumb:  'text-slate-400',
    cardBg:      '#ffffff',
    cardBorder:  'border-slate-200',
    cardTitle:   'text-slate-900',
    emptyText:   'text-slate-400',
    tooltipBg:   '#ffffff',
    tooltipText: '#1e293b',
    axisColor:   '#94a3b8',
    gridColor:   'rgba(0,0,0,0.04)',
  };

  const tooltipStyle = {
    backgroundColor: t.tooltipBg,
    color: t.tooltipText,
    border: 'none',
    borderRadius: '12px',
    fontSize: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    // Use fetch + blob so we can attach the auth header
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/issues/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'issues.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Export failed:', err));
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
              Reports
            </h1>
            <div className={`text-[10px] mt-0.5 tracking-wide ${t.breadcrumb}`}>HOME › MANAGEMENT › REPORTS</div>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 glow-cyan"
          >
            <span className="text-xs">↓</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 lg:p-8">
        {loading ? (
          <div className={`text-center py-20 text-sm ${t.emptyText}`}>Loading reports...</div>
        ) : issues.length === 0 ? (
          <div className={`text-center py-20 text-sm ${t.emptyText}`}>
            No issue data yet. Create some issues to see reports.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Issues by Status */}
            <div className={`rounded-2xl border p-5 ${t.cardBorder}`} style={{ background: t.cardBg }}>
              <h3 className={`text-sm font-semibold mb-4 ${t.cardTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Issues by Status
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Issues by Priority */}
            <div className={`rounded-2xl border p-5 ${t.cardBorder}`} style={{ background: t.cardBg }}>
              <h3 className={`text-sm font-semibold mb-4 ${t.cardTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Issues by Priority
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Issues per week */}
            <div className={`rounded-2xl border p-5 ${t.cardBorder}`} style={{ background: t.cardBg }}>
              <h3 className={`text-sm font-semibold mb-4 ${t.cardTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Issues Created per Week (Last 12 Weeks)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: t.axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: t.axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Resolution time */}
            <div className={`rounded-2xl border p-5 ${t.cardBorder}`} style={{ background: t.cardBg }}>
              <h3 className={`text-sm font-semibold mb-4 ${t.cardTitle}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Resolution Time Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={resolutionData}>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: t.axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: t.axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
