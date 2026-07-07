import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchCatalog } from '../services/catalog'
import { fetchAllIdeas, fetchSavedIdeas } from '../services/ideas'
import type { CatalogData, Idea, SavedIdea } from '../types'

interface AppDataContextValue {
  catalog: CatalogData
  ideas: Idea[]
  savedIdeas: SavedIdea[]
  loading: boolean
  error: string | null
  refetchCatalog: () => Promise<void>
  refetchIdeas: () => Promise<void>
  refetchSavedIdeas: () => Promise<void>
  refetchAll: () => Promise<void>
}

const emptyCatalog: CatalogData = { niches: [], subNiches: [], productTypes: [], assignees: [] }

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogData>(emptyCatalog)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([])
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

  const refetchAll = useCallback(async () => {
    setError(null)
    try {
      await Promise.all([refetchCatalog(), refetchIdeas(), refetchSavedIdeas()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu từ Supabase.')
    }
  }, [refetchCatalog, refetchIdeas, refetchSavedIdeas])

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
        loading,
        error,
        refetchCatalog,
        refetchIdeas,
        refetchSavedIdeas,
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
