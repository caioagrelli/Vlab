import client from './client'

export const getMe = () =>
  client.get('/users/me').then((r) => r.data)

export const updateMe = (data) =>
  client.put('/users/me', data).then((r) => r.data)
