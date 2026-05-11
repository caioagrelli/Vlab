import client from './client'

export const registerUser = (name, email, password) =>
  client.post('/auth/register', { name, email, password }).then((r) => r.data)

export const loginUser = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data)
