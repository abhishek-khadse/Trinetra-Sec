import { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Core Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import TimelinePage from './pages/TimelinePage';
import SettingsPage from './pages/SettingsPage';

// Module Pages
import FileScannerPage from './pages/FileScannerPage';
import ReverseXPage from './pages/ReverseXPage';
import DDoSShieldPage from './pages/DDoSShieldPage';
import PhishingDetectorPage from './pages/PhishingDetectorPage';
import ThreatFeedsPage from './pages/ThreatFeedsPage';
import APKScanPage from './pages/APKScanPage';
import ThreatStreamPage from './pages/ThreatStreamPage';
import CredentialWatchPage from './pages/CredentialWatchPage';
import SecureHealthViewPage from './pages/SecureHealthViewPage';
import AttackSimLabPage from './pages/AttackSimLabPage';

// Learning Center
import CaseStudiesPage from './pages/learn/CaseStudiesPage';
import QuizPage from './pages/learn/QuizPage';
import NotesPage from './pages/learn/NotesPage';
import FAQPage from './pages/learn/FAQPage';

// Knowledge Centers
import WebSecurityPage from './pages/web-security/WebSecurityPage';
import AppSecurityPage from './pages/app-security/AppSecurityPage';
import MobileSecurityPage from './pages/mobile-security/MobileSecurityPage';
import AISecurityPage from './pages/ai-security/AISecurityPage';
import CloudSecurityPage from './pages/cloud-security/CloudSecurityPage';
import NetworkSecurityPage from './pages/network-security/NetworkSecurityPage';

// Admin Pages
import AdminUsersPage from './pages/admin/UsersPage';
import AdminModulesPage from './pages/admin/ModulesPage';
import AdminAuditLogsPage from './pages/admin/AuditLogsPage';
import AdminSettingsPage from './pages/admin/SettingsPage';

// Assistant
import TrinetraGPTPage from './pages/assistant/TrinetraGPTPage';

// Auth Pages
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Documentation
import DocsPage from './pages/DocsPage';
import CommunityPage from './pages/CommunityPage';

// Context
import { useAuth } from './context/auth-context';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && window.location.pathname.startsWith('/auth')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-primary-500 font-medium">Loading TrinetraSec...</p>
        </div>
      </div>
    );
  }

  // Create protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/auth/signin" replace />;
    }
    return <>{children}</>;
  };

  // Create admin route component
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user || user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/signin" element={<SignInPage />} />
        <Route path="/auth/signup" element={<SignUpPage />} />
        <Route path="/auth" element={<Navigate to="/auth/signin" replace />} />
      </Route>

      {/* Protected routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        
        {/* Core Platform */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Detection Modules */}
        <Route path="/file-scanner" element={<ProtectedRoute><FileScannerPage /></ProtectedRoute>} />
        <Route path="/reversex" element={<ProtectedRoute><ReverseXPage /></ProtectedRoute>} />
        <Route path="/ddos-shield" element={<ProtectedRoute><DDoSShieldPage /></ProtectedRoute>} />
        <Route path="/phishing-detector" element={<ProtectedRoute><PhishingDetectorPage /></ProtectedRoute>} />
        <Route path="/threat-feeds" element={<ProtectedRoute><ThreatFeedsPage /></ProtectedRoute>} />
        <Route path="/apk-scan" element={<ProtectedRoute><APKScanPage /></ProtectedRoute>} />
        <Route path="/threat-stream" element={<ProtectedRoute><ThreatStreamPage /></ProtectedRoute>} />
        <Route path="/credential-watch" element={<ProtectedRoute><CredentialWatchPage /></ProtectedRoute>} />
        <Route path="/secure-health" element={<ProtectedRoute><SecureHealthViewPage /></ProtectedRoute>} />
        <Route path="/attack-sim" element={<ProtectedRoute><AttackSimLabPage /></ProtectedRoute>} />

        {/* Learning Center */}
        <Route path="/learn" element={<Navigate to="/learn/case-studies" replace />} />
        <Route path="/learn/case-studies" element={<CaseStudiesPage />} />
        <Route path="/learn/quiz" element={<QuizPage />} />
        <Route path="/learn/notes" element={<NotesPage />} />
        <Route path="/learn/faq" element={<FAQPage />} />

        {/* Knowledge Centers */}
        <Route path="/web-security" element={<WebSecurityPage />} />
        <Route path="/app-security" element={<AppSecurityPage />} />
        <Route path="/mobile-security" element={<MobileSecurityPage />} />
        <Route path="/ai-security" element={<AISecurityPage />} />
        <Route path="/cloud-security" element={<CloudSecurityPage />} />
        <Route path="/network-security" element={<NetworkSecurityPage />} />

        {/* Admin Section */}
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminRoute><AdminUsersPage /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/modules" element={<ProtectedRoute><AdminRoute><AdminModulesPage /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute><AdminRoute><AdminAuditLogsPage /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminRoute><AdminSettingsPage /></AdminRoute></ProtectedRoute>} />

        {/* Assistant */}
        <Route path="/assistant" element={<ProtectedRoute><TrinetraGPTPage /></ProtectedRoute>} />

        {/* Documentation */}
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/community" element={<CommunityPage />} />

        {/* Profile */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;