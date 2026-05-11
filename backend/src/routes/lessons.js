const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

async function requireCourseOwner(req, res) {
  const course = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.courseId]);

  if (course.rows.length === 0) {
    res.status(404).json({ error: 'Curso não encontrado' });
    return null;
  }

  if (course.rows[0].user_id !== req.userId) {
    res.status(403).json({ error: 'Apenas o criador do curso pode gerenciar as aulas' });
    return null;
  }

  return course.rows[0];
}

function validateLessonFields({ title, status, video_url, links }) {
  if (title !== undefined) {
    if (!title || title.trim().length < 3)
      return 'Título deve ter no mínimo 3 caracteres';
  }
  if (status && !['draft', 'published'].includes(status))
    return 'Status deve ser draft ou published';
  if (video_url && !/^https?:\/\/.+/.test(video_url))
    return 'video_url deve ser uma URL válida';
  if (links !== undefined && !Array.isArray(links))
    return 'links deve ser um array';
  return null;
}

// GET /courses/:courseId/lessons
// Criador vê tudo; demais usuários só veem as publicadas
router.get('/:courseId/lessons', auth, async (req, res) => {
  try {
    const course = await pool.query(
      'SELECT id, user_id FROM courses WHERE id = $1',
      [req.params.courseId]
    );

    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const isOwner = course.rows[0].user_id === req.userId;
    const lessons = await pool.query(
      isOwner
        ? 'SELECT * FROM lessons WHERE course_id = $1 ORDER BY created_at ASC'
        : "SELECT * FROM lessons WHERE course_id = $1 AND status = 'published' ORDER BY created_at ASC",
      [req.params.courseId]
    );

    res.json(lessons.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar aulas' });
  }
});

// POST /courses/:courseId/lessons
router.post('/:courseId/lessons', auth, async (req, res) => {
  const course = await requireCourseOwner(req, res);
  if (!course) return;

  const { title, status, video_url, content, links } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }

  const err = validateLessonFields({ title, status, video_url, links });
  if (err) return res.status(400).json({ error: err });

  try {
    const result = await pool.query(
      `INSERT INTO lessons (title, status, video_url, content, links, course_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title.trim(),
        status || 'draft',
        video_url || null,
        content || null,
        JSON.stringify(links || []),
        req.params.courseId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar aula' });
  }
});

// PUT /courses/:courseId/lessons/:id
router.put('/:courseId/lessons/:id', auth, async (req, res) => {
  const course = await requireCourseOwner(req, res);
  if (!course) return;

  const { title, status, video_url, content, links } = req.body;

  const err = validateLessonFields({ title, status, video_url, links });
  if (err) return res.status(400).json({ error: err });

  try {
    const lesson = await pool.query(
      'SELECT * FROM lessons WHERE id = $1 AND course_id = $2',
      [req.params.id, req.params.courseId]
    );

    if (lesson.rows.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }

    const current = lesson.rows[0];
    const result = await pool.query(
      `UPDATE lessons
       SET title = $1, status = $2, video_url = $3, content = $4, links = $5
       WHERE id = $6 RETURNING *`,
      [
        title ? title.trim() : current.title,
        status || current.status,
        video_url !== undefined ? video_url : current.video_url,
        content !== undefined ? content : current.content,
        links !== undefined ? JSON.stringify(links) : current.links,
        req.params.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar aula' });
  }
});

// DELETE /courses/:courseId/lessons/:id
router.delete('/:courseId/lessons/:id', auth, async (req, res) => {
  const course = await requireCourseOwner(req, res);
  if (!course) return;

  try {
    const lesson = await pool.query(
      'SELECT * FROM lessons WHERE id = $1 AND course_id = $2',
      [req.params.id, req.params.courseId]
    );

    if (lesson.rows.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }

    await pool.query('DELETE FROM lessons WHERE id = $1', [req.params.id]);

    res.json({ message: 'Aula excluída com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir aula' });
  }
});

module.exports = router;
