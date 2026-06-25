# 🚀 Draft — Sistema de Gestão de Documentos (Projeto P06-B)

![Next.js](https://img.shields.io/badge/Next.js_14-App_Router-black?style=for-the-badge&logo=next.js)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css)
![NextAuth](https://img.shields.io/badge/NextAuth.js_v5-Beta-8A2BE2?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-336791?style=for-the-badge&logo=postgresql)

Sistema web para **gestão de documentos** (contratos e termos fictícios) com versionamento, fluxo de aprovação e trilha de auditoria. Avaliação N3 — Segurança da Informação (Católica SC). A arquitetura é **desacoplada**: front-end e back-end são **dois repositórios Next.js 14 separados**, em portas distintas, comunicando-se por HTTP/JSON com autenticação via **Bearer Token**, o que isola as superfícies de ataque.

> **Ordem de inicialização (importante):** `Banco de Dados` → `Back-end (:3001)` → `Front-end (:3000)`.
> O front depende da API; a API depende do banco. Subir fora de ordem causa erro de conexão.

---

## 📦 Repositórios do Sistema

| Projeto | Repositório | Porta | Stack |
|---|---|---|---|
| Front-end (interface) | `draft-frontend` | `3000` | Next.js 14 (App Router), NextAuth v5, Tailwind |
| Back-end (API) | `draft-backend` | `3001` | Next.js 14 (API Routes), Prisma, Zod, bcryptjs |

Clone os dois projetos lado a lado:

```bash
git clone https://github.com/mendoncaluucas/draft-frontend.git
git clone https://github.com/mendoncaluucas/draft-backend.git
```

```
/draft/
├── draft-frontend/   (:3000)
└── draft-backend/    (:3001)
```

---

## ✅ Pré-requisitos

- **Node.js 18+** e **npm** — `node -v` / `npm -v`
- **PostgreSQL 14+** — `psql --version`
  > Para desenvolvimento local também é possível usar **SQLite**; nesse caso ajuste o `provider` no `schema.prisma` e a `DATABASE_URL` (ex.: `file:./dev.db`).
- **Git**

---

## 🗄️ Passo 1 — Banco de Dados (PostgreSQL)

1. Garanta que o serviço do PostgreSQL está rodando:
   - **Linux:** `sudo systemctl start postgresql`
   - **macOS (Homebrew):** `brew services start postgresql`
   - **Windows:** o serviço sobe junto com a instalação.

2. Crie o banco `draft` e um usuário para a aplicação:

   ```bash
   psql -U postgres
   ```

   ```sql
   CREATE DATABASE draft;
   CREATE USER draft_user WITH ENCRYPTED PASSWORD 'troque_esta_senha';
   GRANT ALL PRIVILEGES ON DATABASE draft TO draft_user;
   \q
   ```

3. A `DATABASE_URL` resultante (usada no Passo 2):

   ```
   postgresql://draft_user:troque_esta_senha@localhost:5432/draft
   ```

> As tabelas (`User`, `Document`, `DocumentVersion`, `AuditLog`, `Comment`) são criadas automaticamente pelas **migrations do Prisma** no Passo 2 — não crie tabela manualmente.

---

## 🔧 Passo 2 — Back-end (API — `draft-backend`, porta 3001)

1. Instale as dependências:

   ```bash
   cd draft-backend
   npm install
   ```

2. Crie o `.env` a partir do exemplo versionado e preencha os valores:

   ```bash
   cp .env.example .env
   ```

   ```env
   # Banco de dados (mesma string do Passo 1)
   DATABASE_URL="postgresql://draft_user:troque_esta_senha@localhost:5432/draft"

   # Segredo de assinatura/validação do JWT — mín. 32 caracteres.
   # DEVE ser IDÊNTICO ao do front-end (o back valida o Bearer com ele).
   NEXTAUTH_SECRET="sua-chave-super-segura-de-no-minimo-32-caracteres"

   NEXTAUTH_URL="http://localhost:3000"
   ```

   > Gere uma chave forte: `openssl rand -base64 32`

3. Aplique o schema do Prisma e gere o client:

   ```bash
   npx prisma migrate dev      # cria/aplica as tabelas no banco
   npx prisma generate         # gera o Prisma Client
   ```

4. (Se houver) Popule dados iniciais:

   ```bash
   npx prisma db seed
   ```

5. Suba a API (servida na porta **3001**):

   ```bash
   npm run dev
   ```

   A API responde em **http://localhost:3001**. Deixe este terminal aberto.

> 💡 Inspecionar o banco visualmente: `npx prisma studio`.

---

## 💻 Passo 3 — Front-end (Interface — `draft-frontend`, porta 3000)

1. Em **outro terminal**:

   ```bash
   cd draft-frontend
   npm install
   ```

2. Crie o arquivo de ambiente a partir do exemplo:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   # Endereço da API (back-end) para as requisições cross-origin
   NEXT_PUBLIC_API_URL="http://localhost:3001"

   # MESMO valor de NEXTAUTH_SECRET usado no back-end
   NEXTAUTH_SECRET="sua-chave-super-segura-de-no-minimo-32-caracteres"

   NEXTAUTH_URL="http://localhost:3000"
   ```

   > ⚠️ O `NEXTAUTH_SECRET` precisa ser **exatamente igual** nos dois projetos. Se divergir, o back-end rejeita o Bearer Token e o login falha.

3. Suba a interface na porta **3000**:

   ```bash
   npm run dev
   ```

---

## 🌐 Passo 4 — Acessar o Sistema

1. Acesse **http://localhost:3000** (a raiz redireciona para **`/login`**).
2. Faça login com um usuário existente (ou criado pelo seed/cadastro).
3. Após autenticar, você é direcionado ao dashboard (`/documents`).

---

## 🔑 Variáveis de Ambiente (resumo)

| Variável | Projeto | Descrição |
|---|---|---|
| `DATABASE_URL` | Back-end | String de conexão do PostgreSQL (banco `draft`) |
| `NEXTAUTH_SECRET` | Back-end **e** Front-end | Segredo do JWT — **idêntico** nos dois |
| `NEXTAUTH_URL` | Back-end e Front-end | URL base do front (`http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Front-end | Endereço da API (`http://localhost:3001`) |

> ℹ️ **Atenção ao nome do segredo:** o NextAuth.js **v5** pode esperar a variável como `AUTH_SECRET` em vez de `NEXTAUTH_SECRET`. Confirme no código (`src/auth.ts`) qual nome é lido e padronize o mesmo nos dois `.env`. O `.env.example` do projeto usa `NEXTAUTH_SECRET`.

---

## 🛠️ Solução de Problemas (Troubleshooting)

| Sintoma | Causa provável | Solução |
|---|---|---|
| Login falha mesmo com credenciais corretas | Front não acha a API, ou segredo divergente | Confira a API na `3001`, o `NEXT_PUBLIC_API_URL` e o `NEXTAUTH_SECRET` igual nos dois |
| `401 Unauthorized` nas chamadas à API | `NEXTAUTH_SECRET` diferente entre front e back | Iguale o segredo nos dois `.env` |
| Requisição bloqueada por CORS | Origem fora de `http://localhost:3000` | Acesse pelo front na 3000; ajuste o CORS do back se mudar a porta |
| Erro ao subir o back-end | Banco fora do ar / `DATABASE_URL` errada | Verifique o serviço do Postgres e a string de conexão |
| `prisma migrate` falha | Usuário sem permissão no banco | Reveja o `GRANT` do Passo 1 |
| Porta 3000/3001 já em uso | Outro processo na porta | Encerre o processo ou troque a porta |

---

## 🔐 Documentação de Segurança (SecOps)

Documentos complementares em [`/docs`](./docs):

- 📄 [Relatório Técnico Parcial](./docs/RELATORIO-TECNICO-PARCIAL.md) — arquitetura atual do sistema.
- 🚨 [Plano Mínimo de Resposta a Incidente](./docs/PLANO-RESPOSTA-INCIDENTE.md) — credencial exposta / `.env` vazado.
- 💾 [Plano de Backup e Restauração](./docs/PLANO-BACKUP-RESTAURACAO.md) — Prisma / PostgreSQL.
