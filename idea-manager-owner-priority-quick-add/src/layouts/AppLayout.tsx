import { NavLink, Outlet } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'

const navLinkClass = (isActive: boolean) =>
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
  (isActive ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-700/60')

export function AppLayout() {
  const { catalog } = useAppData()
  const activeNiches = catalog.niches.filter((n) => n.is_active)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f5]">
      <aside className="flex w-60 shrink-0 flex-col bg-slate-800 text-slate-100">
        <div className="px-4 py-5">
          <div className="text-lg font-semibold tracking-tight">Idea Manager</div>
          <div className="text-xs text-slate-400">Quản lý ý tưởng sản phẩm</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
            Dashboard
          </NavLink>
          <NavLink to="/saved" className={({ isActive }) => navLinkClass(isActive)}>
            Idea đã lưu
          </NavLink>

          <div className="pt-3 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Các niche
          </div>
          {activeNiches.map((n) => (
            <NavLink key={n.id} to={`/niche/${n.id}`} className={({ isActive }) => navLinkClass(isActive)}>
              {n.name}
            </NavLink>
          ))}

          <div className="pt-3" />
          <NavLink to="/trash" className={({ isActive }) => navLinkClass(isActive)}>
            Idea đã loại bỏ
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => navLinkClass(isActive)}>
            Cài đặt danh mục
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
