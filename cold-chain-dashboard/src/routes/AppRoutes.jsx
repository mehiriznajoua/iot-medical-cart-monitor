import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AlertCenterPage from '../pages/AlertCenterPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import TrolleyDetailsPage from '../pages/TrolleyDetailsPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="trolley/:id" element={<TrolleyDetailsPage />} />
        <Route path="alerts" element={<AlertCenterPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
