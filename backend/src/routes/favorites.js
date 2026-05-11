const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

pool.query(`
  CREATE TABLE IF NOT EXISTS favorites (
    user_id   INTEGER REFERENCES users(id)   ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, course_id)
  )
`).catch((err) => console.error('Favorites migration error:', err));

// GET /favorites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id AS course_id, c.name
       FROM favorites f
       JOIN courses c ON c.id = f.course_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

// POST /favorites/:courseId
router.post('/:courseId', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId);
  if (isNaN(courseId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const course = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (!course.rows[0]) return res.status(404).json({ error: 'Curso não encontrado' });

    await pool.query(
      'INSERT INTO favorites (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, courseId]
    );
    res.status(201).json({ course_id: courseId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
});

// DELETE /favorites/:courseId
router.delete('/:courseId', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId);
  if (isNaN(courseId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND course_id = $2',
      [req.userId, courseId]
    );
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

module.exports = router;
