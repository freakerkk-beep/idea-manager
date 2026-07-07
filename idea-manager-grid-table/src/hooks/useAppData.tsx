import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchCatalog } from '../services/catalog'
import { fetchAllIdeas } from '../services/ideas'
import type { CatalogData, Idea } from '../types'

interface AppDataContextValue {
  catalog: CatalogData
  ideas: Idea[]
  loading: boolean
  error: string | null
  refetchCatalog: () => Promise<void>
  refetchIdeas: () => Promise<void>
  refetchAll: () => Promise<void>
}

const emptyCatalog: CatalogData = { niches: [], subNiches: [], productTypes: [], assignees: [] }

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogData>(emptyCatalog)
  const [ideas, setIdeas] = useState<Idea[]>([])
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

  const refetchAll = useCallback(async () => {
    setError(null)
    try {
      await Promise.all([refetchCatalog(), refetchIdeas()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu từ Supabase.')
    }
  }, [refetchCatalog, refetchIdeas])

  useEffect(() => {
    setLoading(true)
    refetchAll().finally(() => setLoading(false))
  }, [refetchAll])

  return (
    <AppDataContext.Provider
      value={{ catalog, ideas, loading, error, refetchCatalog, refetchIdeas, refetchAll }}
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
