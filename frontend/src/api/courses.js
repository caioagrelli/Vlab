import client from './client'

export const getCourses = (params) =>
  client.get('/courses', { params }).then((r) => r.data)

export const getCourse = (id) =>
  client.get(`/courses/${id}`).then((r) => r.data)

export const createCourse = (data) =>
  client.post('/courses', data).then((r) => r.data)

export const updateCourse = (id, data) =>
  client.put(`/courses/${id}`, data).then((r) => r.data)

export const deleteCourse = (id) =>
  client.delete(`/courses/${id}`).then((r) => r.data)
