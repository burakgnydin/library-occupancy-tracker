import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LibrariesPage from './pages/LibrariesPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import StaffPage from './pages/StaffPage';

// Rota degistiginde sade bir fade (+ hafif bir yukari kayma) efekti - AnimatePresence'in
// eski sayfayi kaldirirken/yeni sayfayi eklerken animasyonu tamamlamasini bekleyebilmesi
// icin `location`'i hem useLocation'dan okuyup HEM de <Routes location={location}> olarak
// acikca gecmek gerekiyor (aksi halde <Routes> URL degisir degismez hemen yeni eslesen
// route'u render eder, cikis animasyonuna firsat kalmadan). "wait" modu yerine varsayilan
// (es zamanli) mod kullaniliyor - cikis/giris ust uste binmesin diye, cikis suresi girisin
// yarisi kadar kisa tutulup toplam gecis suresi ~150-200ms araliginda kaliyor.
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } }}
      >
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/libraries"
            element={
              <ProtectedRoute roles={['SuperAdmin', 'Admin']}>
                <LibrariesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute roles={['SuperAdmin']}>
                <StaffPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
