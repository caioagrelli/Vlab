import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { getCourse, createCourse, updateCourse } from '../api/courses'

function toInputDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

const inputClass =
  'w-full bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors'

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

export default function CourseForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditing)

  useEffect(() => {
    if (!isEditing) return
    getCourse(id)
      .then((data) =>
        setForm({
          name: data.name,
          description: data.description || '',
          start_date: toInputDate(data.start_date),
          end_date: toInputDate(data.end_date),
        })
      )
      .catch(() => setError('Erro ao carregar curso'))
      .finally(() => setFetching(false))
  }, [id, isEditing])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEditing) {
        await updateCourse(id, form)
        navigate(`/courses/${id}`)
      } else {
        const created = await createCourse(form)
        navigate(`/courses/${created.id}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar curso')
    } finally {
      setLoading(false)
    }
  }

  const backTo = isEditing ? `/courses/${id}` : '/dashboard'

  if (fetching)
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Spinner />
      </div>
    )

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
        <Link to="/dashboard" className="hover:text-indigo-500 transition-colors">Cursos</Link>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {isEditing && (
          <>
            <Link to={`/courses/${id}`} className="hover:text-indigo-500 transition-colors truncate max-w-32">
              {form.name || 'Curso'}
            </Link>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
        <span className="text-gray-700 dark:text-slate-200 font-medium">
          {isEditing ? 'Editar' : 'Novo curso'}
        </span>
      </div>

      <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar curso' : 'Criar novo curso'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditing ? 'Atualize as informações do curso.' : 'Preencha as informações para criar um novo curso.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Mínimo 3 caracteres"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Descrição opcional do curso..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Data de início <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                required
                value={form.start_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Data de fim <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                required
                value={form.end_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar alterações' : 'Criar curso'
              )}
            </button>
            <Link
              to={backTo}
              className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
