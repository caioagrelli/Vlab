# Vlab — CourseSphere Full Stack

Aplicação web completa de gestão de cursos e aulas online, desenvolvida como resposta ao desafio técnico Full Stack (CourseSphere).

> **Stack utilizada:** Node.js + Express (backend) · React 18 + Vite (frontend) · PostgreSQL · JWT

---

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
- [Diferenciais Entregues](#diferenciais-entregues)
- [Pré-requisitos](#pré-requisitos)
- [Rodando com Docker (recomendado)](#rodando-com-docker-recomendado)
- [Rodando Manualmente](#rodando-manualmente)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Deploy](#deploy)
- [Usuários de Teste](#usuários-de-teste)
- [API Reference](#api-reference)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## Sobre o Projeto

O **Vlab** permite que educadores criem e gerenciem cursos com múltiplas aulas. Cada aula pode ter vídeo do YouTube embutido, material em Markdown e links úteis. O criador do curso tem controle total; outros usuários autenticados veem apenas aulas publicadas.

---

## Funcionalidades Implementadas

### Requisitos Mínimos

| Requisito | Status |
|---|---|
| Registro com nome, email e senha | ✅ |
| Login com email e senha + logout | ✅ |
| Rotas protegidas para não autenticados | ✅ |
| CRUD completo de cursos | ✅ |
| CRUD completo de aulas | ✅ |
| Apenas o criador pode editar/excluir | ✅ |
| Não-criadores veem só aulas publicadas | ✅ |
| Validações no backend e no frontend | ✅ |
| Dashboard com lista de cursos | ✅ |
| Busca de cursos por nome | ✅ |
| Filtro de aulas por status (draft/published) | ✅ |
| Consumo de API externa (RandomUser) | ✅ |
| Formulários com mensagens de erro | ✅ |
| Feedback de loading em todas as ações | ✅ |

### Além do Solicitado

- Favoritos com atalhos na barra lateral
- Perfil editável com upload de foto (base64)
- Embed de YouTube diretamente na página da aula
- Tema claro/escuro com persistência (sem flash na recarga)
- Layout com sidebar, responsivo para mobile

---

## Diferenciais Entregues

### ✅ Autenticação JWT robusta
Token assinado com `jsonwebtoken`, injetado via interceptor Axios em todas as requisições. Rotas do backend validam o token via middleware. O interceptor do frontend só redireciona para login quando havia um token expirado — erros de credenciais incorretas chegam normalmente ao formulário.

### ✅ Testes automatizados
- **Backend:** Jest + Supertest com pool PostgreSQL mockado. Cobre auth, CRUD de cursos e aulas, guards de autorização e validações de campos.
- **Frontend:** Vitest + Testing Library. Cobre fluxo de login, registro, `PrivateRoute` e `AuthContext`.

### ✅ Docker
`docker-compose` sobe banco, backend e frontend com um único comando. Veja [Rodando com Docker](#rodando-com-docker-recomendado).

### ✅ Deploy funcional
- Frontend: **GitHub Pages** via GitHub Actions (CI/CD automático)
- Backend: instruções para Railway/Render no [Deploy](#deploy)

### ✅ Organização de commits e Git
Commits semânticos (`feat:`, `fix:`, `test:`, `ci:`, `chore:`) e branches por feature:
- `feat/backend` — rotas da API
- `test/backend` — suite de testes
- `ci/pipeline` — GitHub Actions
- `feat/frontend` — aplicação React

### ✅ UX/UI trabalhada
Hero banners com gradiente, sidebar com navegação ativa, grid responsivo de até 4 colunas, dark mode via classe Tailwind com script anti-FOUC no `index.html`.

---

## Pré-requisitos

- **Node.js** 20+
- **PostgreSQL** 14+ (ou Docker)
- **Docker + Docker Compose** (para a opção recomendada)

---

## Rodando com Docker (recomendado)

### 1. Clone o repositório

```bash
git clone git@github.com:caioagrelli/Vlab.git
cd Vlab
```

### 2. Crie o arquivo `.env` na raiz

```bash
cp .env.example .env
```

Edite o `.env` com seus valores (veja [Variáveis de Ambiente](#variáveis-de-ambiente)).

### 3. Suba todos os serviços

```bash
docker-compose up --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| PostgreSQL | localhost:5433 |

### 4. Rode as migrations (primeira vez)

```bash
docker-compose exec backend node src/config/migrate.js
```

### 5. Acesse a aplicação

Abra http://localhost:5173, crie uma conta na tela de registro e comece a usar.

---

## Rodando Manualmente

### Backend

```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env  # ajuste DATABASE_URL e JWT_SECRET

# Crie as tabelas
node src/config/migrate.js

# Inicie o servidor
npm start          # produção
npm run dev        # desenvolvimento (nodemon)
```

O servidor sobe em `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install

# Configure a URL do backend
echo "VITE_API_URL=http://localhost:3000" > .env

npm run dev
```

O frontend sobe em `http://localhost:5173`.

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

```env
DATABASE_URL=postgres://usuario:senha@localhost:5432/vlab
JWT_SECRET=troque_por_uma_chave_secreta_longa
PORT=3000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### Docker Compose (`.env` na raiz)

```env
DB_USER=vlab
DB_PASSWORD=vlab123
DB_NAME=vlab
JWT_SECRET=troque_por_uma_chave_secreta_longa
```

---

## Banco de Dados

As tabelas são criadas via script de migração:

```bash
node backend/src/config/migrate.js
```

### Schema

```sql
users       (id, name, email, password, avatar_url, created_at)
courses     (id, name, description, start_date, end_date, user_id, created_at)
lessons     (id, title, status, video_url, content, links jsonb, course_id, created_at)
favorites   (user_id, course_id, created_at)  -- PK composta
```

As colunas `avatar_url` e `links` são adicionadas automaticamente no startup do servidor via `ALTER TABLE IF NOT EXISTS`.

---

## Testes

### Backend

```bash
cd backend
npm test
```

Cobertura: registro, login, CRUD de cursos e aulas, guards de autenticação, autorização por dono do curso, visibilidade de rascunhos, validações de campos.

### Frontend

```bash
cd frontend
npm test
```

Cobertura: formulário de login (sucesso e erro), formulário de registro, redirecionamento do `PrivateRoute`, `AuthContext` (login, logout, persistência no localStorage).

---

## Deploy

### Frontend — GitHub Pages

O deploy é **automático** a cada push no `master` via GitHub Actions, desde que os testes passem.

**URL:** https://caioagrelli.github.io/Vlab

**Configuração necessária (uma única vez):**
1. `Settings → Pages` → Source: `Deploy from a branch` → Branch: `gh-pages`
2. `Settings → Actions → General` → Workflow permissions: `Read and write permissions`
3. `Settings → Secrets → Actions` → Adicionar secret `VITE_API_URL` com a URL do backend em produção

### Backend — Railway (recomendado)

1. Acesse [railway.app](https://railway.app) e faça login com o GitHub
2. Crie um novo projeto → **Deploy from GitHub repo** → selecione `caioagrelli/Vlab`
3. Configure o **Root Directory** como `backend`
4. Adicione as variáveis de ambiente: `DATABASE_URL`, `JWT_SECRET`, `PORT=3000`
5. Railway provisiona o PostgreSQL automaticamente
6. Após o deploy, copie a URL gerada e atualize o secret `VITE_API_URL` no GitHub

### Pipeline CI/CD

```
push → master
    ├── test-backend  (Jest, Node 20)
    ├── test-frontend (Vitest, Node 20)
    └── deploy (somente se ambos passarem)
            └── build → gh-pages branch → GitHub Pages
```

---

## Usuários de Teste

A aplicação possui **fluxo de registro completo** — basta acessar `/register` e criar uma conta.

Caso prefira um usuário pré-criado para avaliar, crie um via API:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Avaliador","email":"avaliador@teste.com","password":"123456"}'
```

Ou use diretamente na tela de registro da aplicação.

---

## API Reference

Todas as rotas (exceto `/auth/*` e `/health`) exigem:
```
Authorization: Bearer <token>
```

O token é retornado no login/registro e deve ser enviado em toda requisição autenticada.

### Autenticação

| Método | Rota | Body | Resposta |
|---|---|---|---|
| `POST` | `/auth/register` | `{ name, email, password }` | `{ token, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `{ token, user }` |

### Cursos

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/courses?name=` | Listar cursos (busca por nome opcional) |
| `GET` | `/courses/:id` | Detalhe com aulas |
| `POST` | `/courses` | Criar curso |
| `PUT` | `/courses/:id` | Editar (apenas criador) |
| `DELETE` | `/courses/:id` | Excluir (apenas criador) |

### Aulas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/courses/:id/lessons` | Listar aulas (owner vê todas; outros só publicadas) |
| `POST` | `/courses/:id/lessons` | Criar aula |
| `PUT` | `/courses/:id/lessons/:lessonId` | Editar aula (apenas dono do curso) |
| `DELETE` | `/courses/:id/lessons/:lessonId` | Excluir aula (apenas dono do curso) |

### Usuário

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/users/me` | Dados do usuário autenticado |
| `PUT` | `/users/me` | Atualizar nome, email, avatar e senha |

### Favoritos

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/favorites` | Listar cursos favoritados |
| `POST` | `/favorites/:courseId` | Favoritar curso |
| `DELETE` | `/favorites/:courseId` | Desfavoritar curso |

### Health Check

```
GET /health  →  { "status": "ok" }
```

---

## Estrutura do Projeto

```
Vlab/
├── backend/
│   ├── src/
│   │   ├── __tests__/       # Jest + Supertest
│   │   ├── config/
│   │   │   ├── db.js        # Pool PostgreSQL
│   │   │   └── migrate.js   # Criação das tabelas
│   │   ├── middleware/
│   │   │   └── auth.js      # Validação JWT
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── courses.js
│   │   │   ├── lessons.js
│   │   │   ├── users.js
│   │   │   └── favorites.js
│   │   └── app.js
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── __tests__/       # Vitest + Testing Library
│   │   ├── api/             # Camada HTTP (Axios)
│   │   ├── components/      # AppLayout, Sidebar, PrivateRoute, Spinner
│   │   ├── contexts/        # AuthContext, ThemeContext, FavoritesContext
│   │   └── pages/           # Login, Register, Dashboard, CourseDetail, CourseForm, Profile
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci.yml
```
