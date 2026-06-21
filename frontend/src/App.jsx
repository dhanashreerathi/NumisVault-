import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import FloatingSymbols from './components/layout/FloatingSymbols';
import { Toast } from './components/shared/Toast';
import { ConfirmModal } from './components/shared/Toast';
import { AlertModal } from './components/shared/Toast';
import AuthModal from './components/auth/AuthModal';

import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';
import ViewerPage from './pages/ViewerPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import ChatWidget from './components/shared/ChatWidget';
import SmartSearchPage from './pages/SmartSearchPage';
import AnalyticsPage   from './pages/AnalyticsPage';
import ValuationPage   from './pages/ValuationPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, role, sessionChecked } = useAuth();
  const location = useLocation();

  if (!sessionChecked) return null;

  if (!user) {
    // Fire auth modal instead of hard redirect — preserves page context
    return <Navigate to="/" state={{ openAuth: true, intended: location.pathname }} replace />;
  }
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Wrapper that gives every page the correct max-width container
function PageWrapper({ children }) {
  return (
    <div style={{ width: '100%', maxWidth: 1400, animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
      {children}
    </div>
  );
}

export default function App() {
  const { fetchCollection, fetchCountries, toast, confirmModal, alertModal } = useApp();
  const { sessionChecked } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    const init = async () => {
      await fetchCountries();
      await fetchCollection();

      const params = new URLSearchParams(window.location.search);
      const itemId = params.get('item');
      if (itemId) {
        navigate(`/viewer?item=${itemId}`, { replace: true });
        return;
      }
      if (window.location.hash.includes('type=recovery')) {
        navigate('/settings', { state: { passwordRecovery: true }, replace: true });
      }
    };
    init();
  }, []); // eslint-disable-line

  // Open auth modal when redirected with openAuth state
  useEffect(() => {
    if (location.state?.openAuth) {
      window.dispatchEvent(new CustomEvent('nv:openAuth', {
        detail: { tab: 'login', intended: location.state.intended }
      }));
    }
  }, [location.state]);

  const isHome = location.pathname === '/';

  return (
    <>
      <div className="animated-bg" />
      <FloatingSymbols hidden={!isHome} />
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/gallery" element={
            <PageWrapper><GalleryPage /></PageWrapper>
          } />
          <Route path="/viewer" element={
            <PageWrapper><ViewerPage /></PageWrapper>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <PageWrapper><WishlistPage /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <PageWrapper><ProfilePage /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <PageWrapper><SettingsPage /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <PageWrapper><AdminPage /></PageWrapper>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />

          <Route path="/search"    element={<SmartSearchPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/valuation" element={
          <ProtectedRoute adminOnly><ValuationPage /></ProtectedRoute>
          } />
        </Routes>
      </main>

      <Footer />

      <AuthModal />
      {toast      && <Toast message={toast.msg} />}
      {confirmModal && <ConfirmModal {...confirmModal} />}
      {alertModal   && <AlertModal  {...alertModal}  />}
       <ChatWidget />
    </>
  );
}
