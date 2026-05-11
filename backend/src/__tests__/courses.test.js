process.env.JWT_SECRET = 'test_secret';

jest.mock('../config/db');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../config/db');

const token = jwt.sign({ userId: 1 }, 'test_secret');
const auth = { Authorization: `Bearer ${token}` };

const tokenOther = jwt.sign({ userId: 2 }, 'test_secret');
const authOther = { Authorization: `Bearer ${tokenOther}` };

const fakeCourse = {
  id: 1,
  name: 'Curso de Node.js',
  description: 'Descrição',
  start_date: '2026-01-01T00:00:00.000Z',
  end_date: '2026-12-31T00:00:00.000Z',
  user_id: 1,
  created_at: '2026-05-01T00:00:00.000Z',
};

const fakeLessonDraft = {
  id: 1,
  title: 'Rascunho',
  status: 'draft',
  course_id: 1,
  created_at: '2026-05-01T00:00:00.000Z',
};
const fakeLessonPublished = {
  id: 2,
  title: 'Publicada',
  status: 'published',
  course_id: 1,
  created_at: '2026-05-01T00:00:00.000Z',
};

afterEach(() => jest.clearAllMocks());

describe('GET /courses', () => {
  it('lista cursos com sucesso (200)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app).get('/courses').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Curso de Node.js');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/courses');
    expect(res.status).toBe(401);
  });
});

describe('GET /courses/:id', () => {
  it('dono vê curso com todas as aulas incluindo rascunhos (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ ...fakeCourse, owner_name: 'Ana' }] })
      .mockResolvedValueOnce({ rows: [fakeLessonDraft, fakeLessonPublished] });

    const res = await request(app).get('/courses/1').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Curso de Node.js');
    expect(res.body.lessons).toHaveLength(2);
  });

  it('não-dono vê curso com apenas aulas publicadas (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ ...fakeCourse, owner_name: 'Ana' }] })
      .mockResolvedValueOnce({ rows: [fakeLessonPublished] });

    const res = await request(app).get('/courses/1').set(authOther);

    expect(res.status).toBe(200);
    expect(res.body.lessons).toHaveLength(1);
    expect(res.body.lessons[0].status).toBe('published');
  });

  it('retorna curso sem aulas (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ ...fakeCourse, owner_name: 'Ana' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/courses/1').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.lessons).toEqual([]);
  });

  it('retorna 404 quando curso não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/courses/99').set(auth);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado/);
  });
});

describe('POST /courses', () => {
  it('cria curso com sucesso (201)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .post('/courses')
      .set(auth)
      .send({ name: 'Curso de Node.js', start_date: '2026-01-01', end_date: '2026-12-31' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Curso de Node.js');
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const res = await request(app)
      .post('/courses')
      .set(auth)
      .send({ name: 'Curso de Node.js' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/);
  });

  it('retorna 400 quando nome tem menos de 3 caracteres', async () => {
    const res = await request(app)
      .post('/courses')
      .set(auth)
      .send({ name: 'AB', start_date: '2026-01-01', end_date: '2026-12-31' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/3 caracteres/);
  });

  it('retorna 400 quando end_date é anterior a start_date', async () => {
    const res = await request(app)
      .post('/courses')
      .set(auth)
      .send({ name: 'Curso Válido', start_date: '2026-12-31', end_date: '2026-01-01' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/posterior/);
  });
});

describe('PUT /courses/:id', () => {
  it('atualiza curso com sucesso (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [{ ...fakeCourse, name: 'Novo Nome' }] });

    const res = await request(app)
      .put('/courses/1')
      .set(auth)
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Novo Nome');
  });

  it('retorna 404 quando curso não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put('/courses/99').set(auth).send({ name: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 403 quando usuário não é o criador', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...fakeCourse, user_id: 99 }] });

    const res = await request(app).put('/courses/1').set(auth).send({ name: 'Novo' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/criador/);
  });
});

describe('DELETE /courses/:id', () => {
  it('exclui curso com sucesso (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/courses/1').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sucesso/);
  });

  it('retorna 404 quando curso não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/courses/99').set(auth);

    expect(res.status).toBe(404);
  });

  it('retorna 403 quando usuário não é o criador', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...fakeCourse, user_id: 99 }] });

    const res = await request(app).delete('/courses/1').set(auth);

    expect(res.status).toBe(403);
  });
});
