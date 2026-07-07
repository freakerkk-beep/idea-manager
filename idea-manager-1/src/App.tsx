import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { NichePage } from './pages/NichePage'
import { SavedIdeas } from './pages/SavedIdeas'
import { TrashPage } from './pages/TrashPage'
import { Settings } from './pages/Settings'
import { useAuth } from './hooks/useAuth'
import { AppDataProvider } from './hooks/useAppData'
import { ToastProvider } from './hooks/useToast'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checked } = useAuth()
  if (!checked) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppDataProvider>
              <AppLayout />
            </AppDataProvider>
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="saved" element={<SavedIdeas />} />
        <Route path="niche/:nicheId" element={<NichePage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
