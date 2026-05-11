import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { getCourses } from '../api/courses'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`flex flex-col gap-1 px-6 py-5 rounded-2xl border ${accent
      ? 'bg-indigo-600 border-indigo-500 dark:border-indigo-500 text-white'
      : 'bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10 text-white'
    }`}>
      <span className={`text-xs font-semibold uppercase tracking-widest ${accent ? 'text-indigo-100' : 'text-indigo-200 dark:text-indigo-300'}`}>
        {label}
      </span>
      <span className="text-4xl font-black tracking-tight">{value}</span>
    </div>
  )
}

function StarButton({ courseId, courseName }) {
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(courseId)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(courseId, courseName) }}
      title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`shrink-0 p-1 rounded-lg transition-all ${
        fav
          ? 'text-amber-400 hover:text-amber-500'
          : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400'
      }`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
  )
}

function CourseCard({ course, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-[#0f1829] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 cursor-pointer
        hover:border-indigo-400 dark:hover:border-indigo-500/60
        hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(99,102,241,0.12)]
        transition-all duration-200 flex flex-col gap-4 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-indigo-500/5 dark:bg-indigo-400/5 group-hover:scale-150 transition-transform duration-500" />

      <div className="flex-1 relative">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {course.name}
          </h3>
          <StarButton courseId={course.id} courseName={course.name} />
        </div>
        <p className={`text-sm leading-relaxed line-clamp-3 ${course.description ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600 italic'}`}>
          {course.description || 'Sem descrição'}
        </p>
      </div>

      <div className="relative border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <svg className="w-3.5 h-3.5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(course.start_date)} — {formatDate(course.end_date)}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <svg className="w-3.5 h-3.5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {course.owner_name}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadCourses = async (name = '') => {
    setLoading(true)
    setError('')
    try {
      const data = await getCourses(name ? { name } : {})
      setCourses(data)
    } catch {
      setError('Erro ao carregar cursos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCourses() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadCourses(search)
  }

  const handleClear = () => {
    setSearch('')
    loadCourses('')
  }

  const myCourses = courses.filter(c => c.owner_name === user?.name).length
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Hero banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-[#1e1060] dark:from-[#1a1060] dark:via-indigo-900 dark:to-[#020817] px-8 pt-10 pb-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="absolute top-0 left-0 right-0 bottom-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
            <div>
              <p className="text-indigo-300 text-sm font-medium mb-1">Bem-vindo de volta</p>
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                {firstName} 👋
              </h1>
              <p className="text-indigo-200/80 text-sm mt-2 max-w-md">
                Gerencie seus cursos, crie aulas e compartilhe conhecimento.
              </p>
            </div>
            <Link
              to="/courses/new"
              className="shrink-0 self-start inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Novo curso
            </Link>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard label="Total de cursos" value={courses.length} />
              <StatCard label="Seus cursos" value={myCourses} accent />
              <StatCard label="De outros" value={courses.length - myCourses} />
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="flex-1 px-8 py-8">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar curso pelo nome..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-[#0f1829] border border-slate-200 dark:border-slate-700/80 rounded-xl text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {search && (
                <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" className="px-5 py-2.5 text-sm bg-white dark:bg-[#0f1829] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 font-medium transition-all">
              Buscar
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 mb-6 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Spinner /></div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center mb-5 shadow-inner">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              {search ? `Nenhum resultado para "${search}"` : 'Nenhum curso ainda'}
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mb-6">
              {search
                ? 'Tente um termo diferente ou limpe a busca.'
                : 'Crie seu primeiro curso e comece a adicionar aulas.'}
            </p>
            {!search && (
              <Link
                to="/courses/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-indigo-500/25"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Criar primeiro curso
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {search
                  ? `${courses.length} resultado${courses.length !== 1 ? 's' : ''} para "${search}"`
                  : `${courses.length} curso${courses.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => navigate(`/courses/${course.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
