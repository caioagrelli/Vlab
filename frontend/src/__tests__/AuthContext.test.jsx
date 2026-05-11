import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

vi.mock('../api/auth', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}))

import { loginUser, registerUser } from '../api/auth'

function TestComponent() {
  const { user, logout } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? user.name : 'sem usuário'}</span>
      <button onClick={logout}>Sair</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('inicia sem usuário quando localStorage está vazio', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    expect(screen.getByTestId('user')).toHaveTextContent('sem usuário')
  })

  it('login armazena token e usuário', async () => {
    loginUser.mockResolvedValue({ token: 'tok123', user: { id: 1, name: 'Ana' } })

    function LoginTest() {
      const { login, user } = useAuth()
      return (
        <div>
          <span data-testid="user">{user ? user.name : 'sem usuário'}</span>
          <button onClick={() => login('a@a.com', '123456')}>Login</button>
        </div>
      )
    }

    render(<AuthProvider><LoginTest /></AuthProvider>)
    await act(async () => {
      screen.getByText('Login').click()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('Ana')
    expect(localStorage.getItem('token')).toBe('tok123')
  })

  it('logout limpa token e usuário', async () => {
    localStorage.setItem('token', 'tok123')
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana' }))

    render(<AuthProvider><TestComponent /></AuthProvider>)
    expect(screen.getByTestId('user')).toHaveTextContent('Ana')

    await act(async () => {
      screen.getByText('Sair').click()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('sem usuário')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('register armazena token e usuário', async () => {
    registerUser.mockResolvedValue({ token: 'tok456', user: { id: 2, name: 'Carlos' } })

    function RegisterTest() {
      const { register, user } = useAuth()
      return (
        <div>
          <span data-testid="user">{user ? user.name : 'sem usuário'}</span>
          <button onClick={() => register('Carlos', 'c@c.com', '123456')}>Registrar</button>
        </div>
      )
    }

    render(<AuthProvider><RegisterTest /></AuthProvider>)
    await act(async () => {
      screen.getByText('Registrar').click()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('Carlos')
    expect(localStorage.getItem('token')).toBe('tok456')
  })
})
