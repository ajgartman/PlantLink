import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout';
import Contractors from './pages/Contractors';
import Projects from './pages/Projects';
import Onboarding from './pages/Onboarding';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
        {title}
      </h1>
      <p className="text-sm text-slate-500 mt-2">More features coming soon!</p>
    </div>
  );
}

function App() {
  return (
      <ThemeProvider>
    <Routes>
      {/* Public routes — no layout, no auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Onboarding />} />

      {/* Protected routes — wrapped in auth + shared layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard"   element={<Dashboard />} />
        {/* Placeholder pages — we'll fill these in next */}
        <Route path="/contractors" element={<Contractors />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/issues"      element={<PlaceholderPage title="Issues" />} />
        <Route path="/plant-map"   element={<PlaceholderPage title="Plant Map" />} />
        <Route path="/reports"     element={<PlaceholderPage title="Reports" />} />
        <Route path="/files"       element={<PlaceholderPage title="Files" />} />
        <Route path="/chat"        element={<PlaceholderPage title="Chat" />} />
        <Route path="/settings"    element={<PlaceholderPage title="Settings" />} />
      </Route>

      {/* Catch-all — anything else → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </ThemeProvider>
  )
}

export default App