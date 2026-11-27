import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import HowItWorksPage from './pages/HowItWorksPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import AcceptableUsePage from './pages/AcceptableUsePage'
import CookiesPage from './pages/CookiesPage'
import AccessibilityPage from './pages/AccessibilityPage'
import DashboardPage from './pages/DashboardPage'
import InboxPage from './pages/InboxPage'
import ArchivePage from './pages/ArchivePage'
import CollectionsPage from './pages/CollectionsPage'
import OpenWhenPage from './pages/OpenWhenPage'
import CreatePage from './pages/CreatePage'
import AppShell from './components/app/AppShell'
import RequireAuth from './features/auth/RequireAuth'
import SignInPage from './pages/SignInPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/acceptable-use" element={<AcceptableUsePage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/accessibility" element={<AccessibilityPage />} />
      <Route element={<RequireAuth />}>
      <Route path="/app" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="open-when" element={<OpenWhenPage />} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
