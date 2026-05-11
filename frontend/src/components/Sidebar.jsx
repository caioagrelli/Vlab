import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useFavorites } from '../contexts/FavoritesContext'

function NavItem({ to, label, icon, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

const icons = {
  grid: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
    </svg>
  ),
  sun: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  moon: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  profile: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const { favorites, isFavorite, toggle: toggleFavorite } = useFavorites()

  const isCourses =
    location.pathname === '/dashboard' ||
    (location.pathname.startsWith('/courses/') &&
      !location.pathname.endsWith('/new') &&
      !location.pathname.endsWith('/edit'))
  const isNew =
    location.pathname === '/courses/new' || location.pathname.endsWith('/edit')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?'
  const isProfile = location.pathname === '/profile'

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col w-64 shrink-0
        bg-white dark:bg-[#0b1120]
        border-r border-slate-200 dark:border-slate-800/80
        transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
            AgrelliCursos
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          Menu
        </p>
        <NavItem to="/dashboard" label="Cursos" icon={icons.grid} active={isCourses} onClick={onClose} />
        <NavItem to="/courses/new" label="Novo Curso" icon={icons.plus} active={isNew} onClick={onClose} />
        <NavItem to="/profile" label="Meu Perfil" icon={icons.profile} active={isProfile} onClick={onClose} />

        {favorites.length > 0 && (
          <div className="pt-4">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              Favoritos
            </p>
            {favorites.map((fav) => {
              const active = location.pathname === `/courses/${fav.course_id}`
              return (
                <div key={fav.course_id} className="group flex items-center rounded-lg overflow-hidden">
                  <Link
                    to={`/courses/${fav.course_id}`}
                    onClick={onClose}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-sm transition-all min-w-0 ${
                      active
                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${active ? 'text-amber-500' : 'text-amber-400/60 group-hover:text-amber-400'}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="truncate">{fav.name}</span>
                  </Link>
                  <button
                    onClick={() => toggleFavorite(fav.course_id, fav.name)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-2 text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 transition-all"
                    title="Remover dos favoritos"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5 shrink-0">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          {dark ? icons.sun : icons.moon}
          {dark ? 'Tema claro' : 'Tema escuro'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          {icons.logout}
          Sair
        </button>

        {/* User */}
        <Link
          to="/profile"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg transition-all group ${
            isProfile
              ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-200 dark:ring-indigo-500/20'
              : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 truncate leading-tight">{user?.email}</p>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </aside>
  )
}
