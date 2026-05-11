import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../contexts/ThemeContext', () => ({ useTheme: vi.fn() }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Login from '../pages/Login'

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useTheme.mockReturnValue({ dark: false, toggle: vi.fn() })
  })

  it('renderiza campos de email e senha', () => {
    useAuth.mockReturnValue({ login: vi.fn() })
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('chama login e redireciona para /dashboard', async () => {
    const mockLogin = vi.fn().mockResolvedValue({})
    useAuth.mockReturnValue({ login: mockLogin })

    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'ana@test.com')
    await userEvent.type(screen.getByPlaceholderText('••••••'), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('ana@test.com', 'senha123'))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('exibe mensagem de erro quando login falha', async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      response: { data: { error: 'Credenciais inválidas' } },
    })
    useAuth.mockReturnValue({ login: mockLogin })

    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'a@a.com')
    await userEvent.type(screen.getByPlaceholderText('••••••'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() =>
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument()
    )
  })

  it('exibe erro genérico quando resposta não tem mensagem', async () => {
    useAuth.mockReturnValue({ login: vi.fn().mockRejectedValue(new Error('Network error')) })

    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'a@a.com')
    await userEvent.type(screen.getByPlaceholderText('••••••'), '123456')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() =>
      expect(screen.getByText('Erro ao fazer login')).toBeInTheDocument()
    )
  })
})
