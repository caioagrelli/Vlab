const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /courses?name=&status=
router.get('/', auth, async (req, res) => {
  const { name, status } = req.query;

  let query = `
    SELECT DISTINCT c.id, c.name, c.description, c.start_date, c.end_date, c.user_id, c.created_at,
      u.name AS owner_name
    FROM courses c
    JOIN users u ON u.id = c.user_id
  `;
  const params = [];

  if (status) {
    params.push(status);
    query += ` JOIN lessons l ON l.course_id = c.id AND l.status = $${params.length}`;
  }

  if (name) {
    params.push(`%${name}%`);
    query += ` WHERE c.name ILIKE $${params.length}`;
  }

  query += ' ORDER BY c.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

// GET /courses/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await pool.query(
      `SELECT c.*, u.name AS owner_name
       FROM courses c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const isOwner = course.rows[0].user_id === req.userId;
    const lessons = await pool.query(
      isOwner
        ? 'SELECT * FROM lessons WHERE course_id = $1 ORDER BY created_at ASC'
        : "SELECT * FROM lessons WHERE course_id = $1 AND status = 'published' ORDER BY created_at ASC",
      [req.params.id]
    );

    res.json({ ...course.rows[0], lessons: lessons.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar curso' });
  }
});

// POST /courses
router.post('/', auth, async (req, res) => {
  const { name, description, start_date, end_date } = req.body;

  if (!name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Nome, data de início e data de fim são obrigatórios' });
  }

  if (name.trim().length < 3) {
    return res.status(400).json({ error: 'Nome deve ter no mínimo 3 caracteres' });
  }

  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ error: 'Data de fim deve ser igual ou posterior à data de início' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO courses (name, description, start_date, end_date, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), description, start_date, end_date, req.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar curso' });
  }
});

// PUT /courses/:id
router.put('/:id', auth, async (req, res) => {
  const { name, description, start_date, end_date } = req.body;

  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);

    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (course.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Apenas o criador pode editar este curso' });
    }

    if (name && name.trim().length < 3) {
      return res.status(400).json({ error: 'Nome deve ter no mínimo 3 caracteres' });
    }

    const updatedName = name ? name.trim() : course.rows[0].name;
    const updatedDescription = description !== undefined ? description : course.rows[0].description;
    const updatedStart = start_date || course.rows[0].start_date;
    const updatedEnd = end_date || course.rows[0].end_date;

    if (new Date(updatedEnd) < new Date(updatedStart)) {
      return res.status(400).json({ error: 'Data de fim deve ser igual ou posterior à data de início' });
    }

    const result = await pool.query(
      `UPDATE courses
       SET name = $1, description = $2, start_date = $3, end_date = $4
       WHERE id = $5
       RETURNING *`,
      [updatedName, updatedDescription, updatedStart, updatedEnd, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar curso' });
  }
});

// DELETE /courses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);

    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (course.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Apenas o criador pode excluir este curso' });
    }

    await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);

    res.json({ message: 'Curso excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir curso' });
  }
});

module.exports = router;
