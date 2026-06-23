import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Shell } from './components/Shell';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { SectorStoryPage } from './pages/SectorStoryPage';
import { SectorsPage } from './pages/SectorsPage';
import { SignalDetailPage } from './pages/SignalDetailPage';
import { SignalsFeedPage } from './pages/SignalsFeedPage';
import { TropelsPage } from './pages/TropelsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tropels" element={<TropelsPage />} />
          <Route path="signals" element={<SignalsFeedPage />} />
          <Route path="signals/:id" element={<SignalDetailPage />} />
          <Route path="sectors" element={<SectorsPage />} />
          <Route path="sectors/:id/story" element={<SectorStoryPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
