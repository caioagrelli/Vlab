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
import Register from '../pages/Register'

describe('Register', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useTheme.mockReturnValue({ dark: false, toggle: vi.fn() })
  })

  it('renderiza campos de nome, email e senha', () => {
    useAuth.mockReturnValue({ register: vi.fn() })
    render(<MemoryRouter><Register /></MemoryRouter>)
    expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument()
  })

  it('exibe erro se senha tiver menos de 6 caracteres', async () => {
    useAuth.mockReturnValue({ register: vi.fn() })
    render(<MemoryRouter><Register /></MemoryRouter>)

    await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'Ana')
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'ana@test.com')
    await userEvent.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(screen.getByText('Senha deve ter no mínimo 6 caracteres')).toBeInTheDocument()
  })

  it('chama register e redireciona para /dashboard', async () => {
    const mockRegister = vi.fn().mockResolvedValue({})
    useAuth.mockReturnValue({ register: mockRegister })

    render(<MemoryRouter><Register /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'Ana')
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'ana@test.com')
    await userEvent.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('Ana', 'ana@test.com', 'senha123')
    )
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
  })

  it('exibe erro quando email já está cadastrado', async () => {
    const mockRegister = vi.fn().mockRejectedValue({
      response: { data: { error: 'Email já cadastrado' } },
    })
    useAuth.mockReturnValue({ register: mockRegister })

    render(<MemoryRouter><Register /></MemoryRouter>)
    await userEvent.type(screen.getByPlaceholderText('Seu nome'), 'Ana')
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'ana@test.com')
    await userEvent.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() =>
      expect(screen.getByText('Email já cadastrado')).toBeInTheDocument()
    )
  })
})
