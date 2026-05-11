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

const fakeCourse = { id: 1, name: 'Curso', user_id: 1 };
const fakeLesson = {
  id: 1,
  title: 'Introdução',
  status: 'draft',
  video_url: null,
  content: null,
  links: [],
  course_id: 1,
  created_at: '2026-05-01T00:00:00.000Z',
};
const fakeLessonPublished = { ...fakeLesson, id: 2, status: 'published', title: 'Publicada' };

afterEach(() => jest.clearAllMocks());

describe('GET /courses/:courseId/lessons', () => {
  it('dono vê todas as aulas incluindo rascunhos (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [fakeLesson, fakeLessonPublished] });

    const res = await request(app).get('/courses/1/lessons').set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('não-dono vê apenas aulas publicadas (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [fakeLessonPublished] });

    const res = await request(app).get('/courses/1/lessons').set(authOther);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('published');
  });

  it('retorna 404 quando curso não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/courses/99/lessons').set(auth);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado/);
  });
});

describe('POST /courses/:courseId/lessons', () => {
  it('cria aula com sucesso (201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [fakeLesson] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({ title: 'Introdução' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Introdução');
    expect(res.body.status).toBe('draft');
  });

  it('cria aula com content e links (201)', async () => {
    const lessonWithExtras = {
      ...fakeLesson,
      content: '# Aula 1\nConteúdo em **markdown**',
      links: [{ title: 'Docs', url: 'https://docs.example.com' }],
    };

    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [lessonWithExtras] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({
        title: 'Introdução',
        content: '# Aula 1\nConteúdo em **markdown**',
        links: [{ title: 'Docs', url: 'https://docs.example.com' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('# Aula 1\nConteúdo em **markdown**');
    expect(res.body.links).toHaveLength(1);
  });

  it('cria aula com status published (201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [{ ...fakeLesson, status: 'published' }] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({ title: 'Aula 2', status: 'published' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('published');
  });

  it('retorna 403 quando usuário não é o criador do curso', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...fakeCourse, user_id: 99 }] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({ title: 'Aula' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/criador/);
  });

  it('retorna 400 quando título está ausente', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatório/);
  });

  it('retorna 400 quando título tem menos de 3 caracteres', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({ title: 'AB' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/3 caracteres/);
  });

  it('retorna 400 quando status é inválido', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({ title: 'Aula válida', status: 'invalido' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/draft ou published/);
  });

  it('retorna 400 quando video_url não é uma URL válida', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({ title: 'Aula válida', video_url: 'nao-eh-url' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/URL válida/);
  });

  it('retorna 400 quando links não é um array', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .post('/courses/1/lessons')
      .set(auth)
      .send({ title: 'Aula válida', links: 'nao-eh-array' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/array/);
  });
});

describe('PUT /courses/:courseId/lessons/:id', () => {
  it('atualiza aula com sucesso (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [fakeLesson] })
      .mockResolvedValueOnce({ rows: [{ ...fakeLesson, status: 'published' }] });

    const res = await request(app)
      .put('/courses/1/lessons/1')
      .set(auth)
      .send({ status: 'published' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
  });

  it('atualiza content e links da aula (200)', async () => {
    const updatedLesson = {
      ...fakeLesson,
      content: '## Atualizado',
      links: [{ title: 'Link', url: 'https://example.com' }],
    };

    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [fakeLesson] })
      .mockResolvedValueOnce({ rows: [updatedLesson] });

    const res = await request(app)
      .put('/courses/1/lessons/1')
      .set(auth)
      .send({
        content: '## Atualizado',
        links: [{ title: 'Link', url: 'https://example.com' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('## Atualizado');
    expect(res.body.links).toHaveLength(1);
  });

  it('retorna 404 quando aula não existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/courses/1/lessons/99')
      .set(auth)
      .send({ title: 'XYZ' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrada/);
  });

  it('retorna 403 quando usuário não é o criador do curso', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...fakeCourse, user_id: 99 }] });

    const res = await request(app)
      .put('/courses/1/lessons/1')
      .set(auth)
      .send({ title: 'X' });

    expect(res.status).toBe(403);
  });

  it('retorna 400 quando video_url não é uma URL válida', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .put('/courses/1/lessons/1')
      .set(auth)
      .send({ video_url: 'nao-eh-url' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/URL válida/);
  });

  it('retorna 400 quando links não é um array', async () => {
    pool.query.mockResolvedValueOnce({ rows: [fakeCourse] });

    const res = await request(app)
      .put('/courses/1/lessons/1')
      .set(auth)
      .send({ links: 'nao-eh-array' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/array/);
  });
});

describe('DELETE /courses/:courseId/lessons/:id', () => {
  it('exclui aula com sucesso (200)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [fakeLesson] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/courses/1/lessons/1').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sucesso/);
  });

  it('retorna 404 quando aula não existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [fakeCourse] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/courses/1/lessons/99').set(auth);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrada/);
  });

  it('retorna 403 quando usuário não é o criador do curso', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...fakeCourse, user_id: 99 }] });

    const res = await request(app).delete('/courses/1/lessons/1').set(auth);

    expect(res.status).toBe(403);
  });
});
