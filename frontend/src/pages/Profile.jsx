import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateMe } from '../api/users'

const inputClass =
  'w-full bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors'

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

function Avatar({ src, name, size = 'lg' }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?'
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm'
  if (src) {
    return <img src={src} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-indigo-500/30`} />
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shrink-0 shadow-md`}>
      {initial}
    </div>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    avatar_url: user?.avatar_url ?? '',
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar_url ?? '')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande. Use uma foto menor que 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setPreviewAvatar(dataUrl)
      setForm((f) => ({ ...f, avatar_url: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const removeAvatar = () => {
    setPreviewAvatar('')
    setForm((f) => ({ ...f, avatar_url: '' }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwords.next || passwords.current) {
      if (passwords.next !== passwords.confirm) {
        setError('As novas senhas não coincidem')
        return
      }
      if (passwords.next && passwords.next.length < 6) {
        setError('Nova senha deve ter no mínimo 6 caracteres')
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        avatar_url: form.avatar_url || null,
      }
      if (passwords.next) {
        payload.current_password = passwords.current
        payload.new_password = passwords.next
      }

      const updated = await updateMe(payload)
      updateUser(updated)
      setSuccess('Perfil atualizado com sucesso!')
      setPasswords({ current: '', next: '', confirm: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-[#020817] dark:from-[#0b1120] dark:via-slate-900 dark:to-[#020817] px-8 pt-8 pb-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>
        <div className="relative flex items-center gap-5">
          <Avatar src={previewAvatar} name={user?.name} size="lg" />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{user?.name}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Avatar */}
            <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Foto de perfil</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Selecione uma imagem (máx. 2 MB)</p>

              <div className="flex items-center gap-5">
                <Avatar src={previewAvatar} name={form.name || user?.name} size="lg" />
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Escolher foto
                  </button>
                  {previewAvatar && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal info */}
            <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Informações pessoais</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Atualize seu nome e endereço de email</p>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nome completo</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Alterar senha</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Deixe em branco para manter a senha atual</p>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Senha atual</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    placeholder="••••••"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nova senha</label>
                    <input
                      type="password"
                      value={passwords.next}
                      onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirmar nova senha</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repita a senha"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/25"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Salvando...
                  </>
                ) : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
