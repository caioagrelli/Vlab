import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import PrivateRoute from '../components/PrivateRoute'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../contexts/AuthContext'

describe('PrivateRoute', () => {
  it('redireciona para /login quando não autenticado', () => {
    useAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<PrivateRoute><div>Conteúdo protegido</div></PrivateRoute>} />
          <Route path="/login" element={<div>Página de login</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('renderiza os filhos quando autenticado', () => {
    useAuth.mockReturnValue({ user: { id: 1, name: 'Test' } })
    render(
      <MemoryRouter>
        <PrivateRoute><div>Conteúdo protegido</div></PrivateRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })
})
