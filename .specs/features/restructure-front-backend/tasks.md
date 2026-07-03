# Reestruturação: Front + Backend — Tasks

**Design**: `.specs/features/restructure-front-backend/design.md`  
**Spec**: `.specs/features/restructure-front-backend/spec.md`  
**Status**: Executed (2026-05-26)  
**Branch sugerida**: `refactor/front-backend-split` (execução em `backend/feat/auth`)

---

## Execution Plan

### Phase 1: Backend foundation (sequencial)

```
T1 → T2 → T3 → T4
```

### Phase 2: Backend código inline (sequencial)

```
T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12
```

### Phase 3: Remover tRPC (sequencial)

```
T12 → T13 → T14 → T15
```

### Phase 4: Gates Backend (sequencial)

```
T15 → T16 → T17
```

### Phase 5: Front (sequencial, após T17)

```
T17 → T18 → T19 → T20 → T21 → T22 → T23 → T24 → T25
```

### Phase 6: Limpeza monorepo (sequencial)

```
T25 → T26 → T27 → T28
```

### Phase 7: Documentação (sequencial)

```
T28 → T29
```

**Nota:** Não apagar `apps/` e `packages/` antes de **T16** e **T17** passarem.

---

## Gate commands (referência)

| Gate | Comando | Onde |
|------|---------|------|
| install | `bun install` | `Backend/` ou `Front/` |
| types | `bun run check-types` | `Backend/` ou `Front/` |
| unit | `bun run test` | `Backend/` |
| build-be | `bun run build` | `Backend/` |
| build-fe | `bun run build` | `Front/` |
| no-trpc | `rg -i "trpc\|@trpc" Backend Front` | raiz |
| no-workspace | `rg "@hackathon2026" Backend Front` | raiz |

**Baseline de testes a preservar:** 8 arquivos `*.test.ts` (env, auth controller, auth service, user-repository, check-auth, bcrypt, jwt, nodemailer).

---

## Task Breakdown

### T1: Scaffold `Backend/package.json`

**What**: Criar `Backend/package.json` com scripts (`dev`, `build`, `start`, `test`, `check-types`, `db:*`) e dependências runtime/dev sem `@hackathon2026/*` nem `@trpc/*`.  
**Where**: `Backend/package.json`  
**Depends on**: None  
**Reuses**: `apps/server/package.json`, `packages/db/package.json` (scripts db)  
**Requirement**: RESTR-01, RESTR-03

**Done when**:

- [ ] `cd Backend && bun install` conclui sem erro
- [ ] Scripts listados no design presentes
- [ ] Sem `workspace:*` nas dependências

**Tests**: none  
**Gate**: install  

**Commit**: `chore(backend): add package.json scaffold`

---

### T2: Scaffold `Backend/tsconfig.json`

**What**: `tsconfig.json` com `baseUrl`, paths `@/*` → `./src/*`, opções de `packages/config/tsconfig.base.json`.  
**Where**: `Backend/tsconfig.json`  
**Depends on**: T1  
**Reuses**: `packages/config/tsconfig.base.json`  
**Requirement**: RESTR-03

**Done when**:

- [ ] `paths` `@/*` configurado
- [ ] `include` cobre `src/**/*`

**Tests**: none  
**Gate**: —  

**Commit**: `chore(backend): add tsconfig with path aliases`

---

### T3: Migrar Prisma e Docker para `Backend/`

**What**: Copiar `packages/db/prisma/**`, `docker-compose.yml`, `prisma.config.ts`; ajustar paths no config.  
**Where**: `Backend/prisma/`, `Backend/docker-compose.yml`, `Backend/prisma.config.ts`  
**Depends on**: T1  
**Reuses**: `packages/db/**`  
**Requirement**: RESTR-04, RESTR-05

**Done when**:

- [ ] Schema e migrations em `Backend/prisma/`
- [ ] `bun run db:generate` em `Backend/` gera client sem erro

**Tests**: none  
**Gate**: `cd Backend && bun run db:generate`  

**Commit**: `chore(backend): move prisma and docker compose`

---

### T4: Configurar Vitest no Backend

**What**: `Backend/vitest.config.ts` + `Backend/vitest.setup.ts` (defaults de env de `vitest.setup.ts` raiz).  
**Where**: `Backend/vitest.config.ts`, `Backend/vitest.setup.ts`  
**Depends on**: T2  
**Reuses**: `vitest.config.ts`, `vitest.setup.ts` (raiz)  
**Requirement**: RESTR-07

**Done when**:

- [ ] `cd Backend && bun run test` executa (pode passar com 0 testes ainda)

**Tests**: none  
**Gate**: `cd Backend && bun run test`  

**Commit**: `chore(backend): add vitest config`

---

### T5: Migrar `packages/common` → `Backend/src/shared`

**What**: Copiar `packages/common/src/**` para `Backend/src/shared/`; criar `Backend/src/shared/index.ts` com reexports usados pelas factories.  
**Where**: `Backend/src/shared/**`  
**Depends on**: T4  
**Reuses**: `packages/common/src/**`  
**Requirement**: RESTR-04

**Done when**:

- [ ] Pastas `adapters`, `middlewares`, `protocols`, `errors`, `types`, `logger.ts` presentes
- [ ] Testes copiados: `bcrypt-password-hasher.test.ts`, `jwt-token-service.test.ts`, `nodemailer-mailer-adapter.test.ts`, `check-auth-middleware.test.ts`
- [ ] Imports internos em shared usam paths relativos ou `@/shared/...`

**Tests**: unit (co-located)  
**Gate**: `cd Backend && bun run test -- shared` (ou vitest filtro equivalente)

**Commit**: `refactor(backend): inline common package as shared`

---

### T6: Migrar env server → `Backend/src/config/env`

**What**: Copiar `packages/env/src/server-schema.ts`, `server.ts`, `server.test.ts`; export `env` de `@/config/env`.  
**Where**: `Backend/src/config/env/`  
**Depends on**: T5  
**Reuses**: `packages/env/src/server*`  
**Requirement**: RESTR-05

**Done when**:

- [ ] `server.test.ts` passa
- [ ] Sem import de `@hackathon2026/env`

**Tests**: unit (`server.test.ts`)  
**Gate**: `cd Backend && bun run test -- config/env`

**Commit**: `refactor(backend): inline server env validation`

---

### T7: Migrar Prisma client → `Backend/src/infrastructure/database`

**What**: Copiar `packages/db/src/index.ts` para `Backend/src/infrastructure/database/index.ts`; ajustar import de env/prisma config.  
**Where**: `Backend/src/infrastructure/database/index.ts`  
**Depends on**: T3, T6  
**Reuses**: `packages/db/src/index.ts`  
**Requirement**: RESTR-04

**Done when**:

- [ ] Export do Prisma client funciona
- [ ] `check-types` não acusa erro no database module

**Tests**: none  
**Gate**: `cd Backend && bun run check-types` (parcial ok se outros módulos faltando — registrar)

**Commit**: `refactor(backend): add prisma database infrastructure`

---

### T8: Migrar domínio auth (service, repository, validations)

**What**: Copiar `packages/auth/src/service`, `repository`, `validations` → `Backend/src/modules/auth/`; migrar `auth-service.test.ts`, `user-repository.test.ts`.  
**Where**: `Backend/src/modules/auth/{service,repository,validations}/`  
**Depends on**: T5, T6, T7  
**Reuses**: `packages/auth/src/**`  
**Requirement**: RESTR-03, RESTR-04

**Done when**:

- [ ] `auth-service.test.ts` e `user-repository.test.ts` passam
- [ ] Imports apontam para `@/shared`, `@/config/env`, `@/infrastructure/database`

**Tests**: unit (co-located)  
**Gate**: `cd Backend && bun run test -- modules/auth`

**Commit**: `refactor(backend): inline auth domain into modules/auth`

---

### T9: Migrar HTTP auth (controller, routes, factories)

**What**: Copiar `apps/server/src/modules/auth`, `factories/auth`, `config/routes.ts`, `config/app.ts` (ainda com tRPC — removido em T13), `types/express.d.ts`.  
**Where**: `Backend/src/modules/auth/controller`, `routes`, `Backend/src/factories/auth`, `Backend/src/config/`  
**Depends on**: T8  
**Reuses**: `apps/server/src/**`  
**Requirement**: RESTR-07

**Done when**:

- [ ] `auth-controller.test.ts` passa
- [ ] `setupRoutes` descobre `auth-routes.ts` e monta `/api/auth`

**Tests**: unit (`auth-controller.test.ts`)  
**Gate**: `cd Backend && bun run test -- auth-controller`

**Commit**: `refactor(backend): move express auth module and routes`

---

### T10: Entrypoint e build (`index.ts`, `tsdown.config.ts`)

**What**: `Backend/src/index.ts` importando `@/config/env` e `createApp`; `tsdown.config.ts` sem `noExternal` workspace.  
**Where**: `Backend/src/index.ts`, `Backend/tsdown.config.ts`, `Backend/.env.example`  
**Depends on**: T9  
**Reuses**: `apps/server/src/index.ts`, `apps/server/tsdown.config.ts`  
**Requirement**: RESTR-03

**Done when**:

- [ ] `bun run dev` inicia servidor (com `.env` válido)
- [ ] `GET http://localhost:3000/` retorna OK

**Tests**: none  
**Gate**: manual ou script curl após `bun run dev`

**Commit**: `chore(backend): add entrypoint and tsdown config`

---

### T11: Passagem global de imports `@/` no Backend

**What**: Eliminar todos os `@hackathon2026/*` restantes em `Backend/`; usar `@/modules/auth`, `@/shared`, etc.  
**Where**: `Backend/src/**`  
**Depends on**: T10  
**Reuses**: design.md tabela de imports  
**Requirement**: RESTR-03, RESTR-13

**Done when**:

- [ ] `rg "@hackathon2026" Backend` → vazio
- [ ] `cd Backend && bun run check-types` passa

**Tests**: none  
**Gate**: `cd Backend && bun run check-types`

**Commit**: `refactor(backend): replace workspace imports with @ aliases`

---

### T12: Remover tRPC de `config/app.ts`

**What**: Remover imports e middleware `createExpressMiddleware`, rota `/trpc`.  
**Where**: `Backend/src/config/app.ts`  
**Depends on**: T11  
**Reuses**: design pseudocódigo  
**Requirement**: RESTR-06, RESTR-15

**Done when**:

- [ ] `app.ts` só registra cors, json, checkAuth, setupRoutes, `/`, 404, errorHandler
- [ ] Servidor sobe sem erro

**Tests**: none  
**Gate**: `cd Backend && bun run dev` (smoke)

**Commit**: `refactor(backend): remove trpc middleware from express app`

---

### T13: Remover `/trpc` de rotas públicas

**What**: Editar `PUBLIC_ROUTES` em `check-auth-middleware.ts`; atualizar `check-auth-middleware.test.ts` se necessário.  
**Where**: `Backend/src/shared/middlewares/check-auth-middleware.ts`  
**Depends on**: T12  
**Reuses**: design REST contract  
**Requirement**: RESTR-06, RESTR-08

**Done when**:

- [ ] Nenhuma entrada `{ path: "/trpc" }` em `PUBLIC_ROUTES`
- [ ] `check-auth-middleware.test.ts` passa

**Tests**: unit  
**Gate**: `cd Backend && bun run test -- check-auth-middleware`

**Commit**: `refactor(backend): drop trpc from public routes`

---

### T14: Limpar dependências tRPC do `Backend/package.json`

**What**: Remover `@trpc/server`, `@hono/trpc-server` e quaisquer refs; `bun install` limpo.  
**Where**: `Backend/package.json`  
**Depends on**: T12, T13  
**Requirement**: RESTR-15

**Done when**:

- [ ] `rg -i "trpc|@trpc" Backend` → vazio em `src/` e `package.json`

**Tests**: none  
**Gate**: no-trpc (Backend only)

**Commit**: `chore(backend): remove trpc dependencies`

---

### T15: Gate completo de testes Backend

**What**: Corrigir falhas restantes; garantir 8 arquivos de teste passando.  
**Where**: `Backend/**`  
**Depends on**: T14  
**Requirement**: RESTR-07, RESTR-09

**Done when**:

- [ ] `cd Backend && bun run test` — todos passam
- [ ] Contagem ≥ 8 arquivos de teste (sem deleções silenciosas)

**Tests**: unit (full suite)  
**Gate**: `cd Backend && bun run test`

**Commit**: `test(backend): ensure full vitest suite passes after migration`

---

### T16: Build de produção Backend

**What**: `bun run build` + smoke `bun run start` ou `node dist`.  
**Where**: `Backend/dist/`  
**Depends on**: T15  
**Requirement**: RESTR-03

**Done when**:

- [ ] `cd Backend && bun run build` sucesso
- [ ] Artefato `dist/index.mjs` executável

**Tests**: none  
**Gate**: build-be

**Commit**: `chore(backend): verify production build`

---

### T17: Scaffold `Front/package.json` e `tsconfig.json`

**What**: Criar `Front/package.json` (Next 16, React 19, sem trpc/workspace); `tsconfig` com `@/*`.  
**Where**: `Front/package.json`, `Front/tsconfig.json`  
**Depends on**: T16  
**Reuses**: `apps/web/package.json`  
**Requirement**: RESTR-02, RESTR-09

**Done when**:

- [ ] `cd Front && bun install` ok
- [ ] Sem deps `@trpc/*` nem `@hackathon2026/*`

**Tests**: none  
**Gate**: install (Front)

**Commit**: `chore(front): add package.json and tsconfig`

---

### T18: Migrar app Next.js (sem trpc)

**What**: Copiar `apps/web/src/app/**`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`; **não** copiar `utils/trpc.ts`.  
**Where**: `Front/src/app/**`, `Front/next.config.ts`, etc.  
**Depends on**: T17  
**Reuses**: `apps/web/**`  
**Requirement**: RESTR-09, RESTR-10

**Done when**:

- [ ] Rotas `page`, `login`, `dashboard`, `layout` presentes
- [ ] Nenhum import de `@/utils/trpc` ou `@hackathon2026/api`

**Tests**: none  
**Gate**: —

**Commit**: `refactor(front): migrate next.js app directory`

---

### T19: Copiar componentes UI usados pelo web

**What**: Copiar de `packages/ui`: `button`, `sonner`, `dropdown-menu`, `label`, `input`, `card`, `skeleton`, `checkbox` + `lib/utils.ts`; ajustar `components.json`.  
**Where**: `Front/src/components/ui/`, `Front/src/lib/utils.ts`  
**Depends on**: T18  
**Reuses**: `packages/ui/src/**`, grep em `apps/web`  
**Requirement**: RESTR-10

**Done when**:

- [ ] Todos os imports `@hackathon2026/ui/...` em componentes migrados substituídos por `@/components/ui/...`
- [ ] `components.json` aponta aliases locais

**Tests**: none  
**Gate**: —

**Commit**: `refactor(front): colocate shadcn ui components`

---

### T20: Estilos globais no Front

**What**: Migrar tokens/estilos de `packages/ui/src/styles/globals.css` para `Front/src/index.css` (sem `@import` do pacote ui).  
**Where**: `Front/src/index.css`  
**Depends on**: T19  
**Reuses**: `packages/ui/src/styles/globals.css`, `apps/web/src/index.css`  
**Requirement**: RESTR-10

**Done when**:

- [ ] `layout.tsx` importa `./index.css` local
- [ ] Sem `@import "@hackathon2026/ui/globals.css"`

**Tests**: none  
**Gate**: —

**Commit**: `chore(front): migrate global styles`

---

### T21: Config env do Front

**What**: `Front/src/config/env.ts` com `@t3-oss/env-nextjs` + `NEXT_PUBLIC_SERVER_URL`.  
**Where**: `Front/src/config/env.ts`, `Front/.env.example`  
**Depends on**: T17  
**Reuses**: `packages/env/src/web.ts`  
**Requirement**: RESTR-10

**Done when**:

- [ ] `env.NEXT_PUBLIC_SERVER_URL` tipado e validado

**Tests**: none  
**Gate**: `cd Front && bun run check-types` (quando app compilar)

**Commit**: `chore(front): add env validation`

---

### T22: Tipos e cliente REST

**What**: Criar `Front/src/types/auth.ts`, `Front/src/lib/api/client.ts`, `Front/src/lib/api/auth.ts` conforme design.  
**Where**: `Front/src/types/auth.ts`, `Front/src/lib/api/**`  
**Depends on**: T21  
**Reuses**: design REST contract  
**Requirement**: RESTR-09, RESTR-10

**Done when**:

- [ ] `authApi.login({ email, password })` chama `POST /api/auth/login`
- [ ] `ApiError` em respostas não-2xx

**Tests**: none  
**Gate**: `cd Front && bun run check-types`

**Commit**: `feat(front): add REST api client for auth`

---

### T23: React Query e Providers sem tRPC

**What**: `Front/src/lib/query-client.ts`; atualizar `providers.tsx` (sem `trpc.ts`); deletar `utils/trpc.ts` se copiado por engano.  
**Where**: `Front/src/lib/query-client.ts`, `Front/src/components/providers.tsx`  
**Depends on**: T22  
**Reuses**: `apps/web/src/components/providers.tsx`  
**Requirement**: RESTR-09, RESTR-15

**Done when**:

- [ ] `providers.tsx` importa `queryClient` de `@/lib/query-client`
- [ ] `rg trpc Front/src` → vazio

**Tests**: none  
**Gate**: no-trpc (Front src)

**Commit**: `refactor(front): replace trpc providers with react query only`

---

### T24: Atualizar `auth-client` e forms (imports + API)

**What**: `auth-client.ts` usa `authApi`; forms usam UI local; remover stubs apenas se escopo incluir wiring real (mínimo: imports corretos + sem trpc).  
**Where**: `Front/src/lib/auth-client.ts`, `Front/src/components/sign-*-form.tsx`  
**Depends on**: T23  
**Requirement**: RESTR-10

**Done when**:

- [ ] Nenhum import `@hackathon2026/*` em `Front/src`
- [ ] `cd Front && bun run build` sucesso

**Tests**: none  
**Gate**: build-fe

**Commit**: `refactor(front): wire auth client to REST api`

---

### T25: Remover legado monorepo

**What**: Deletar `apps/`, `packages/`, `turbo.json`, `bunfig.toml` (se aplicável); limpar `package.json` raiz (workspaces, turbo scripts, catalog trpc).  
**Where**: raiz do repo  
**Depends on**: T16, T24  
**Requirement**: RESTR-01, RESTR-02, RESTR-13, RESTR-14, RESTR-15

**Done when**:

- [ ] Pastas `apps/` e `packages/` ausentes
- [ ] `turbo.json` ausente
- [ ] `rg "@hackathon2026|turbo" .` → vazio (exceto `.specs/`, `node_modules/`)

**Tests**: none  
**Gate**: no-workspace + no-trpc (repo)

**Commit**: `chore: remove turborepo monorepo layout`

---

### T26: Root tooling (eslint, husky, prettier)

**What**: Atualizar `eslint.config.js`, `lint-staged`, `.prettierignore` para `Front/**` e `Backend/**`; root `package.json` mínimo.  
**Where**: raiz — `package.json`, `eslint.config.js`, `.husky/pre-commit`  
**Depends on**: T25  
**Requirement**: RESTR-11, RESTR-12

**Done when**:

- [ ] `bun run lint` na raiz (se existir) ou lint por pasta funciona
- [ ] pre-commit não referencia paths `apps/` ou `packages/`

**Tests**: none  
**Gate**: lint manual

**Commit**: `chore: update root lint and husky paths`

---

### T27: README e `.env.example`

**What**: Reescrever `README.md` com estrutura `Front/` + `Backend/`, comandos por pasta, REST-only, sem menção a turbo/trpc.  
**Where**: `README.md`, `Backend/.env.example`, `Front/.env.example`  
**Depends on**: T26  
**Requirement**: RESTR-11

**Done when**:

- [ ] Instruções `cd Backend && bun install && bun run dev` e `cd Front && ...` corretas
- [ ] `CORS_ORIGIN` documentado alinhado ao Front (3001)

**Tests**: none  
**Gate**: revisão manual

**Commit**: `docs: update readme for front/backend split`

---

## Parallel Execution Map

Nesta feature, **não há tarefas `[P]`** — migração massiva de imports e paths compartilhados exige execução sequencial para evitar estado híbrido.

```
T1─T4 → T5─T11 → T12─T14 → T15─T16 → T17─T24 → T25─T27
```

---

## Task Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1 package.json Backend | 1 arquivo | ✅ |
| T5 shared + 4 test files | 1 camada coesa | ✅ |
| T8 auth domain + 2 tests | 1 módulo domínio | ✅ |
| T19 ui components | 1 pasta coesa (múltiplos arquivos, 1 objetivo) | ✅ |
| T25 delete monorepo | 1 operação de limpeza | ✅ |
| "Migrar tudo de uma vez" | — | ❌ evitado (fatiado em T5–T11) |

---

## Diagram-Definition Cross-Check

| Task | Depends on (body) | Diagram | Status |
|------|-------------------|---------|--------|
| T1 | None | Phase 1 start | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T1 | T1→T3 (parallel no diagram OK — both need T1 only; exec T2 then T3 or T3 after T2) | ⚠️ |
| T4 | T2 | T2→T4 | ✅ |
| T5 | T4 | T4→T5 | ✅ |
| T6 | T5 | T5→T6 | ✅ |
| T7 | T3,T6 | T6→T7 (T3 gate) | ✅ |
| T8 | T5,T6,T7 | T7→T8 | ✅ |
| T9 | T8 | T8→T9 | ✅ |
| T10 | T9 | T9→T10 | ✅ |
| T11 | T10 | T10→T11 | ✅ |
| T12–T14 | chain | Phase 3 | ✅ |
| T15–T16 | T14→T15→T16 | Phase 4 | ✅ |
| T17–T24 | T16→…→T24 | Phase 5 | ✅ |
| T25–T27 | T24→T25→T26→T27 | Phase 6–7 | ✅ |

**Ajuste diagrama:** T3 pode rodar após T1 em paralelo com T2; no execute, ordem **T1 → T2 → T3 → T4** evita conflito.

---

## Test Co-location Validation

Sem `TESTING.md` no projeto — regra inferida: camadas com `*.test.ts` existentes exigem **unit** co-locado na mesma tarefa de migração.

| Task | Layer | Matrix (inferido) | Task Tests | Status |
|------|-------|-------------------|------------|--------|
| T5 | shared adapters/middlewares | unit | unit | ✅ |
| T6 | env | unit | unit | ✅ |
| T8 | auth service/repo | unit | unit | ✅ |
| T9 | auth controller | unit | unit | ✅ |
| T13 | check-auth middleware | unit | unit | ✅ |
| T15 | full suite | unit | unit | ✅ |
| T1–T4, T7, T10–T14, T17–T27 | config/scaffold/cleanup | none | none | ✅ |

---

## Requirement traceability (tasks → spec)

| Req ID | Tasks |
|--------|-------|
| RESTR-01 | T25, T26 |
| RESTR-02 | T17 |
| RESTR-03 | T1–T2, T8–T11, T16 |
| RESTR-04 | T5, T7–T8 |
| RESTR-05 | T6 |
| RESTR-06 | T12–T13 |
| RESTR-07 | T9, T15 |
| RESTR-08 | T13 |
| RESTR-09 | T17–T24 |
| RESTR-10 | T19–T21, T24 |
| RESTR-11 | T27 |
| RESTR-12 | T26 |
| RESTR-13 | T11, T25 |
| RESTR-14 | T25 |
| RESTR-15 | T12–T14, T23, T25 |

**Coverage:** 15 requisitos → 27 tarefas mapeadas ✅

---

## Ferramentas (pergunta antes do Execute)

Antes de implementar, confirme preferências:

| Task range | MCP / Skill sugerido |
|------------|----------------------|
| T1–T16 Backend | Shell, Grep; Context7 só se Prisma 7 path mudar |
| T17–T24 Front | Shell; Context7 para Next 16 se build falhar |
| T25–T27 | Shell, gh (se PR) |

**Skills opcionais:** nenhum obrigatório; feature é refactor mecânico.

---

## Execução (2026-05-26)

| Fase | Tasks | Gate |
|------|-------|------|
| Backend foundation | T1–T4 | install, db:generate, vitest |
| Backend código | T5–T11 | check-types, testes por módulo |
| Remover tRPC | T12–T14 | no-trpc Backend |
| Gates Backend | T15–T16 | 8 test files, build |
| Front | T17–T24 | install, build-fe, no-trpc |
| Limpeza + docs | T25–T27 | apps/packages removidos, README |

**Subagents usados:** 9 (T1, exploração×3, T5–11, T12–16, T17–21, T22–24, T25–27) + orquestração principal.

**Commits:** não criados (aguardar pedido explícito). Sugerir commits atômicos por task conforme mensagens em cada T*.
