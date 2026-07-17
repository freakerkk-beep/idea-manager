import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchCatalog } from '../services/catalog'
import { fetchAllIdeas, fetchSavedIdeas } from '../services/ideas'
import { fetchAiReports } from '../services/aiReports'
import type { AiReport, CatalogData, Idea, SavedIdea } from '../types'

interface AppDataContextValue {
  catalog: CatalogData
  ideas: Idea[]
  savedIdeas: SavedIdea[]
  aiReports: AiReport[]
  loading: boolean
  error: string | null
  refetchCatalog: () => Promise<void>
  refetchIdeas: () => Promise<void>
  refetchSavedIdeas: () => Promise<void>
  refetchAiReports: () => Promise<void>
  refetchAll: () => Promise<void>
}

const emptyCatalog: CatalogData = { niches: [], subNiches: [], productTypes: [], assignees: [], statusOptions: [] }

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogData>(emptyCatalog)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([])
  const [aiReports, setAiReports] = useState<AiReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetchCatalog = useCallback(async () => {
    const data = await fetchCatalog()
    setCatalog(data)
  }, [])

  const refetchIdeas = useCallback(async () => {
    const data = await fetchAllIdeas()
    setIdeas(data)
  }, [])

  const refetchSavedIdeas = useCallback(async () => {
    const data = await fetchSavedIdeas()
    setSavedIdeas(data)
  }, [])

  const refetchAiReports = useCallback(async () => {
    const data = await fetchAiReports()
    setAiReports(data)
  }, [])

  const refetchAll = useCallback(async () => {
    setError(null)
    try {
      await Promise.all([refetchCatalog(), refetchIdeas(), refetchSavedIdeas(), refetchAiReports()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu từ Supabase.')
    }
  }, [refetchCatalog, refetchIdeas, refetchSavedIdeas, refetchAiReports])

  useEffect(() => {
    setLoading(true)
    refetchAll().finally(() => setLoading(false))
  }, [refetchAll])

  return (
    <AppDataContext.Provider
      value={{
        catalog,
        ideas,
        savedIdeas,
        aiReports,
        loading,
        error,
        refetchCatalog,
        refetchIdeas,
        refetchSavedIdeas,
        refetchAiReports,
        refetchAll,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData phải dùng trong AppDataProvider')
  return ctx
}
