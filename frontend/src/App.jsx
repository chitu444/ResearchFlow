import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

// Lazy loaded page components for bundle splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Experiments = lazy(() => import('./pages/Experiments'));
const ExperimentDetail = lazy(() => import('./pages/ExperimentDetail'));
const Equipment = lazy(() => import('./pages/Equipment'));
const Reservations = lazy(() => import('./pages/Reservations'));
const Datasets = lazy(() => import('./pages/Datasets'));
const DatasetDetail = lazy(() => import('./pages/DatasetDetail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Labs = lazy(() => import('./pages/Labs'));
const Users = lazy(() => import('./pages/Users'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));

function Protected({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading ResearchFlow…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Suspense fallback={<div className="loading">Loading interface…</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="experiments" element={<Experiments />} />
          <Route path="experiments/:id" element={<ExperimentDetail />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="datasets/:id" element={<DatasetDetail />} />

          <Route
            path="analytics"
            element={
              <Protected roles={['lab_manager', 'institution_admin']}>
                <Analytics />
              </Protected>
            }
          />

          <Route
            path="labs"
            element={
              <Protected roles={['institution_admin']}>
                <Labs />
              </Protected>
            }
          />

          <Route
            path="users"
            element={
              <Protected roles={['institution_admin']}>
                <Users />
              </Protected>
            }
          />

          <Route
            path="audit"
            element={
              <Protected roles={['institution_admin']}>
                <AuditLogs />
              </Protected>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
