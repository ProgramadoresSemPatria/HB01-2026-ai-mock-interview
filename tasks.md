# Modular MVC Boilerplate — Tasks (monorepo Better-T-Stack)

**Objetivo:** Evoluir o monorepo **Better-T-Stack** (Turborepo + Bun workspaces) até o boilerplate MVC de referência no backend, **com correções** de bugs, dívidas e melhorias de qualidade (sem CI/CD nesta fase). O frontend (`apps/web`) permanece no stack gerado; estas tasks focam no **backend Express** e pacotes compartilhados.

**Guia de arquitetura:** `AGENTS.md` (se existir) ou README  
**Status:** Approved — pronto para execução  
**Fora de escopo:** GitHub Actions / CI (OPS-02), ESLint/Prettier (opcional T35), reescrever UI Next.js

**Toolchain:** [Bun](https://bun.sh) — runtime, package manager e executor de scripts. Lockfile: `bun.lock` na raiz. CLIs: `bunx` ou scripts Turbo (`bun run db:migrate`, etc.). **Não** usar `pnpm` / `npm` neste projeto.

**Abstrações (vs. legado):** apenas `PasswordHasher`, `TokenService` e `Mailer`; refresh UUID via `randomUUID()` no service; `password`/`confirmPassword` no Zod (sem `FieldComparer`).

---

## Estrutura do repositório (Better-T-Stack + Turborepo)

**Não** criar `src/` nem `prisma/` na raiz. Mapeamento do layout flat legado → monorepo:

| Legado (flat)                                          | Monorepo (este projeto)                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `src/server.ts`, `src/config/app.ts`                   | `apps/server/src/index.ts`, `apps/server/src/config/`                   |
| `src/modules/*/routes`, `controller`                   | `apps/server/src/modules/*/` (camada HTTP)                              |
| `src/modules/auth/service`, `protocols`, `validations` | `packages/auth/src/` (domínio)                                          |
| `src/modules/user/repository`                          | `packages/auth/src/repository/`                                         |
| `src/common/*` (errors, logger, middlewares, adapters) | `packages/common/src/` (`@hackathon2026/common`)                        |
| `src/config/env.ts`                                    | `packages/env/src/server.ts` (estender schema Zod)                      |
| `prisma/`                                              | `packages/db/prisma/`                                                   |
| `docker-compose.yml`                                   | `packages/db/docker-compose.yml`                                        |
| `.env.example`                                         | `apps/server/.env.example` (Prisma lê `apps/server/.env`)               |
| `tsconfig.json` (único)                                | `packages/config/tsconfig.base.json` + `tsconfig.json` por app/package  |
| Testes HTTP / Vitest                                   | raiz: `vitest.config.ts`; suites em `apps/server/` ou ao lado do módulo |

```
hackathon2026/
├── apps/
│   ├── web/                 # Next.js — fora do escopo das tasks MVC
│   └── server/              # Express: monta /api, /trpc, better-auth
│       └── src/
│           ├── index.ts
│           ├── config/      # app.ts, routes.ts
│           ├── modules/     # routes + controllers por módulo
│           └── factories/
├── packages/
│   ├── api/                 # tRPC (stack existente)
│   ├── auth/                # better-auth + domínio MVC (service, protocols, …)
│   ├── common/              # NOVO — erros, logger, middlewares, adapters
│   ├── db/                  # Prisma, migrations, docker
│   ├── env/                 # env validado (server / web)
│   ├── ui/                  # shadcn (só front)
│   └── config/              # tsconfig base
├── package.json             # scripts turbo + testes globais
└── turbo.json
```

**Dependências entre pacotes:** `apps/server` → `api`, `auth`, `common`, `db`, `env`. `packages/auth` → `db`, `env`, `common`. `web` **não** importa `db` nem `auth` server-side (apenas HTTP/tRPC/client).

---

## Correções obrigatórias + melhorias (vs. legado)

| Issue                           | Task(s)       | Correção                                                                  |
| ------------------------------- | ------------- | ------------------------------------------------------------------------- |
| Refresh não persistido          | T21           | `saveRefreshToken` após rotação                                           |
| Route loader async              | T28, T31      | `setupRoutes` async + `for...of` await                                    |
| JWT direto no middleware        | T29           | `TokenService` injetado                                                   |
| Enumeração no reset             | T22, T24      | Service não lança 404; controller sempre 200                              |
| Env com `!`                     | T9, T17, T20  | `packages/env/src/server.ts` centralizado                                 |
| Tipos circulares auth↔user      | T14, T20      | `packages/common/src/types/user.ts`                                       |
| Email só console                | T15, T18, T22 | protocolo `Mailer` + adapter SMTP (nodemailer)                            |
| Sem migrations                  | T7            | `bunx prisma migrate dev` + commit                                        |
| Sem teste HTTP refresh          | T33           | supertest signup→login→refresh→refresh                                    |
| Protocols em excesso            | T15-T17       | 3 ports + adapters; sem Hasher/Decrypter/FieldComparer/RefreshGenerator   |
| `@types/bcrypt` em deps         | T1            | mover para `devDependencies`                                              |
| Sem logging estruturado         | T10, T12      | `packages/common/src/logger.ts` + uso no errorHandler e service           |
| RefreshToken sem `expiresAt`    | T6, T19       | campo `expiresAt DateTime` no schema; filtro e persistência no repository |
| Sem rate limiting nos endpoints | T27           | `express-rate-limit` nas rotas POST de auth                               |
| Derived secret não documentado  | T22, T32      | Comentário inline no service + seção dedicada no README                   |

**Nota:** T32 = README; T33 = teste HTTP; T34 = Husky.

---

## Execution Plan

### Phase 0: Repositório e toolchain Bun (T1 → T7)

Layout monorepo (`apps/server`, `packages/db`, `packages/common`, …) — ver seção **Estrutura do repositório**.

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 1: Infra compartilhada (T8 → T18)

```
T8 → T9
T8 → T10 (logger, paralelo a T9)
         ↓
    T11 → T12 (errorHandler usa logger)
         ↓
    T13 (validate)
T14, T15 (após T2)
    T16 [P]  (após T15, T9)
    T17 [P]  (após T15, T9)
    T18 [P]  (após T15, T9)
```

### Phase 2: Persistência (T19)

```
T7, T9, T14 → T19
```

### Phase 3: Auth core (T20 → T22)

```
T19, T16, T17, T18 → T20 → T21 → T22
```

### Phase 4: HTTP surface (T23 → T27)

```
T22 → T23 → T24 → T25 → T26 → T27
```

### Phase 5: Bootstrap e segurança global (T28 → T31)

```
T26, T27, T17 → T28 → T29 → T30 → T31
```

### Phase 6: Qualidade e gates (T32 → T34)

```
T31 → T32 → T33 → T34
```

### Phase 7: Opcional (T35)

```
T34 → T35 (deferível)
```

---

## Gate Check Commands

| Gate   | Comando                             | Quando                          |
| ------ | ----------------------------------- | ------------------------------- |
| Quick  | `bun run test`                      | Após tasks com testes unitários |
| Full   | `bun run test:ci`                   | T33, T34, fim de fase           |
| Manual | `bun run dev:server` + curl/Postman | T31 — smoke                     |

**Nota:** `bun run <script>` executa scripts do `package.json`. `bunx <cli>` executa binários (Prisma, `tsc`, Vitest) sem instalação global. `bun test` é o test runner nativo do Bun — este projeto usa **Vitest** via scripts (`test`, `test:ci`), portanto os gates usam `bun run test`, não `bun test`.

---

## Task Breakdown

### T1: Inicializar `package.json` e scripts (Bun) ✅

**What:** Criar `package.json` com `"packageManager": "bun@…"`, dependências, scripts (`start`, `test`, `test:unit`, `test:ci`, `prepare`) e `@types/bcrypt` em **devDependencies**. **Não** incluir `uuid` nem `ts-node-dev` — Bun executa TypeScript nativamente; IDs com `node:crypto` (`randomUUID`).  
**Where:** `package.json` (root), `apps/server/package.json`, `vitest.config.ts` — monorepo **Better-T-Stack** (Turborepo + workspaces)  
**Depends on:** None  
**Requirement:** FOUND-01

**Scripts esperados (raiz — exemplo):**

```json
{
  "scripts": {
    "start": "turbo -F server dev",
    "test": "bunx vitest",
    "test:unit": "bunx vitest run",
    "test:ci": "bunx vitest run --coverage",
    "prepare": "husky",
    "dev:server": "turbo -F server dev",
    "db:migrate": "turbo -F @hackathon2026/db db:migrate"
  }
}
```

Runtime deps do MVC (`bcrypt`, `jsonwebtoken`, …) em `apps/server/package.json`; `@prisma/client` em `packages/db`.

**Done when:**

- Deps: express, cors, dotenv, zod, bcrypt, jsonwebtoken, nodemailer, @prisma/client, **express-rate-limit**
- DevDeps: typescript, `@types/bun`, prisma, vitest, @vitest/coverage-v8, husky, @types/ (incluindo @types/express-rate-limit)
- `bun install` sem erros; `bun.lock` gerado e versionado

**Tests:** none  
**Gate:** —  
**Commit:** `chore: initialize package and scripts`

---

### T2: Configurar TypeScript (Bun)

**What:** Garantir `strict: true`, `moduleResolution` compatível com Bun (`bundler` ou `node16+`), tipos Bun (`@types/bun`) e `extends` do base em todos os workspaces relevantes. Criar/ajustar `packages/common/tsconfig.json` se o pacote for adicionado no T3.  
**Where:** `packages/config/tsconfig.base.json`, `apps/server/tsconfig.json`, `packages/auth/tsconfig.json`, `packages/common/tsconfig.json`, `packages/db/tsconfig.json`  
**Depends on:** T1  
**Requirement:** FOUND-01

**Done when:**

- `bun run check-types` (Turbo) passa em server + packages do backend
- IDE e `bun run dev:server` reconhecem imports ESM (`node:crypto`, `workspace:*`)

**Tests:** none  
**Gate:** —  
**Commit:** `chore: add typescript config`

---

### T3: Git ignore e estrutura base ✅

**What:** Revisar `.gitignore` na raiz (`node_modules`, `dist`, `.env`, `coverage`, `.turbo`). **Não** ignorar `bun.lock`. Criar scaffolding do backend MVC (sem `src/` na raiz): pacote `packages/common` (`package.json` + `src/`), pastas em `apps/server/src/{config,modules,factories}`, pastas em `packages/auth/src/{protocols,service,validations,repository}`.  
**Where:** `.gitignore`, `packages/common/package.json`, `packages/common/src/.gitkeep` (ou `index.ts` stub), `apps/server/src/modules/.gitkeep`  
**Depends on:** T1  
**Requirement:** FOUND-01

**Done when:**

- `.env` / `apps/server/.env` não serão commitados
- Workspaces reconhecem `@hackathon2026/common`

**Tests:** none  
**Gate:** —  
**Commit:** `chore: add monorepo backend layout`

---

### T4: Docker Compose PostgreSQL ✅

**What:** Postgres na porta 5432 com volume nomeado. O stack já traz compose em `packages/db`; alinhar imagem/volume ao spec (bitnami ou `postgres` oficial) se necessário.  
**Where:** `packages/db/docker-compose.yml`  
**Depends on:** T3  
**Requirement:** FOUND-01

**Done when:**

- `bun run db:start` (ou `docker compose -f packages/db/docker-compose.yml up -d`) sobe container

**Tests:** none  
**Gate:** Manual  
**Commit:** `chore: add postgres docker compose`

---

### T5: Arquivo de ambiente exemplo ✅

**What:** `apps/server/.env.example` com variáveis MVC documentadas; copiar para `apps/server/.env` local. Estender validação em `packages/env/src/server.ts` (conviver com `BETTER_AUTH_*` / `CORS_ORIGIN` já existentes). Documentar `NEXT_PUBLIC_SERVER_URL` para o web em comentário ou `apps/web/.env.example`.  
**Where:** `apps/server/.env.example`, `packages/env/src/server.ts`  
**Depends on:** T4  
**Requirement:** ARQ-06, FOUND-04

**Done when:**

- Variáveis MVC: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_IN`, `REFRESH_EXPIRES`, `CORS_ORIGIN`, `PORT`, `FRONTEND_URL`, `RESET_PASSWORD_JWT_EXPIRE_IN`
- Variáveis SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
- Variáveis de rate limiting: `RATE_LIMIT_WINDOW_MS` (ex.: 900000 = 15 min), `RATE_LIMIT_MAX` (ex.: 20)
- Cada variável com comentário explicando unidade e valor de exemplo

**Tests:** none  
**Gate:** —  
**Commit:** `chore: add env example`

---

### T6: Schema Prisma User + RefreshToken ✅

**What:** Models `User` e `RefreshToken` (map `refresh_tokens`, índices, cascade) no schema Prisma do pacote `db`. `RefreshToken` **deve incluir campo `expiresAt DateTime`**. Integrar com schemas existentes (`packages/db/prisma/schema/`) sem quebrar models do better-auth.  
**Where:** `packages/db/prisma/schema/` (ex.: `user.prisma` ou arquivo dedicado)  
**Depends on:** T5  
**Requirement:** FOUND-01, USER-01, AUTH-05

**RefreshToken mínimo:**

```prisma
model RefreshToken {
  id        String   @id
  token     String   @unique
  userId    Int
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

**Done when:**

- Schema válido (`bun run db:generate` ou `bunx prisma validate` em `packages/db`)
- Campo `expiresAt` presente no modelo `RefreshToken`

**Tests:** none  
**Gate:** —  
**Commit:** `feat(db): add prisma schema`

---

### T7: Migrations e Prisma client singleton ✅

**What:** Rodar migration inicial (ex.: `init`), commitar `packages/db/prisma/migrations/`. Singleton já em `packages/db/src/index.ts` — garantir export usado pelo `UserRepository` (`@hackathon2026/db`).  
**Where:** `packages/db/prisma/migrations/`, `packages/db/src/index.ts`  
**Depends on:** T6, T4 (DB up)  
**Requirement:** OPS-01

**Done when:**

- Pasta `packages/db/prisma/migrations/` versionada
- `bun run db:generate` ok

**Tests:** none  
**Gate:** Manual  
**Commit:** `feat(db): add initial migration and prisma client`

---

### T8: Hierarquia HttpError ✅

**What:** `HttpError`, `BadRequestError`, `UnauthorizedError`, `NotFoundError`.  
**Where:** `packages/common/src/errors/http-errors.ts`  
**Depends on:** T2, T3 (`@hackathon2026/common`)  
**Requirement:** ARQ-08

**Done when:**

- Classes exportadas com `statusCode`

**Tests:** none  
**Gate:** —  
**Commit:** `feat(common): add http error hierarchy`

---

### T9: Validação de env com Zod ✅

**What:** Estender `packages/env/src/server.ts` com vars MVC (JWT, SMTP, rate limit); exportar `env` tipado; falha com mensagem clara se inválido.  
**Where:** `packages/env/src/server.ts`  
**Depends on:** T5, T8  
**Requirement:** ARQ-06, FOUND-04

**Done when:**

- `REFRESH_EXPIRES` coerced para number
- `SMTP_PORT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` coerced para number
- `RATE_LIMIT_WINDOW_MS` e `RATE_LIMIT_MAX` com `.default()` para facilitar ambientes sem essas vars definidas
- Importar `env` em vez de `process.env` nos próximos arquivos

**Tests:** unit (opcional mas recomendado: testar parse válido/inválido)  
**Gate:** Quick  
**Commit:** `feat(config): validate environment on startup`

---

### T10: Logger ✅

**What:** Wrapper leve sobre `console` com timestamp ISO, nível e output consistente. Evita logs brutos e não-rastreáveis dispersos na codebase.  
**Where:** `packages/common/src/logger.ts`  
**Depends on:** T2, T3  
**Requirement:** ARQ-08 (observabilidade mínima)

**Interface esperada:**

```typescript
logger.info(message: string, meta?: object): void
logger.warn(message: string, meta?: object): void
logger.error(message: string, meta?: object): void
logger.debug(message: string, meta?: object): void
```

**Implementação mínima aceita:**

```typescript
// cada método emite: [ISO_DATE] [LEVEL] message | meta (se presente)
// NODE_ENV === 'test' suprime debug e info para não poluir saída de testes
```

**Done when:**

- Exporta objeto `logger` com os 4 métodos
- Saída visível em `bun run dev:server` e suprimida nos testes (mode test)
- Sem dependências externas — apenas `console` nativo

**Tests:** none  
**Gate:** —  
**Commit:** `feat(common): add structured logger`

---

### T11: Augmentação Express Request ✅

**What:** `custom-namespace.d.ts` com `userId?: number`.  
**Where:** `apps/server/src/types/express.d.ts` (ou `packages/common/src/types/express.d.ts`)  
**Depends on:** T2  
**Requirement:** GUARD-03

**Done when:**

- TypeScript reconhece `req.userId`

**Tests:** none  
**Gate:** —  
**Commit:** `feat(config): extend express request type`

---

### T12: Middleware errorHandler ✅

**What:** Middleware global: `HttpError` → status + `{ message }`; Zod já tratado em validate; default 500. **Usar `logger.error`** para registrar erros 5xx com stack trace.  
**Where:** `packages/common/src/middlewares/error-handler-middleware.ts`  
**Depends on:** T8, T10  
**Requirement:** ARQ-08, FOUND-03

**Done when:**

- Handler exportado e testável
- Erros 5xx logados via `logger.error` com stack
- Erros 4xx não logados (ruído desnecessário)

**Tests:** none  
**Gate:** —  
**Commit:** `feat(common): add global error handler`

---

### T13: Middleware validate (Zod) ✅

**What:** `validate(schema)` retornando 422 com `{ message, errors }` em falha Zod.  
**Where:** `packages/common/src/middlewares/validation-middleware.ts`  
**Depends on:** T8  
**Requirement:** ARQ-08, USER-04

**Done when:**

- Middleware exportado

**Tests:** none  
**Gate:** —  
**Commit:** `feat(common): add zod validation middleware`

---

### T14: Tipos compartilhados de usuário ✅

**What:** `CreateUserParams`, `LoginParams` (sem `confirmPassword` no persist), etc.  
**Where:** `packages/common/src/types/user.ts`  
**Depends on:** T2, T3  
**Requirement:** ARQ-04

**Done when:**

- Nenhum import de `auth/service` em `user/repository`

**Tests:** none  
**Gate:** —  
**Commit:** `feat(common): add shared user types`

---

### T15: Protocols — PasswordHasher, TokenService, Mailer ✅

**What:** Três interfaces em `packages/auth/src/protocols/`:

- `PasswordHasher`: `hash(plain)`, `compare(plain, hash)`
- `TokenService`: `sign(payload, options?)`, `verify(token, secret?)`, `decode(token)`
- `Mailer`: `send(to, subject, body)`

**Where:** `packages/auth/src/protocols/password-hasher.ts`, `token-service.ts`, `mailer.ts`  
**Depends on:** T2, T3  
**Requirement:** ARQ-01, RESET-02

**Done when:**

- Sem implementação concreta nos arquivos de protocol
- **Não** criar `Hasher`, `HashComparer`, `Encrypter`, `Decrypter`, `Decoder`, `RefreshTokenGenerator`, `FieldComparer`

**Tests:** none  
**Gate:** —  
**Commit:** `feat(auth): add auth boundary protocols`

---

### T16: BcryptPasswordHasher adapter ✅

**What:** Implementar `PasswordHasher` com bcrypt; rounds configurável na factory.  
**Where:** `packages/common/src/adapters/cryptography/bcrypt-password-hasher.ts`  
**Depends on:** T15  
**Requirement:** ARQ-01

**Done when:**

- `hash` e `compare` funcionam
- Testes co-localizados passam

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(common): add bcrypt password hasher adapter`

---

### T17: JwtTokenService adapter ✅

**What:** Implementar `TokenService` (`sign`, `verify`, `decode`) usando `env` (não `process.env!`).  
**Where:** `packages/common/src/adapters/cryptography/jwt-token-service.ts`  
**Depends on:** T9, T15  
**Requirement:** ARQ-01, ARQ-06

**Done when:**

- sign/verify/decode funcionam
- Testes co-localizados passam

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(common): add jwt token service adapter`

---

### T18: NodemailerMailerAdapter (SMTP) ✅

**What:** Implementar `Mailer` com **nodemailer** enviando e-mail real via SMTP. Ler credenciais e remetente de `env`. O `AuthService` (T22) monta assunto/corpo com o link de reset; o adapter só entrega `to`, `subject`, `body`.  
**Where:** `packages/common/src/adapters/mailer/nodemailer-mailer-adapter.ts`  
**Depends on:** T9, T15  
**Requirement:** RESET-03

**Done when:**

- `send(to, subject, body)` envia e-mail via SMTP
- Transport configurado a partir de `env`
- Erros de envio propagados (tratamento silencioso fica em T22)
- Testes co-localizados passam (mock do transport)

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(common): add nodemailer smtp mailer adapter`

---

### T19: UserRepository ✅

**What:** CRUD user + refresh token ops; usa `env.REFRESH_EXPIRES`; tipos de `@hackathon2026/common`. **`saveRefreshToken` deve calcular e persistir `expiresAt`**. **`getRefreshTokenWithUser` deve filtrar tokens com `expiresAt > new Date()`** para não retornar tokens expirados mesmo que não rotacionados.  
**Where:** `packages/auth/src/repository/user-repository.ts`  
**Depends on:** T7, T9, T14  
**Requirement:** ARQ-04, AUTH-03, AUTH-05

**Métodos:** `getByEmail`, `create`, `getById`, `update`, `saveRefreshToken`, `getRefreshTokenWithUser`, `deleteRefreshToken`, `revokeAllUserRefreshTokens`

**Detalhe `saveRefreshToken`:**

```typescript
// expiresAt = now + env.REFRESH_EXPIRES * 1000 (converter ms → Date)
await prisma.refreshToken.create({
  data: {
    id,
    token,
    userId,
    expiresAt: new Date(Date.now() + env.REFRESH_EXPIRES * 1000),
  },
});
```

**Detalhe `getRefreshTokenWithUser`:**

```typescript
where: { token, expiresAt: { gt: new Date() } }
```

**Done when:**

- Sem import de `auth/service`
- Testes com `vi.mock('@hackathon2026/db')` passam
- `expiresAt` calculado e filtrado corretamente

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(user): add user repository`

---

### T20: AuthService — signup e login ✅

**What:** `signUp`, `login` com `PasswordHasher` + `TokenService`; refresh ID com `randomUUID()` de `node:crypto`; persistir refresh no login; strip password no retorno. Usar `logger.warn` em tentativas de login com credenciais inválidas (visibilidade sem expor dados).  
**Where:** `packages/auth/src/service/auth-service.ts`  
**Depends on:** T19, T16, T17  
**Requirement:** USER-01, USER-02, USER-05, AUTH-01, AUTH-02, AUTH-03, ARQ-01

**Done when:**

- Construtor com **no máximo** `userRepository`, `passwordHasher`, `tokenService` (mailer entra na T22)
- Email duplicado → `BadRequestError`
- Credenciais inválidas → `UnauthorizedError`
- `logger.warn` em login inválido
- Testes unitários signup + login passam

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(auth): add signup and login service`

---

### T21: AuthService — refresh com persistência ✅

**What:** `refreshAccessToken`: validar → revogar todos → novo par (`randomUUID` + JWT) → **`saveRefreshToken`** → retornar.  
**Where:** `packages/auth/src/service/auth-service.ts` (modify)  
**Depends on:** T20  
**Requirement:** AUTH-04, AUTH-05, AUTH-06

**Done when:**

- Teste unitário verifica `saveRefreshToken` chamado após gerar novo token
- Token expirado/revogado → 401

**Tests:** unit  
**Gate:** Quick  
**Commit:** `fix(auth): persist refresh token after rotation`

---

### T22: AuthService — password reset ✅

**What:** Injetar `Mailer`. `requestPasswordReset`: se email não existe, **return silencioso** (sem NotFound); se existe, JWT com secret derivado, enviar via `Mailer`. `resetPassword`: `decode` + `verify`, hash, update. Usar `env` para URLs/secrets.

**Mecanismo do derived secret (documentar com comentário no código):**

O JWT de reset é assinado com o secret `env.JWT_SECRET + user.password`. Isso garante que o token é **automaticamente invalidado** após a troca de senha, pois o hash da senha muda e o secret derivado deixa de ser válido. Não é necessário persistir tokens de reset no banco.

```typescript
// O secret derivado é: env.JWT_SECRET + user.password
// Propriedade: após resetPassword, qualquer token emitido anteriormente
// para este usuário deixa de ser verificável sem consulta ao banco.
const resetSecret = env.JWT_SECRET + user.password;
```

**Nota de design (trade-off consciente):** `AuthService` acumula signup, login, refresh e password reset em uma única classe. Para o escopo do hackathon isso é aceitável e mantém a factory (T25) simples. Em produção, `PasswordResetService` seria a separação correta (SRP).

**Where:** `packages/auth/src/service/auth-service.ts` (modify)  
**Depends on:** T21, T17, T18  
**Requirement:** RESET-01, RESET-02, RESET-04, RESET-05

**Done when:**

- Construtor final: `userRepository`, `passwordHasher`, `tokenService`, `mailer` (4 deps)
- Mailer chamado quando user existe
- Return silencioso quando user não existe (sem lançar 404)
- Comentário inline explicando o derived secret
- Testes cobrem reset feliz, token inválido e email inexistente

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(auth): add password reset with derived secret`

---

### T23: Schemas Zod dos endpoints auth ✅

**What:** `signup-schema`, `login-schema`, `request-password-reset-schema`, `password-reset-schema`. No signup: senha mín. 6 chars + `.refine` garantindo `password === confirmPassword` (mensagem em inglês).  
**Where:** `packages/auth/src/validations/*.ts`  
**Depends on:** T13  
**Requirement:** USER-03, USER-04

**Done when:**

- `confirmPassword` validado no schema, não no controller
- Mensagens de erro em inglês

**Tests:** none (opcional: teste unitário do schema signup)  
**Gate:** —  
**Commit:** `feat(auth): add request validation schemas`

---

### T24: AuthController ✅

**What:** Handlers delegando ao service; **apenas** `AuthService` no construtor; `next(error)`; reset request **não** propaga 404 do service.  
**Where:** `apps/server/src/modules/auth/controller/auth-controller.ts`  
**Depends on:** T22, T23  
**Requirement:** RESET-01, ARQ-08

**Done when:**

- Sem `FieldComparer` ou validação de campos no controller
- `requestPasswordReset` sempre responde 200 genérico
- Testes controller passam (service mockado)

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(auth): add auth controller`

---

### T25: Factory makeAuthController ✅

**What:** Compor `UserRepository`, `BcryptPasswordHasher`, `JwtTokenService`, `NodemailerMailerAdapter`, `AuthService`, `AuthController`.  
**Where:** `apps/server/src/factories/auth/auth-controller-factory.ts`  
**Depends on:** T24, T16, T17, T18  
**Requirement:** ARQ-02

**Done when:**

- Export `makeAuthController()`
- Nenhum `new` de controller nas routes
- Uma instância de cada adapter (sem passar o mesmo adapter 2–3 vezes por interfaces duplicadas)

**Tests:** none  
**Gate:** —  
**Commit:** `feat(auth): add auth controller factory`

---

### T26: Auth routes ✅

**What:** Registrar POST signup, login, refresh, request-password-reset, reset-password com `validate` + factory.  
**Where:** `apps/server/src/modules/auth/routes/auth-routes.ts`  
**Depends on:** T25, T23  
**Requirement:** USER-01, AUTH-01, RESET-01

**Done when:**

- Export default `(router: Router) => void`
- Paths sob `/api` via router mount

**Tests:** none  
**Gate:** —  
**Commit:** `feat(auth): register auth routes`

---

### T27: Rate limiting nas rotas de auth ✅

**What:** Aplicar `express-rate-limit` nos endpoints POST `/signup`, `/login` e `/request-password-reset`. Configurar janela e máximo de requisições via `env`. Retornar 429 com mensagem clara em excesso de requisições.  
**Where:** `packages/common/src/middlewares/rate-limit-middleware.ts` + aplicação em `apps/server/src/modules/auth/routes/auth-routes.ts`  
**Depends on:** T9, T26  
**Requirement:** SEC-01 (segurança mínima contra brute force)

**Implementação esperada:**

```typescript
// packages/common/src/middlewares/rate-limit-middleware.ts
import rateLimit from 'express-rate-limit';
import { env } from '@hackathon2026/env/server';

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

Aplicar o middleware **antes** do `validate` nas rotas afetadas:

```typescript
router.post(
  '/signup',
  authRateLimiter,
  validate(signupSchema),
  controller.signUp,
);
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.post(
  '/request-password-reset',
  authRateLimiter,
  validate(requestPasswordResetSchema),
  controller.requestPasswordReset,
);
```

**Done when:**

- Requisições em excesso retornam 429
- Window e max configuráveis via `env`
- `standardHeaders: true` retorna `RateLimit-*` headers

**Tests:** none (opcional: unit test com supertest)  
**Gate:** —  
**Commit:** `feat(common): add rate limiter for auth endpoints`

---

### T28: Route loader async determinístico ✅

**What:** `setupRoutes(app): Promise<void>` — scan `apps/server/src/modules` por `*routes.ts`, `for...of` + `await import()`, montar `/api` (conviver com rotas existentes `/trpc`, `/api/auth` do better-auth se necessário).  
**Where:** `apps/server/src/config/routes.ts`  
**Depends on:** T26  
**Requirement:** ARQ-05, FOUND-05

**Done when:**

- Zero `forEach(async`
- Todas routes registradas antes de listen

**Tests:** none  
**Gate:** —  
**Commit:** `feat(config): add async deterministic route loader`

---

### T29: checkAuth com TokenService injetado ✅

**What:** Factory `makeCheckAuthMiddleware(tokenService)`; `PUBLIC_ROUTES`; mensagens em inglês; usar `tokenService.verify`; sem import `jsonwebtoken` no middleware.  
**Where:** `packages/common/src/middlewares/check-auth-middleware.ts`, `apps/server/src/factories/auth/check-auth-factory.ts`  
**Depends on:** T17, T11  
**Requirement:** ARQ-07, GUARD-01 ... GUARD-05

**Done when:**

- Testes unitários: rota pública passa; sem Bearer 401; token válido seta `userId`; expirado 401

**Tests:** unit  
**Gate:** Quick  
**Commit:** `feat(common): add checkAuth middleware via token service`

---

### T30: Express app bootstrap ✅

**What:** `app.ts`: cors (`env.CORS_ORIGIN`), json, checkAuth, **await setupRoutes**, errorHandler; importar `@hackathon2026/env/server` no topo. Refatorar lógica hoje em `apps/server/src/index.ts` para `createApp()` reutilizável em testes.  
**Where:** `apps/server/src/config/app.ts`, `apps/server/src/index.ts` (refactor)  
**Depends on:** T28, T29, T12, T9  
**Requirement:** FOUND-02, FOUND-03

**Done when:**

- Export `createApp()` ou `app` configurado
- Rate limiter já aplicado nas routes (via T27); não é necessário aplicar globalmente aqui

**Tests:** none  
**Gate:** —  
**Commit:** `feat(config): wire express application`

---

### T31: Server entry async (Bun) ✅

**What:** `index.ts` importa `createApp()`, `listen(env.PORT)` (default 3000). Dev via `bun run --hot` (`dev` no `apps/server`) ou `bun run dev:server` / `bun start` na raiz — sem transpiler externo.  
**Where:** `apps/server/src/index.ts`  
**Depends on:** T30  
**Requirement:** FOUND-01

**Done when:**

- `bun run dev:server` sobe API em :3000 (ou `PORT`)
- 404 JSON em rota inexistente (Express default ou handler)

**Tests:** none  
**Gate:** Manual smoke  
**Commit:** `feat: add server entrypoint`

---

### T32: README do projeto

**What:** README com setup monorepo (Bun: `bun install`, `bun run dev` / `dev:server`; `bun run db:start`, `bun run db:migrate`; `apps/server/.env`), árvore `apps/` + `packages/`, arquitetura MVC (3 protocols), endpoints `/api/auth/*`, comandos test. **Deve incluir as três seções abaixo.**  
**Where:** `README.md`  
**Depends on:** T31  
**Requirement:** —

**Seção obrigatória: Derived Secret no Password Reset**

Explicar que o JWT de reset é assinado com `JWT_SECRET + hash_atual_da_senha`, tornando o token automaticamente inválido após a troca sem necessidade de persistência no banco. Documentar a implicação: se o usuário não troca a senha, o token expira pelo `RESET_PASSWORD_JWT_EXPIRE_IN`.

**Seção obrigatória: Rate Limiting**

Documentar que os endpoints `/signup`, `/login` e `/request-password-reset` são protegidos por rate limiting configurável via `RATE_LIMIT_WINDOW_MS` e `RATE_LIMIT_MAX`. Listar trade-offs de escopo: sem Redis store (in-memory, reseta no restart), sem IP whitelist, sem rate limit diferenciado por usuário.

**Seção obrigatória: Logger**

Documentar que a aplicação usa um logger centralizado em `packages/common/src/logger.ts`. Logs de erro (5xx) incluem stack trace; logs de warn cobrem eventos de segurança (ex.: login inválido). Saída suprimida em `NODE_ENV=test`.

**Done when:**

- Instruções reproduzíveis do zero
- Documenta `PasswordHasher`, `TokenService`, `Mailer` e ausência de protocols legados
- Três seções acima presentes e precisas

**Tests:** none  
**Gate:** —  
**Commit:** `docs: add project readme`

---

### T33: Teste HTTP supertest — fluxo auth completo

**What:** Suite integração HTTP: signup → login → refresh → refresh (segundo refresh deve 200).  
**Where:** `apps/server/src/modules/auth/routes/auth-routes.http.test.ts` (ou `apps/server/tests/auth-flow.test.ts`)  
**Depends on:** T31  
**Requirement:** TEST-03, AUTH-06

**Notas:**

- Usar `createApp()` de `apps/server/src/config/app.ts`; DB de teste ou mock conforme viabilidade
- Se DB real: documentar `DATABASE_URL` de teste no README (`apps/server/.env`)

**Done when:**

- Gate: `bun run test` — suite passa
- Segundo refresh não falha (regressão bug legado)

**Tests:** integration (HTTP)  
**Gate:** Full (`bun run test:ci`)  
**Commit:** `test(auth): add http flow signup login refresh`

---

### T34: Husky pre-commit

**What:** `.husky/pre-commit` executando `bun run test`; script `prepare` no `package.json` da raiz.  
**Where:** `.husky/pre-commit`  
**Depends on:** T33  
**Requirement:** TEST-05

**Exemplo `.husky/pre-commit`:**

```sh
bun run test
```

**Done when:**

- `git commit` dispara testes
- Usar `bun run test` (não `npm test` / `pnpm test`)

**Tests:** none  
**Gate:** Manual  
**Commit:** `chore: add husky pre-commit hook`

---

### T35: ESLint + Prettier

**What:** Config lint/format; scripts `lint` / `format`; mover verificação para pre-commit se desejado.  
**Where:** `eslint.config.*`, `.prettierrc` (raiz do monorepo)  
**Depends on:** T34  
**Requirement:** LINT-01, LINT-02

**Done when:**

- `bun run lint` passa no codebase

**Tests:** none  
**Gate:** —  
**Commit:** `chore: add eslint and prettier`

**Nota:** Deferível — não bloqueia MVP.

---

## Parallel Execution Map

```
Phase 0:  T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7

Phase 1:  T8 ──→ T9
          T8 ──→ T10 [P]  (logger, paralelo a T9)
          T11 (após T2)
          T12 (após T8, T10)
          T13 (após T8)
          T14, T15 (após T2)
          T16 [P]  T17 [P]  T18 [P]  (após T15, T9)

Phase 2:  T19 (após T7, T9, T14)

Phase 3:  T20 ──→ T21 ──→ T22

Phase 4:  T23 ──→ T24 ──→ T25 ──→ T26 ──→ T27

Phase 5:  T28 ──→ T29 ──→ T30 ──→ T31

Phase 6:  T32 ──→ T33 ──→ T34

Phase 7:  T35 (opcional)
```

---

## Task Granularity Check

| Task                                 | Escopo                     | Status |
| ------------------------------------ | -------------------------- | ------ |
| T1 package.json (root + server)      | monorepo toolchain         | ✅     |
| T3 layout monorepo                   | common + server scaffold   | ✅     |
| T10 logger                           | 1 utilitário + integração  | ✅     |
| T14 types                            | 1 arquivo de tipos         | ✅     |
| T15 protocols (3 ports)              | 1 camada interfaces coesa  | ✅     |
| T16 bcrypt adapter                   | 1 adapter + test           | ✅     |
| T20 signup+login service             | 2 métodos + randomUUID     | ✅     |
| T21 refresh persist                  | 1 método + fix crítico     | ✅     |
| T22 password reset                   | 2 métodos + derived secret | ✅     |
| T23 schemas + refine                 | validação entrada completa | ✅     |
| T27 rate limiting                    | 1 middleware + env config  | ✅     |
| "implementar auth inteiro" em 1 task | —                          | ❌     |
| T33 HTTP flow                        | 1 suite e2e                | ✅     |

---

## Diagram-Definition Cross-Check

| Task | Depends on (body) | Diagram     | Status |
| ---- | ----------------- | ----------- | ------ |
| T7   | T6, T4            | T6→T7       | ✅     |
| T10  | T2                | Phase 1     | ✅     |
| T12  | T8, T10           | T10→T12     | ✅     |
| T17  | T15, T9           | T15→T17     | ✅     |
| T18  | T15, T9           | T15→T18     | ✅     |
| T19  | T7, T9, T14       | Phase 2     | ✅     |
| T22  | T21, T17, T18     | T21→T22     | ✅     |
| T24  | T22, T23          | T23→T24     | ✅     |
| T27  | T9, T26           | T26→T27     | ✅     |
| T30  | T28, T29, T12, T9 | T28,T29→T30 | ✅     |
| T33  | T31               | T31→T33     | ✅     |

---

## Test Co-location Validation

| Task    | Camada     | Testes      | Status |
| ------- | ---------- | ----------- | ------ |
| T16     | Adapter    | unit        | ✅     |
| T17     | Adapter    | unit        | ✅     |
| T18     | Adapter    | unit        | ✅     |
| T19     | Repository | unit        | ✅     |
| T20-T22 | Service    | unit        | ✅     |
| T24     | Controller | unit        | ✅     |
| T26     | Routes     | none        | ✅     |
| T27     | Middleware | none        | ✅     |
| T29     | Middleware | unit        | ✅     |
| T33     | HTTP flow  | integration | ✅     |

---

## Requirement Traceability (resumo)

| Phase | Tasks   | Requirements                          |
| ----- | ------- | ------------------------------------- |
| 0     | T1-T7   | FOUND-\*, OPS-01                      |
| 1     | T8-T18  | ARQ-01, 06, 08, RESET-03, OBS-01      |
| 2     | T19     | ARQ-04, AUTH-03, AUTH-05              |
| 3     | T20-T22 | USER-_, AUTH-_, RESET-\*              |
| 4     | T23-T27 | USER-03, 04, RESET-01, ARQ-02, SEC-01 |
| 5     | T28-T31 | ARQ-05, 07, GUARD-_, FOUND-_          |
| 6     | T32-T34 | TEST-03, 05                           |
| 7     | T35     | LINT-\* (opcional)                    |

**Total:** 35 tasks (34 obrigatórias + 1 opcional) | **Sem CI:** OPS-02 excluído

---

## Ordem de commits sugerida (34 obrigatórios)

Seguir o campo **Commit** de cada task T1–T34 na ordem numérica.

---

## Validação final (UAT manual)

Após T34, executar:

```bash
bun install
bun run db:start
bun run db:migrate
cp apps/server/.env.example apps/server/.env   # se ainda não existir
bun run dev:server
```

1. `POST /api/auth/signup` — 201 (body com `password` + `confirmPassword` iguais)
2. `POST /api/auth/login` — 200 + tokens
3. `POST /api/auth/refresh` — 200 + novos tokens
4. `POST /api/auth/refresh` novamente com token do passo 3 — **200** (crítico)
5. `POST /api/auth/request-password-reset` email inexistente — **200** genérico
6. `POST /api/auth/login` mais de `RATE_LIMIT_MAX` vezes em `RATE_LIMIT_WINDOW_MS` ms — **429**
7. Rota protegida (futura) sem Bearer — 401
8. Verificar output do terminal: logs de erro com stack, warn em login inválido

**Sucesso:** todos os passos acima + `bun run test:ci` verde.
