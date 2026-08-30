import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navigation, Footer } from '@/components/layout';
import { SplashScreen } from '@/pages/SplashScreen';
import { HomePage } from '@/pages/Home';
import { FeaturesPage } from '@/pages/Features';
import { VarunaWatchPage } from '@/pages/VarunaWatch';
import { BhumiSensePage } from '@/pages/BhumiSense';
import { KampanAlertPage } from '@/pages/KampanAlert';
import { TrishulCorePage } from '@/pages/TrishulCore';
import { RudraLevelsPage } from '@/pages/RudraLevels';
import { KailashViewPage } from '@/pages/KailashView';
import { DrishtiPanelPage } from '@/pages/DrishtiPanel';
import { GhantaSignalPage } from '@/pages/GhantaSignal';
import { DashboardPage } from '@/pages/Dashboard';
import { ProfilePage } from '@/pages/Profile';
import { AuthCallbackPage } from '@/pages/AuthCallback';
import { AboutPage } from '@/pages/About';
import { TeamPage } from '@/pages/Team';
import { ContactPage } from '@/pages/Contact';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';

// Layout for marketing pages (with Navigation + Footer)
function MarketingLayout() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <Navigation />
      <main id="main-content" className="pt-16"><Outlet /></main>
      <Footer />
    </div>
  );
}

// Layout for auth pages (split-screen, no nav/footer)
function AuthLayout() {
  return <div className="min-h-screen"><Outlet /></div>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Splash screen - shown once per session */}
      <Route path="/" element={<SplashScreen />} />

      {/* Auth pages with split-screen layout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* OAuth callback (no chrome — brief splash only) */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Marketing pages with shared layout */}
      <Route element={<MarketingLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/features/varuna-watch" element={<VarunaWatchPage />} />
        <Route path="/features/bhumi-sense" element={<BhumiSensePage />} />
        <Route path="/features/kampan-alert" element={<KampanAlertPage />} />
        <Route path="/features/trishul-core" element={<TrishulCorePage />} />
        <Route path="/features/rudra-levels" element={<RudraLevelsPage />} />
        <Route path="/features/kailash-view" element={<KailashViewPage />} />
        <Route path="/features/drishti-panel" element={<DrishtiPanelPage />} />
        <Route path="/features/ghanta-signal" element={<GhantaSignalPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Redirect root to splash */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}