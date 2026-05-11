import client from './client'

export const createLesson = (courseId, data) =>
  client.post(`/courses/${courseId}/lessons`, data).then((r) => r.data)

export const updateLesson = (courseId, lessonId, data) =>
  client.put(`/courses/${courseId}/lessons/${lessonId}`, data).then((r) => r.data)

export const deleteLesson = (courseId, lessonId) =>
  client.delete(`/courses/${courseId}/lessons/${lessonId}`).then((r) => r.data)
