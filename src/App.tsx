import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfirmProvider } from './context/ConfirmContext';
import { Home } from './pages/Home';
import { ManageCards } from './pages/ManageCards';
import { ManageStacks } from './pages/ManageStacks';
import { SettingsPage } from './pages/Settings';
import { Shop } from './pages/Shop';
import { Stats } from './pages/Stats';
import { Study } from './pages/Study';

export function App() {
  return (
    <ConfirmProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study" element={<Study />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/stacks" element={<ManageStacks />} />
        <Route path="/cards" element={<ManageCards />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ConfirmProvider>
  );
}
