import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]) // [{ course_id, name }]

  const load = useCallback(async () => {
    try {
      setFavorites(await getFavorites())
    } catch {
      setFavorites([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  const isFavorite = (courseId) =>
    favorites.some((f) => f.course_id === Number(courseId))

  const toggle = async (courseId, courseName) => {
    const id = Number(courseId)
    if (isFavorite(id)) {
      setFavorites((prev) => prev.filter((f) => f.course_id !== id))
      try { await removeFavorite(id) } catch { load() }
    } else {
      setFavorites((prev) => [{ course_id: id, name: courseName }, ...prev])
      try { await addFavorite(id) } catch { load() }
    }
  }

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => useContext(FavoritesContext)
