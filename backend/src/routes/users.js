const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// GET /users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
      [req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// PUT /users/me
router.put('/me', authMiddleware, async (req, res) => {
  const { name, email, avatar_url, current_password, new_password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email já utilizado por outra conta' });
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
      }
      const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.userId]);
      const match = await bcrypt.compare(current_password, userResult.rows[0].password);
      if (!match) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }
      const hashed = await bcrypt.hash(new_password, 10);
      const result = await pool.query(
        `UPDATE users SET name = $1, email = $2, avatar_url = $3, password = $4
         WHERE id = $5 RETURNING id, name, email, avatar_url`,
        [name.trim(), email, avatar_url ?? null, hashed, req.userId]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2, avatar_url = $3
       WHERE id = $4 RETURNING id, name, email, avatar_url`,
      [name.trim(), email, avatar_url ?? null, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;
