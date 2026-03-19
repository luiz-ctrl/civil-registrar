import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public pages
import Landing        from './pages/Landing'
import AnnouncementView from './pages/AnnouncementView'

// Admin pages
import Login          from './pages/Login'
import AdminLayout    from './components/AdminLayout'
import Dashboard      from './pages/Dashboard'
import Transactions   from './pages/Transactions'
import TransactionForm from './pages/TransactionForm'
import Services       from './pages/Services'
import ServiceForm    from './pages/ServiceForm'
import Achievements   from './pages/Achievements'
import AchievementForm from './pages/AchievementForm'
import Announcements  from './pages/Announcements'
import AnnouncementForm from './pages/AnnouncementForm'
import Reports        from './pages/Reports'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" />
  if (!user?.authenticated) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                          element={<Landing />} />
          <Route path="/announcement/:id"          element={<AnnouncementView />} />

          {/* Admin auth */}
          <Route path="/admin/login"               element={<Login />} />

          {/* Admin protected */}
          <Route path="/admin" element={
            <ProtectedRoute><AdminLayout /></ProtectedRoute>
          }>
            <Route index                           element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"               element={<Dashboard />} />
            <Route path="transactions"            element={<Transactions />} />
            <Route path="transactions/new"        element={<TransactionForm />} />
            <Route path="transactions/:id/edit"   element={<TransactionForm />} />
            <Route path="services"                element={<Services />} />
            <Route path="services/new"            element={<ServiceForm />} />
            <Route path="services/:id/edit"       element={<ServiceForm />} />
            <Route path="achievements"            element={<Achievements />} />
            <Route path="achievements/new"        element={<AchievementForm />} />
            <Route path="achievements/:id/edit"   element={<AchievementForm />} />
            <Route path="announcements"           element={<Announcements />} />
            <Route path="announcements/new"       element={<AnnouncementForm />} />
            <Route path="announcements/:id/edit"  element={<AnnouncementForm />} />
            <Route path="reports"                 element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
