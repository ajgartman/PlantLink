import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { userAPI, issuesAPI } from '../services/api';
import type { User } from '../types/user';

function Dashboard() {
  const navigate = useNavigate();

  // 🎓 NEW: Real user data from API (replacing hardcoded values)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [issues, setIssues] = useState<any[]>([]);

  // Keep existing UI state
  const [activeTab, setActiveTab] = useState('All');
  const [activeNavItem, setActiveNavItem] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🎓 FETCH USER DATA - Replaces the TODO comment
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError('');

        const userData = await userAPI.getCurrentUser();
        setUser(userData);

      } catch (err: any) {
        console.error('Failed to fetch user:', err);

        if (err.response?.status !== 401) {
          setError('Failed to load user data. Please try again.');
        }

      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
  const fetchIssues = async () => {
    try {
      const issuesData = await issuesAPI.getAllIssues();
      setIssues(issuesData);
      console.log('Fetched issues:', issuesData);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  fetchIssues();
}, []);

  // Helper function to get user initials from full name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

    const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

    const handleNewIssue = () => {
  console.log('Create new issue clicked');
};

  // 🎓 LOADING STATE - Show spinner while fetching
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2c5f8d] mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // 🎓 ERROR STATE - Show if fetch failed
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#2c5f8d] text-white rounded-lg font-semibold hover:bg-[#1e3a5f]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 🎓 SAFETY CHECK - Ensure user exists
  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <button
          onClick={() => navigate('/login')}
          className="text-blue-600 hover:underline"
        >
          Return to Login
        </button>
      </div>
    );
  }



  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center"
      >
        <span className="text-xl">{isSidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-[215px] bg-white border-r border-gray-200 flex flex-col fixed h-full z-50 transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="relative w-10 h-10">
              {/* Factory Building */}
              <div className="absolute w-4 h-4 bg-[#2c5f8d] rounded top-0 left-0">
                <div className="absolute -top-1.5 left-1 w-1 h-2 bg-[#2c5f8d]"></div>
                <div className="absolute -top-1.5 right-1 w-1 h-2 bg-[#2c5f8d]"></div>
              </div>
              {/* Link */}
              <div className="absolute w-6 h-0.5 bg-[#4a90e2] top-4 left-2 rounded">
                <div className="absolute w-1.5 h-1.5 bg-[#4a90e2] rounded-full -left-1 -top-0.5"></div>
                <div className="absolute w-1.5 h-1.5 bg-[#4a90e2] rounded-full -right-1 -top-0.5"></div>
              </div>
              {/* Person */}
              <div className="absolute w-3 h-3 bg-[#4a90e2] rounded-full bottom-1 right-1">
                <div className="absolute w-3.5 h-2 bg-[#4a90e2] rounded-t-full -bottom-2 -left-0.5"></div>
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">Fixtura</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-5 overflow-y-auto">
          {/* Main Section */}
          <div className="mb-8">
            <div className="px-5 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Dashboard'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Dashboard'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">📊</span>
              <span>Dashboard</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Issues'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Issues'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">📋</span>
              <span>Issues</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Plant Map'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Plant Map'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">🗺️</span>
              <span>Plant Map</span>
            </a>
          </div>

          {/* Management Section */}
          <div className="mb-8">
            <div className="px-5 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Management
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Contractors'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Contractors'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">👷</span>
              <span>Contractors</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Equipment'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Equipment'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">⚙️</span>
              <span>Equipment</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Reports'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Reports'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">📈</span>
              <span>Reports</span>
            </a>
          </div>

          {/* Other Section */}
          <div>
            <div className="px-5 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Other
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Files'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Files'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">📁</span>
              <span>Files</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Chat'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Chat'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">💬</span>
              <span>Chat</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveNavItem('Settings'); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all border-l-3 ${
                activeNavItem === 'Settings'
                  ? 'bg-blue-50 text-[#2c5f8d] border-[#2c5f8d]'
                  : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-[#2c5f8d]'
              }`}
            >
              <span className="text-xl w-6 text-center">⚙️</span>
              <span>Settings</span>
            </a>
          </div>
        </nav>

        {/* User Profile Section */}
<div className="p-5 border-t border-gray-200">
  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group relative">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2c5f8d] to-[#4a90e2] flex items-center justify-center text-white font-semibold text-sm">
      {getInitials(user.full_name)}
    </div>
    <div className="flex-1">
      <div className="font-semibold text-gray-900 text-sm">{user.full_name}</div>
      <div className="text-xs text-gray-400 capitalize">{user.role}</div>
    </div>

    {/* Dropdown Menu on Hover */}
    <div className="absolute bottom-full left-0 w-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1">
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
          {user.company_name && (
            <p className="text-xs text-gray-400 mt-1">🏢 {user.company_name}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </div>
</div>
</aside>  {/* ✅ KEEP THIS - Closes the sidebar */}

      {/* Main Content */}
      <main className="lg:ml-[185px] flex-1 overflow-auto w-full">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-10 py-4 lg:py-5 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
              <div className="text-xs lg:text-sm text-gray-400">Home › Dashboard</div>
            </div>

            <div className="flex items-center gap-2 lg:gap-5">
              {/* Search Box - Hidden on mobile */}
              <div className="relative hidden md:block">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search issues, equipment..."
                  className="w-[200px] lg:w-[350px] pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4a90e2] focus:ring-3 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Notification Button */}
              <button className="relative w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
                <span className="text-lg lg:text-xl">🔔</span>
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center border-2 border-white">
                  8
                </span>
              </button>

              {/* New Issue Button - Responsive */}
              <button
                onClick={handleNewIssue}
                className="px-3 lg:px-6 py-2.5 bg-[#2c5f8d] text-white rounded-lg text-sm font-semibold hover:bg-[#1e3a5f] transition-all flex items-center gap-2"
              >
                <span>➕</span>
                <span className="hidden sm:inline">New Issue</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-10">
          {/* Stats Grid - Responsive: 1 col mobile, 2 cols tablet, 4 cols desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Active Issues */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-gray-600 font-medium">Active Issues</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl">
                  📊
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">24</div>
              <div className="text-sm text-green-600 flex items-center gap-1">
                ↓ 12% from yesterday
              </div>
            </div>

            {/* Critical Priority */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-gray-600 font-medium">Critical Priority</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">5</div>
              <div className="text-sm text-red-600 flex items-center gap-1">
                ↑ 2 Needs attention
              </div>
            </div>

            {/* Avg Resolution Time */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-gray-600 font-medium">Avg Resolution Time</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-2xl">
                  ⚡
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">3.2 hrs</div>
              <div className="text-sm text-green-600 flex items-center gap-1">
                ↓ 16% this month
              </div>
            </div>

            {/* Downtime Cost */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-gray-600 font-medium">Downtime Cost (MTD)</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">$12.4k</div>
              <div className="text-sm text-green-600 flex items-center gap-1">
                ↓ 30% below target
              </div>
            </div>
          </div>

          {/* Content Grid - Responsive: Stack on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Recent Issues Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Issues</h2>
                <div className="flex gap-2 overflow-x-auto">
                  {['All', 'Critical', 'High', 'Medium', 'In Progress'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab
                          ? 'bg-[#2c5f8d] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-1"></th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                        {issues.map((issue) => (
                        <tr key={issue.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                          <td className="py-5">
                            <div className={`w-1 h-10 rounded ${
                              issue.priority === 'critical' ? 'bg-red-500' :
                              issue.priority === 'high' ? 'bg-orange-500' :
                              issue.priority === 'medium' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}></div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`font-semibold ${
                              issue.priority === 'critical' ? 'text-red-500' :
                              issue.priority === 'high' ? 'text-orange-500' :
                              issue.priority === 'medium' ? 'text-blue-500' :
                              'text-green-500'
                            }`}>
                              {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-semibold text-gray-900 text-sm mb-1">{issue.title}</div>
                            <div className="text-sm text-gray-600">{issue.location || 'No location'}</div>
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">{issue.description}</td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {issue.assigned_to_id || 'Not Specified'}
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {issue.created_by_id || 'Not Specified' }
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-700">
                            {new Date(issue.created_at).toLocaleString('en-GB', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                            })}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              issue.status === 'resolved' ? 'bg-green-100 text-green-900' :
                              issue.status === 'in_progress' ? 'bg-blue-100 text-blue-900' :
                              issue.status === 'assigned' ? 'bg-yellow-100 text-yellow-900' :
                              'bg-gray-100 text-gray-900'
                            }`}>
                              {issue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#2c5f8d] cursor-pointer transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                      ➕
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-0.5">New Issue</div>
                      <div className="text-xs text-gray-600">Report a problem</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#2c5f8d] cursor-pointer transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                      👷
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-0.5">Assign Contractor</div>
                      <div className="text-xs text-gray-600">Manage assignments</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#2c5f8d] cursor-pointer transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                      📊
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-0.5">Generate Report</div>
                      <div className="text-xs text-gray-600">Performance analytics</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center text-lg flex-shrink-0">
                      📋
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm mb-1">Issue #1234 resolved</div>
                      <div className="text-xs text-gray-400">3 min ago</div>
                    </div>
                  </div>

                  <div className="flex gap-4 pb-5 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-900 flex items-center justify-center text-lg flex-shrink-0">
                      🔄
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm mb-1">New issue created</div>
                      <div className="text-xs text-gray-400">15 min ago</div>
                    </div>
                  </div>

                  <div className="flex gap-4 pb-5 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-900 flex items-center justify-center text-lg flex-shrink-0">
                      💬
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm mb-1">Mike updated issue #1238</div>
                      <div className="text-xs text-gray-400">1 hour ago</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-900 flex items-center justify-center text-lg flex-shrink-0">
                      🔄
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm mb-1">Comment added to #1239</div>
                      <div className="text-xs text-gray-400">3 hours ago</div>
                    </div>
                  </div>
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