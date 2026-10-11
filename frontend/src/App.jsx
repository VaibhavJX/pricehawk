import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Compare from './pages/Compare';
import Settings from './pages/Settings';
import Login from './pages/Login';

/**
 * App — root router for PriceHawk.
 * Routes:
 *   /           → Dashboard (tracked products)
 *   /discover   → Deal Discovery
 *   /compare    → Price Comparison
 *   /settings   → Settings & Notifications
 *   /login      → Login / Register
 */
const App = () => {
  const initTheme = useStore((s) => s.initTheme);
  const user = useStore((s) => s.user);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-apple-lg)',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            iconTheme: { primary: '#34C759', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#FF3B30', secondary: 'white' },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

          {/* Protected routes under shared Layout */}
          <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
