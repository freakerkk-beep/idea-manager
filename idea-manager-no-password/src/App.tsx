import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { NichePage } from './pages/NichePage'
import { SavedIdeas } from './pages/SavedIdeas'
import { TrashPage } from './pages/TrashPage'
import { Settings } from './pages/Settings'
import { AppDataProvider } from './hooks/useAppData'
import { ToastProvider } from './hooks/useToast'

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppDataProvider>
            <AppLayout />
          </AppDataProvider>
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
