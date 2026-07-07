import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'idea-manager-auth-token'

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setToken(localStorage.getItem(STORAGE_KEY))
    setChecked(true)
  }, [])

  const login = useCallback(async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        localStorage.setItem(STORAGE_KEY, data.token)
        setToken(data.token)
        return { ok: true }
      }
      return { ok: false, error: data.error || 'Sai mật khẩu' }
    } catch {
      return {
        ok: false,
        error:
          'Không thể kết nối tới máy chủ xác thực. Nếu đang chạy "npm run dev" thay vì "netlify dev", hãy dùng "netlify dev" để chức năng đăng nhập hoạt động.',
      }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }, [])

  return { isAuthenticated: !!token, checked, login, logout }
}
