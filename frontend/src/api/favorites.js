import client from './client'

export const getFavorites = () =>
  client.get('/favorites').then((r) => r.data)

export const addFavorite = (courseId) =>
  client.post(`/favorites/${courseId}`).then((r) => r.data)

export const removeFavorite = (courseId) =>
  client.delete(`/favorites/${courseId}`)
