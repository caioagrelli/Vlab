process.env.JWT_SECRET = 'test_secret';

jest.mock('../config/db');

const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

describe('POST /auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  it('registra usuário com sucesso (201)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Ana', email: 'ana@test.com' }] });

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ id: 1, name: 'Ana', email: 'ana@test.com' });
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Ana' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/);
  });

  it('retorna 400 quando email tem formato inválido', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Ana', email: 'nao-eh-email', password: 'senha123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inválido/);
  });

  it('retorna 400 quando senha tem menos de 6 caracteres', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 caracteres/);
  });

  it('retorna 409 quando email já está cadastrado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: 'senha123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já cadastrado/);
  });
});

describe('POST /auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  it('faz login com sucesso (200)', async () => {
    const hashedPassword = await bcrypt.hash('senha123', 10);
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Ana', email: 'ana@test.com', password: hashedPassword }],
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@test.com', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ id: 1, name: 'Ana', email: 'ana@test.com' });
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/);
  });

  it('retorna 401 quando usuário não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@test.com', password: 'senha123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidas/);
  });

  it('retorna 401 quando senha está errada', async () => {
    const hashedPassword = await bcrypt.hash('senha123', 10);
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Ana', email: 'ana@test.com', password: hashedPassword }],
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@test.com', password: 'senhaerrada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidas/);
  });
});
