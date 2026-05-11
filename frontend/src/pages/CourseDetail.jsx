import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Spinner from '../components/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { getCourse, deleteCourse } from '../api/courses'
import { createLesson, updateLesson, deleteLesson } from '../api/lessons'
import { getRandomInstructor } from '../api/randomUser'

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : ''
}

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

function getYouTubeEmbed(url) {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

const inputClass =
  'w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors'

const selectClass =
  'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors'

function StatusBadge({ status }) {
  return status === 'published' ? (
    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
      Publicado
    </span>
  ) : (
    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
      Rascunho
    </span>
  )
}

function LinkEditor({ links, onChange }) {
  const add = () => onChange([...links, { title: '', url: '' }])
  const remove = (i) => onChange(links.filter((_, idx) => idx !== i))
  const update = (i, field, value) =>
    onChange(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={link.title}
            onChange={(e) => update(i, 'title', e.target.value)}
            placeholder="Título (opcional)"
            className={`${inputClass} w-32`}
          />
          <input
            value={link.url}
            onChange={(e) => update(i, 'url', e.target.value)}
            placeholder="https://..."
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-400 hover:text-red-600 px-2 text-sm transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
      >
        + Adicionar link
      </button>
    </div>
  )
}

function LessonDetail({ lesson, courseId, isOwner, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: lesson.title,
    status: lesson.status,
    video_url: lesson.video_url || '',
    content: lesson.content || '',
    links: lesson.links || [],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const thumbnail = getYouTubeThumbnail(lesson.video_url)
  const hasContent = lesson.content || (lesson.links?.length > 0) || lesson.video_url

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const updated = await updateLesson(courseId, lesson.id, {
        title: form.title,
        status: form.status,
        video_url: form.video_url || null,
        content: form.content || null,
        links: form.links.filter((l) => l.url),
      })
      onUpdate(updated)
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 space-y-3">
        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Título</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={`${selectClass} w-full`}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">URL do vídeo</label>
          <input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Material da aula <span className="text-slate-400">(Markdown)</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={6}
            placeholder="# Título&#10;&#10;Conteúdo em **Markdown**..."
            className={`${inputClass} resize-y font-mono text-xs`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Links úteis</label>
          <LinkEditor links={form.links} onChange={(links) => setForm((f) => ({ ...f, links }))} />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={() => { setEditing(false); setError('') }} className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg text-xs transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors">
      {/* Header row */}
      <button
        onClick={() => hasContent && setExpanded((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hasContent ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}`}
      >
        {/* YouTube thumbnail preview */}
        {thumbnail && (
          <div className="relative shrink-0 w-20 h-12 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        <StatusBadge status={lesson.status} />
        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
          {lesson.title}
        </span>
        {hasContent && (
          <svg
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {isOwner && (
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
              Editar
            </button>
            <button onClick={() => onDelete(lesson.id)} className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              Excluir
            </button>
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && hasContent && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">

          {/* Video embed */}
          {lesson.video_url && (
            getYouTubeEmbed(lesson.video_url) ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video w-full">
                <iframe
                  src={getYouTubeEmbed(lesson.video_url)}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Assistir vídeo
              </a>
            )
          )}

          {/* Markdown content */}
          {lesson.content && (
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Useful links */}
          {lesson.links?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Links úteis</p>
              <ul className="space-y-1">
                {lesson.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {link.title || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddLessonForm({ courseId, onAdded, onCancel }) {
  const [form, setForm] = useState({
    title: '', status: 'draft', video_url: '', content: '', links: [],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const lesson = await createLesson(courseId, {
        title: form.title,
        status: form.status,
        video_url: form.video_url || null,
        content: form.content || null,
        links: form.links.filter((l) => l.url),
      })
      onAdded(lesson)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar aula')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-indigo-300 dark:border-indigo-500/30 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300">Nova aula</h4>
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Título *</label>
          <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Mínimo 3 caracteres" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={`${selectClass} w-full`}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">URL do vídeo</label>
        <input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          Material da aula <span className="text-slate-400">(Markdown)</span>
        </label>
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          rows={5}
          placeholder={'# Introdução\n\nEscreva o conteúdo em **Markdown**...'}
          className={`${inputClass} resize-y font-mono text-xs`}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Links úteis</label>
        <LinkEditor links={form.links} onChange={(links) => setForm((f) => ({ ...f, links }))} />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors">
          {saving ? 'Adicionando...' : 'Adicionar'}
        </button>
        <button type="button" onClick={onCancel} className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg text-sm transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [instructor, setInstructor] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddLesson, setShowAddLesson] = useState(false)

  useEffect(() => {
    getCourse(id)
      .then((data) => { setCourse(data); setLessons(data.lessons || []) })
      .catch(() => setError('Erro ao carregar curso'))
      .finally(() => setLoading(false))

    getRandomInstructor().then(setInstructor).catch(() => {})
  }, [id])

  const handleDeleteCourse = async () => {
    if (!confirm('Excluir este curso e todas as suas aulas?')) return
    try {
      await deleteCourse(id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir curso')
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Excluir esta aula?')) return
    try {
      await deleteLesson(id, lessonId)
      setLessons((prev) => prev.filter((l) => l.id !== lessonId))
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir aula')
    }
  }

  const isOwner = course?.user_id === user?.id

  const counts = {
    all: lessons.length,
    draft: lessons.filter((l) => l.status === 'draft').length,
    published: lessons.filter((l) => l.status === 'published').length,
  }

  const filteredLessons =
    statusFilter === 'all' ? lessons : lessons.filter((l) => l.status === statusFilter)

  if (loading)
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Spinner />
      </div>
    )

  if (error && !course)
    return (
      <div className="px-8 py-8">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
        <Link to="/dashboard" className="text-sm text-indigo-500 hover:text-indigo-400 transition-colors">← Voltar</Link>
      </div>
    )

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Course hero ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-[#020817] dark:from-[#0b1120] dark:via-slate-900 dark:to-[#020817] px-8 pt-8 pb-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-0 left-0 right-0 bottom-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>
        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
            <Link to="/dashboard" className="hover:text-indigo-400 transition-colors">Cursos</Link>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-200 font-medium truncate max-w-64">{course.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">{course.name}</h1>
              {course.description && (
                <p className="text-slate-300/70 text-sm leading-relaxed max-w-2xl">{course.description}</p>
              )}
              <div className="flex flex-wrap gap-5 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(course.start_date)} — {formatDate(course.end_date)}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {course.owner_name}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {lessons.length} aula{lessons.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => course && toggleFavorite(id, course.name)}
                title={isFavorite(id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className={`inline-flex items-center gap-1.5 text-sm px-4 py-2 border rounded-xl transition-all ${
                  isFavorite(id)
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-amber-300'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isFavorite(id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {isFavorite(id) ? 'Favoritado' : 'Favoritar'}
              </button>

              {isOwner && (
                <>
                  <Link
                    to={`/courses/${id}/edit`}
                    className="inline-flex items-center gap-1.5 text-sm px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </Link>
                  <button
                    onClick={handleDeleteCourse}
                    className="inline-flex items-center gap-1.5 text-sm px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex-1 px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Lessons (wide) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Aulas
                  <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {lessons.length}
                  </span>
                </h2>

                {isOwner && (
                  <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5">
                    {[
                      { key: 'all', label: 'Todas' },
                      { key: 'published', label: 'Publicadas' },
                      { key: 'draft', label: 'Rascunho' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          statusFilter === key
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {label}
                        <span className="ml-1 opacity-50">({counts[key]})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLessons.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-600 text-sm py-12 text-center">
                    {isOwner ? 'Nenhuma aula encontrada' : 'Nenhuma aula publicada ainda'}
                  </p>
                ) : (
                  filteredLessons.map((lesson) => (
                    <LessonDetail
                      key={lesson.id}
                      lesson={lesson}
                      courseId={id}
                      isOwner={isOwner}
                      onUpdate={(u) => setLessons((p) => p.map((l) => (l.id === u.id ? u : l)))}
                      onDelete={handleDeleteLesson}
                    />
                  ))
                )}
              </div>

              {isOwner && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80">
                  {showAddLesson ? (
                    <AddLessonForm
                      courseId={id}
                      onAdded={(lesson) => { setLessons((p) => [...p, lesson]); setShowAddLesson(false) }}
                      onCancel={() => setShowAddLesson(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setShowAddLesson(true)}
                      className="inline-flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar aula
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right — Sidebar info */}
          <div className="space-y-5">

            {/* Stats */}
            {isOwner && (
              <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Progresso</p>
                <div className="space-y-3">
                  {[
                    { label: 'Total de aulas', value: counts.all, color: 'text-indigo-500' },
                    { label: 'Publicadas', value: counts.published, color: 'text-emerald-500' },
                    { label: 'Rascunhos', value: counts.draft, color: 'text-amber-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                      <span className={`text-lg font-black ${color}`}>{value}</span>
                    </div>
                  ))}
                  {counts.all > 0 && (
                    <div className="pt-2">
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${(counts.published / counts.all) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{Math.round((counts.published / counts.all) * 100)}% publicado</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guest Instructor */}
            {instructor && (
              <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Instrutor Convidado</p>
                <div className="flex items-center gap-3 mb-3">
                  <img src={instructor.picture} alt={instructor.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30" />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm leading-tight">{instructor.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Especialista convidado</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Profissional com experiência na área, trazendo perspectivas práticas para este curso.
                </p>
              </div>
            )}

            {/* Quick actions */}
            {isOwner && (
              <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Ações</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowAddLesson(true)}
                    className="w-full inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nova aula
                  </button>
                  <Link
                    to={`/courses/${id}/edit`}
                    className="w-full inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar curso
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
