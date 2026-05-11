require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');
const userRoutes = require('./routes/users');
const favoriteRoutes = require('./routes/favorites');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Add avatar_url column if it doesn't exist yet
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`)
  .catch((err) => console.error('Migration error:', err));

// Rotas
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/courses', lessonRoutes);
app.use('/users', userRoutes);
app.use('/favorites', favoriteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Handler de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Handler de erros globais
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
