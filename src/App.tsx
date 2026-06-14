import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Role } from './types';
import { AUTH_ERROR_EVENT } from './api/client';
import { cn } from './utils/utils';

// Lazy loading of large dashboards
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard').then(m => ({ default: m.DriverDashboard })));

const DashboardSkeleton = () => (
  <div className="h-screen w-full flex flex-col bg-slate-50 animate-pulse" role="status" aria-label="Loading dashboard">
    <div className="h-16 bg-white border-b border-slate-100 w-full" />
    <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="h-32 bg-white rounded-3xl" />
      <div className="h-32 bg-white rounded-3xl" />
      <div className="h-32 bg-white rounded-3xl" />
      <div className="h-32 bg-white rounded-3xl" />
      <div className="md:col-span-3 h-[400px] bg-white rounded-3xl" />
      <div className="h-[400px] bg-white rounded-3xl" />
    </div>
  </div>
);

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: Role }) => {
  const { user, token } = useStore();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role && user.role !== Role.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useStore();
  const location = useLocation();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin/*" element={
            <ProtectedRoute role={Role.ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/order/*" element={
            <ProtectedRoute role={Role.CLIENT}>
              <ClientDashboard />
            </ProtectedRoute>
          } />

          <Route path="/driver/*" element={
            <ProtectedRoute role={Role.DRIVER}>
              <DriverDashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            !user ? <Navigate to="/login" replace /> : 
            user.role === Role.ADMIN ? <Navigate to="/admin" replace /> : 
            user.role === Role.DRIVER ? <Navigate to="/driver" replace /> : 
            <Navigate to="/order" replace />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const { logout, trackEvent, vendorType } = useStore();

  const themeClass = vendorType === 'PHARMA' ? 'theme-pharma' : 
                    vendorType === 'STATIONERY' ? 'theme-stationery' : 
                    'theme-dairy';

  useEffect(() => {
    const handleAuthError = () => {
      trackEvent('Session Expired', { source: 'Global Interceptor' });
      logout();
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, [logout, trackEvent]);

  useEffect(() => {
    // 1. Subscribe first to catch hydration completion
    const unsub = useStore.persist.onFinishHydration(() => {
      setReady(true);
    });

    // 2. Check if already hydrated immediately after subscribing to avoid race conditions
    if (useStore.persist.hasHydrated()) {
      setReady(true);
      unsub(); 
    }

    return unsub;
  }, []);

  if (!ready) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans" role="status" aria-label="Initializing Application">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Initializing MRT...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={cn("min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700", themeClass)}>
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;
