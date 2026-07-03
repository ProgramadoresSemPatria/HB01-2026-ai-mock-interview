# Refatoração da Estrutura de Testes — Specification

## Problem Statement

O projeto possui **28 arquivos de teste** com estratégias inconsistentes: repositórios testados com Prisma mockado (não provam queries reais), controllers testados em unit quando a regra é cobri-los via E2E, e apenas **1 suite E2E** (`auth`). Isso gera manutenção duplicada, falsa confiança em camadas de persistência e lacunas de cobertura nos fluxos HTTP dos demais módulos.

A refatoração alinha toda a pirâmide de testes a uma política explícita por camada, reduzindo testes de baixo valor e concentrando esforço onde há retorno real.

## Goals

- [x] Cada camada de produção segue **exatamente um** tipo de teste (unit, integration, e2e ou nenhum)
- [x] **0 testes** em `controller/` e `routes/` após refatoração
- [x] **100% dos repositórios** testados contra banco real (PostgreSQL), sem mock de Prisma
- [x] Integration e E2E usam **[Testcontainers Node](https://github.com/testcontainers/testcontainers-node)** — containers efêmeros, sem depender de `docker compose up` manual
- [x] Suites separadas executáveis via npm: `test` (unit), `test:integration`, `test:e2e`
- [x] E2E cobre fluxos HTTP de **auth, resumes, interview e review-items**
- [x] Documentação em `.specs/codebase/TESTING.md` reflete a política adotada

## Out of Scope

| Item | Motivo |
|------|--------|
| Aumentar cobertura % artificialmente | Foco em estrutura e valor, não métrica |
| Testar `factories/`, `protocols/`, `types/` | Interfaces/helpers — TypeScript + E2E cobrem |
| Testar `config/app.ts` ou wiring de rotas isoladamente | Coberto indiretamente pelo E2E |
| CI/CD pipeline (GitHub Actions) | Pode ser feature separada — mas CI precisará de Docker para integration/E2E |
| Frontend | Escopo é Backend |
| Substituir `docker compose` para dev local | Testcontainers é só para testes; dev continua com compose existente |

---

## Infraestrutura de Testes: Testcontainers

> Fonte: [testcontainers-node docs](https://github.com/testcontainers/testcontainers-node) via Context7 (`/testcontainers/testcontainers-node`).

### Por que Testcontainers

O setup atual de E2E (`src/test/e2e/database.ts`) exige `DATABASE_URL` apontando para um PostgreSQL já rodando, cria/recria schema manualmente via `pg` client e assume Redis em `localhost:6379`. Isso acopla testes ao ambiente do desenvolvedor e complica CI.

**Testcontainers** sobe containers Docker descartáveis por suite, injeta connection strings dinâmicas e faz teardown automático (Ryuk). Elimina a necessidade de pré-provisionar banco/redis antes de rodar integration/E2E.

### Pré-requisitos

| Requisito | Onde se aplica |
|-----------|----------------|
| **Docker Desktop / Docker Engine** rodando | `test:integration`, `test:e2e`, `test:all` |
| Nenhum serviço externo pré-iniciado | Unit (`test`) e pre-commit |

### Pacotes (devDependencies)

```bash
bun add -d @testcontainers/postgresql @testcontainers/redis testcontainers
```

| Pacote | Uso |
|--------|-----|
| `@testcontainers/postgresql` | `PostgreSqlContainer` — repositórios integration + E2E |
| `@testcontainers/redis` | `RedisContainer` — E2E (BullMQ / `REDIS_URL`) |
| `testcontainers` | Core (`GenericContainer`, features compartilhadas) |

### Padrão Vitest: globalSetup + inject

Conforme [global-setup docs](https://github.com/testcontainers/testcontainers-node/blob/main/docs/quickstart/global-setup.md):

1. **globalSetup** sobe container(s), define `process.env`, e expõe valores via `project.provide()`
2. **Testes** consomem via `inject("databaseUrl")` / `inject("redisUrl")` do Vitest
3. **teardown** chama `container.stop()` — Ryuk limpa containers órfãos em crash

```typescript
// vitest.integration.global-setup.ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "./src/test/containers/migrate-database";

let postgresContainer: StartedPostgreSqlContainer;

export async function setup(project: TestProject) {
  postgresContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const databaseUrl = postgresContainer.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;
  project.provide("databaseUrl", databaseUrl);

  await runMigrations(databaseUrl);
}

export async function teardown() {
  await postgresContainer?.stop();
}
```

```typescript
// Exemplo em *.integration.test.ts
import { inject, beforeAll, afterEach } from "vitest";
import { truncateTables } from "@/test/integration/helpers";

beforeAll(() => {
  // DATABASE_URL já setado pelo globalSetup; Prisma usa env
});

afterEach(async () => {
  await truncateTables(inject("databaseUrl"));
});
```

### Dois globalSetups separados

| Suite | Containers | globalSetup |
|-------|------------|-------------|
| **Integration** (`*.integration.test.ts`) | PostgreSQL only | `vitest.integration.global-setup.ts` |
| **E2E** (`*.e2e.test.ts`) | PostgreSQL + Redis | `vitest.e2e.global-setup.ts` |

E2E precisa de Redis porque `resume-queue.ts` usa BullMQ/ioredis e `REDIS_URL` é obrigatório no schema de env.

```typescript
// vitest.e2e.global-setup.ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer } from "@testcontainers/redis";

export async function setup(project: TestProject) {
  const [postgres, redis] = await Promise.all([
    new PostgreSqlContainer("postgres:16-alpine").start(),
    new RedisContainer("redis:8-alpine").start(),
  ]);

  const databaseUrl = postgres.getConnectionUri();
  const redisUrl = redis.getConnectionUrl();

  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;
  project.provide("databaseUrl", databaseUrl);
  project.provide("redisUrl", redisUrl);

  await runMigrations(databaseUrl);
}

export async function teardown() {
  await Promise.all([postgresContainer?.stop(), redisContainer?.stop()]);
}
```

### Migrações Prisma

Após container start, aplicar migrations existentes em `prisma/migrations/` — reutilizar lógica de `readAllMigrationSql()` de `src/test/e2e/database.ts`, extraída para helper compartilhado:

```
src/test/containers/
├── migrate-database.ts       # lê SQL das migrations, executa via pg Client
├── vitest.integration.global-setup.ts
└── vitest.e2e.global-setup.ts
```

Alternativa futura: `prisma migrate deploy` apontando para `DATABASE_URL` do container (fora do escopo inicial — SQL direto já funciona no E2E atual).

### Isolamento entre testes

| Estratégia | Onde |
|------------|------|
| **Truncate tables** entre testes (`beforeEach`/`afterEach`) | Integration + E2E |
| **`fileParallelism: false`** | Integration + E2E configs (DB compartilhado por suite) |
| Container único por suite (globalSetup) | Performance — sobe 1x, roda N testes |

### Reuse local (opcional, P3)

[Testcontainers reuse](https://github.com/testcontainers/testcontainers-node/blob/main/docs/features/containers.md) evita recriar container entre runs locais:

```typescript
new PostgreSqlContainer("postgres:16-alpine")
  .withReuse()
  .start();
```

Habilitado por padrão salvo `TESTCONTAINERS_REUSE_ENABLE=false`. **Não usar em CI** — manter containers efêmeros. Documentar em TESTING.md como opt-in para dev.

### Substituição do setup manual atual

| Arquivo atual | Destino |
|---------------|---------|
| `src/test/e2e/database.ts` → `initializeE2EDatabase()` | **Remover** — substituído por Testcontainers globalSetup |
| `src/test/e2e/database.ts` → `truncateE2ETables()` | **Mover** para `src/test/containers/truncate-tables.ts` (reutilizado por integration + e2e) |
| `vitest.e2e.setup.ts` defaults de `DATABASE_URL`/`REDIS_URL` | **Remover** URLs fixas — globalSetup injeta valores dinâmicos |
| `auth.e2e.test.ts` → `beforeAll(initializeE2EDatabase)` | **Substituir** por confiança no globalSetup |

### Config Vitest atualizada

```typescript
// vitest.integration.config.ts
export default defineConfig({
  test: {
    globalSetup: ["./src/test/containers/vitest.integration.global-setup.ts"],
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    setupFiles: ["./vitest.setup.ts"],
  },
});

// vitest.e2e.config.ts
export default defineConfig({
  test: {
    globalSetup: ["./src/test/containers/vitest.e2e.global-setup.ts"],
    include: ["src/**/*.e2e.test.ts"],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 90_000,
    setupFiles: ["./vitest.setup.ts", "./vitest.e2e.setup.ts"], // env defaults sem DB/Redis
  },
});
```

---

## Política de Testes por Camada

### Regra de ouro

| Pergunta | Tipo |
|----------|------|
| Tem lógica de negócio isolável? | **Unit** |
| Depende de banco ou serviço externo? | **Integration** |
| É ponto de entrada HTTP? | **E2E** |
| Não tem lógica própria? | **Nenhum** |

### Tabela oficial

| Camada | Tipo | Motivo |
|--------|------|--------|
| `service/` | **Unit** | Lógica de negócio. Mocka repositório e adapters. |
| `repository/` | **Integration** | Banco real. Mock de Prisma não prova queries. |
| `adapters/` | **Integration** | Mock de API externa (MSW). Testa transformação da resposta. |
| `controller/` | **Nenhum** | Sem lógica. Coberto pelo E2E. |
| `routes/` | **Nenhum** | Configuração pura. Coberto pelo E2E. |
| `middlewares/` | **Unit** se tiver lógica, senão nenhum | Ex.: `check-auth` = unit; pass-through = nenhum. |
| `validations/` | **Unit** | Regras Zod isoladas, especialmente condicionais. |
| `errors/` | **Unit** se tiver lógica, senão nenhum | Classes fixas = nenhum. |
| `factories/` | **Nenhum** | Helper de composição. |
| `protocols/` | **Nenhum** | Interfaces/tipos. |
| `config/` | **Nenhum** | Coberto indiretamente pelo E2E. |
| Fluxo completo HTTP | **E2E (supertest)** | Maior valor, mínima manutenção. |

### Extensão: camadas fora do guia original

| Camada | Tipo proposto | Justificativa |
|--------|---------------|---------------|
| `prompts/` | **Unit** | Funções puras de montagem de string com regras testáveis |
| `infrastructure/ai/langgraph/` (funções puras, ex. `stream-message-tokens`) | **Unit** | Lógica de transformação isolável, sem I/O |
| `infrastructure/ai/langgraph/` (grafos, ex. `build-interview-graph`) | **Unit** | Mock de LLM/nós; sem chamada real à OpenAI |
| `infrastructure/ai/checkpoint/` | **Nenhum** | Thin wrapper singleton sobre lib externa |
| `infrastructure/queue/` (ex. `resume-processor`) | **Unit** | Orquestração com mocks de repo, storage e LLM |
| `shared/adapters/cryptography/` (bcrypt, jwt) | **Unit** | Não são APIs HTTP; testam transformação local |
| `shared/adapters/mailer/` | **Integration** | Adapter de serviço externo (SMTP) — mock via MSW ou transport injetado |
| `config/env/*-schema.ts` | **Unit** (em `validations/` ou colocado junto ao schema) | É validação Zod, não config de runtime |

> **Decisão pendente (TEST-CTX-01):** Confirmar extensão acima antes da fase Design.

---

## Inventário: Estado Atual → Estado Alvo

### Remover (5 arquivos) — controller tests

| Arquivo atual | Ação | Cobertura substituta |
|---------------|------|----------------------|
| `modules/auth/controller/auth-controller.test.ts` | **Deletar** | Expandir `auth.e2e.test.ts` (já cobre) |
| `modules/interview/controller/interview-controller.test.ts` | **Deletar** | Novo `interview.e2e.test.ts` |
| `modules/resumes/controller/resumes-controller.test.ts` | **Deletar** | Novo `resumes.e2e.test.ts` |
| `modules/review-items/controller/review-items-controller.test.ts` | **Deletar** | Novo `review-items.e2e.test.ts` |

### Converter mock → integration (5 repositórios)

| Arquivo atual | Problema | Ação |
|---------------|----------|------|
| `modules/auth/repository/user-repository.test.ts` | Mock Prisma | Reescrever como `user-repository.integration.test.ts` com DB real |
| `modules/resumes/repository/resume-repository.test.ts` | Mock Prisma | Reescrever como integration |
| `modules/interview/repository/session-repository.test.ts` | Mock Prisma | Reescrever como integration |
| `modules/interview/repository/message-repository.test.ts` | Mock Prisma | Reescrever como integration |
| `modules/interview/repository/review-repository.test.ts` | Mock Prisma | Reescrever como integration |

### Manter como unit (14 arquivos)

| Arquivo | Status |
|---------|--------|
| `modules/auth/service/auth-service.test.ts` | ✅ Correto |
| `modules/resumes/service/resume-service.test.ts` | ✅ Correto |
| `modules/interview/service/session-service.test.ts` | ✅ Correto |
| `modules/interview/service/stream-service.test.ts` | ✅ Correto |
| `modules/interview/service/review-merge-service.test.ts` | ✅ Correto |
| `modules/review-items/service/review-items-service.test.ts` | ✅ Correto |
| `modules/auth/middlewares/check-auth-middleware.test.ts` | ✅ Correto |
| `shared/middlewares/error-handler-middleware.test.ts` | ✅ Correto |
| `modules/interview/validations/interview-schemas.test.ts` | ✅ Correto |
| `modules/interview/prompts/interviewer-system-prompt.test.ts` | ✅ Correto (prompts = unit) |
| `infrastructure/ai/langgraph/stream-message-tokens.test.ts` | ✅ Correto |
| `infrastructure/ai/langgraph/build-interview-graph.test.ts` | ✅ Correto |
| `infrastructure/queue/resume-processor.test.ts` | ✅ Correto |
| `shared/adapters/cryptography/*.test.ts` (2) | ✅ Correto (crypto local) |

### Remover ou realocar (1 arquivo)

| Arquivo | Ação |
|---------|------|
| `config/env/server.test.ts` | **Mover** lógica para `server-schema.test.ts` (unit de validação) ou **deletar** se E2E + startup cobrem |

### Remover (1 arquivo) — thin wrapper

| Arquivo | Ação |
|---------|------|
| `infrastructure/ai/checkpoint/postgres-checkpointer.test.ts` | **Deletar** — singleton wrapper sem lógica própria |

### Evoluir adapter mailer (1 arquivo)

| Arquivo | Ação |
|---------|------|
| `shared/adapters/mailer/nodemailer-mailer-adapter.test.ts` | Manter abordagem atual (transport injetado) **ou** migrar para MSW — ver TEST-CTX-02 |

### Adicionar — lacunas identificadas

| Camada | Arquivo a criar |
|--------|-----------------|
| `validations/` auth | `signup-schema.test.ts`, `login-schema.test.ts`, etc. |
| `validations/` resumes | `resume-schemas.test.ts` |
| `validations/` review-items | `review-items-schemas.test.ts` |
| E2E | `interview.e2e.test.ts`, `resumes.e2e.test.ts`, `review-items.e2e.test.ts` |
| Testcontainers | `src/test/containers/` (globalSetups, migrate, truncate) |
| Integration helpers | `src/test/integration/helpers.ts` (truncate, prisma factory) |

---

## Convenções de Nomenclatura e Estrutura

### Sufixos de arquivo

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Unit | `*.test.ts` | `auth-service.test.ts` |
| Integration | `*.integration.test.ts` | `user-repository.integration.test.ts` |
| E2E | `*.e2e.test.ts` | `auth.e2e.test.ts` |

### Localização

- **Colocated:** testes unit e integration ficam ao lado do código fonte (padrão atual)
- **Centralizado:** apenas helpers, mocks e setup em `src/test/`

```
src/test/
├── containers/
│   ├── migrate-database.ts              # aplica prisma/migrations via pg Client
│   ├── truncate-tables.ts               # truncate entre testes (shared)
│   ├── vitest.integration.global-setup.ts  # PostgreSqlContainer
│   └── vitest.e2e.global-setup.ts       # PostgreSqlContainer + RedisContainer
├── e2e/
│   ├── auth.e2e.test.ts
│   ├── interview.e2e.test.ts
│   ├── resumes.e2e.test.ts
│   └── review-items.e2e.test.ts
├── integration/
│   └── helpers.ts                       # truncate + getPrisma() via inject
├── mocks/
│   └── bun-password.ts
└── helpers/                             # factories de payload, auth helpers E2E
    ├── auth-helpers.ts
    └── ...
```

### Scripts npm alvo

```json
{
  "test": "vitest run",
  "test:integration": "vitest run -c vitest.integration.config.ts",
  "test:e2e": "vitest run -c vitest.e2e.config.ts",
  "test:all": "bun run test && bun run test:integration && bun run test:e2e"
}
```

### Config Vitest alvo

| Config | include | globalSetup | exclude |
|--------|---------|-------------|---------|
| `vitest.config.ts` | `src/**/*.test.ts` | — | `*.integration.test.ts`, `*.e2e.test.ts` |
| `vitest.integration.config.ts` | `src/**/*.integration.test.ts` | `vitest.integration.global-setup.ts` | — |
| `vitest.e2e.config.ts` | `src/**/*.e2e.test.ts` | `vitest.e2e.global-setup.ts` | — |

---

## User Stories

### P1: Infraestrutura de testes separada por tipo ⭐ MVP

**User Story**: Como desenvolvedor, quero executar unit, integration e E2E separadamente para feedback rápido no dia a dia e confiança total no CI.

**Why P1**: Sem a separação, a refatoração não tem como ser validada incrementalmente.

**Acceptance Criteria**:

1. WHEN executo `bun run test` THEN apenas arquivos `*.test.ts` (exceto integration/e2e) SHALL ser executados
2. WHEN executo `bun run test:integration` THEN PostgreSQL SHALL ser provisionado via `PostgreSqlContainer` (Testcontainers) sem `DATABASE_URL` pré-configurada
3. WHEN executo `bun run test:e2e` THEN PostgreSQL e Redis SHALL ser provisionados via Testcontainers e injetados via `inject()`
4. WHEN um arquivo termina em `.integration.test.ts` THEN SHALL ser excluído da suite unit
5. WHEN Docker não está disponível THEN integration/E2E SHALL falhar com erro explícito do Testcontainers (não hang silencioso)

**Independent Test**: Rodar os 3 comandos isoladamente e verificar contagem de arquivos correta.

---

### P1: Eliminar testes de controller ⭐ MVP

**User Story**: Como mantenedor, quero remover testes unitários de controllers para evitar duplicação com E2E.

**Why P1**: 4 arquivos (~800+ linhas) testam wiring HTTP já coberto por supertest.

**Acceptance Criteria**:

1. WHEN a refatoração termina THEN zero arquivos `controller/*.test.ts` SHALL existir
2. WHEN deleto testes de controller THEN nenhum cenário único de controller SHALL ser perdido — cenários equivalentes MUST existir em E2E ou já existirem
3. WHEN rodo `bun run test` THEN suite unit SHALL passar sem os controller tests

**Independent Test**: `glob **/controller/*.test.ts` retorna vazio; E2E auth continua verde.

---

### P1: Repositórios como integration com banco real ⭐ MVP

**User Story**: Como desenvolvedor, quero que testes de repositório provem que queries Prisma funcionam de verdade.

**Why P1**: Todos os 5 repositórios atuais mockam Prisma — violação direta da política.

**Acceptance Criteria**:

1. WHEN testo um repositório THEN SHALL usar Prisma client real conectado ao PostgreSQL do Testcontainers
2. WHEN testo um repositório THEN SHALL NOT mockar `@/infrastructure/database`
3. WHEN cada teste de repositório inicia THEN tabelas relevantes SHALL estar truncadas via `truncate-tables.ts`
4. WHEN rodo `bun run test:integration` THEN todos os 5 repositórios SHALL passar com container efêmero

**Independent Test**: Inspecionar imports — nenhum `vi.mock("@/infrastructure/database")` em `*.integration.test.ts`.

---

### P1: Testcontainers como infra de integration/E2E ⭐ MVP

**User Story**: Como desenvolvedor, quero que integration e E2E subam PostgreSQL (e Redis no E2E) automaticamente via Docker, sem configurar `DATABASE_URL` manualmente.

**Why P1**: Desbloqueia repositórios integration e E2E novos; remove acoplamento ao `docker compose up` antes de testar.

**Acceptance Criteria**:

1. WHEN instalo dependências THEN `@testcontainers/postgresql`, `@testcontainers/redis` e `testcontainers` SHALL estar em devDependencies
2. WHEN globalSetup de integration roda THEN `PostgreSqlContainer` SHALL start, migrations SHALL apply, e `project.provide("databaseUrl")` SHALL expor URI
3. WHEN globalSetup de E2E roda THEN PostgreSQL + Redis SHALL start em paralelo e `REDIS_URL`/`DATABASE_URL` SHALL ser setados em `process.env`
4. WHEN suite termina THEN teardown SHALL chamar `container.stop()` em todos os containers
5. WHEN `src/test/e2e/database.ts` for substituído THEN `initializeE2EDatabase()` SHALL ser removido; truncate SHALL viver em `truncate-tables.ts`

**Independent Test**: Rodar `bun run test:integration` com Docker ativo e zero serviços locais pré-iniciados — testes passam.

---

### P2: Expandir cobertura E2E para todos os módulos

**User Story**: Como mantenedor, quero E2E por módulo cobrindo happy path e erros principais de cada rota pública/protegida.

**Why P2**: Auth já tem E2E robusto; interview, resumes e review-items não têm nenhum.

**Acceptance Criteria**:

1. WHEN rodo E2E de interview THEN SHALL cobrir criar sessão, stream (smoke), listar mensagens
2. WHEN rodo E2E de resumes THEN SHALL cobrir upload (mock storage), get by id, 404
3. WHEN rodo E2E de review-items THEN SHALL cobrir listagem e operações expostas nas rotas
4. WHEN E2E precisa de auth THEN SHALL reutilizar helpers de signup/login de `auth-helpers.ts`
5. WHEN serviço externo é necessário (OpenAI, R2, SMTP) THEN E2E SHALL mockar no nível de módulo (padrão já usado em auth com nodemailer)

**Independent Test**: `bun run test:e2e` executa ≥4 suites e todas passam.

---

### P2: Completar testes unit de validations

**User Story**: Como desenvolvedor, quero testes unitários para todos os schemas Zod, especialmente regras condicionais.

**Why P2**: Apenas `interview-schemas` tem testes; auth tem 5 schemas sem teste.

**Acceptance Criteria**:

1. WHEN existe schema Zod com `.refine()` ou `.superRefine()` THEN SHALL ter teste unit cobrindo casos válidos e inválidos
2. WHEN rodo `bun run test` THEN schemas de auth, resumes e review-items SHALL ter arquivos `*.test.ts` colocados

**Independent Test**: Cada pasta `validations/` contém pelo menos um `*.test.ts`.

---

### P3: Documentação TESTING.md

**User Story**: Como novo contribuidor, quero um guia claro de onde e como escrever testes.

**Acceptance Criteria**:

1. WHEN leio `.specs/codebase/TESTING.md` THEN SHALL encontrar tabela por camada, sufixos, comandos npm e exemplos
2. WHEN contribuo código novo THEN SHALL saber qual tipo de teste criar sem perguntar

---

## Edge Cases

- WHEN Docker daemon não está rodando THEN integration/E2E SHALL falhar rapidamente com mensagem do Testcontainers
- WHEN teste de repositório cria dados THEN SHALL limpar entre testes via `truncate-tables.ts`
- WHEN E2E mocka OpenAI THEN SHALL não depender de `OPENAI_API_KEY` real
- WHEN deletamos teste de controller THEN SHALL verificar que cenário de erro HTTP (4xx) existe no E2E equivalente
- WHEN adapter cryptography (jwt/bcrypt) roda THEN permanece na suite unit (não integration)
- WHEN globalSetup sobe container THEN hookTimeout SHALL ser ≥120s (pull de imagem na primeira execução)
- WHEN múltiplos test files rodam na mesma suite THEN `fileParallelism: false` SHALL evitar race conditions no DB compartilhado
- WHEN dev usa `.withReuse()` localmente THEN CI SHALL manter containers efêmeros (sem reuse)

---

## Requirement Traceability

| Requirement ID | Story | Descrição | Status |
|----------------|-------|-----------|--------|
| TEST-01 | P1 | Config Vitest separada (unit/integration/e2e) | Verified |
| TEST-02 | P1 | Scripts npm `test`, `test:integration`, `test:e2e`, `test:all` | Verified |
| TEST-03 | P1 | Deletar 4 controller test files | Verified |
| TEST-04 | P1 | Converter 5 repository tests para integration com DB real | Verified |
| TEST-05 | P1 | Setup Testcontainers: `src/test/containers/` (globalSetups, migrate, truncate) | Verified |
| TEST-06 | P1 | Deletar `postgres-checkpointer.test.ts` | Verified |
| TEST-18 | P1 | Instalar `@testcontainers/postgresql`, `@testcontainers/redis`, `testcontainers` | Verified |
| TEST-19 | P1 | `vitest.integration.global-setup.ts` com PostgreSqlContainer + migrations | Verified |
| TEST-20 | P1 | `vitest.e2e.global-setup.ts` com PostgreSqlContainer + RedisContainer | Verified |
| TEST-21 | P1 | Migrar `auth.e2e.test.ts` off de `initializeE2EDatabase()` | Verified |
| TEST-22 | P1 | Remover `src/test/e2e/database.ts` (substituído por containers/) | Verified |
| TEST-07 | P2 | Criar `interview.e2e.test.ts` | Verified |
| TEST-08 | P2 | Criar `resumes.e2e.test.ts` | Verified |
| TEST-09 | P2 | Criar `review-items.e2e.test.ts` | Verified |
| TEST-10 | P2 | Criar `src/test/helpers/auth-helpers.ts` | Verified |
| TEST-11 | P2 | Testes unit para auth validations (5 schemas) | Verified |
| TEST-12 | P2 | Testes unit para resume-schemas | Verified |
| TEST-13 | P2 | Testes unit para review-items-schemas | Verified |
| TEST-14 | P2 | Realocar/deletar `server.test.ts` | Verified |
| TEST-15 | P3 | Criar `.specs/codebase/TESTING.md` (inclui prereq Docker + Testcontainers) | Verified |
| TEST-16 | P2 | Decidir estratégia mailer adapter (TEST-CTX-02) | Verified (unchanged) |
| TEST-17 | P1 | Confirmar extensão infrastructure/prompts (TEST-CTX-01) | Verified (unchanged) |

**Coverage:** 22 total, 22 verified ✅

---

## Success Criteria

- [x] `bun run test:all` passa com **Docker rodando** (sem `docker compose up` prévio)
- [x] Zero arquivos em `controller/*.test.ts`
- [x] Zero `vi.mock("@/infrastructure/database")` em testes de repositório
- [x] Zero dependência de `DATABASE_URL`/`REDIS_URL` hardcoded para integration/E2E
- [x] ≥4 suites E2E (auth + 3 novos módulos)
- [x] Pre-commit hook continua passando (`vitest run` — só unit, sem Docker)
- [x] Redução líquida de arquivos de teste de baixo valor (~5 deletions) com aumento de integration/E2E de alto valor

---

## Resumo Quantitativo

| Métrica | Atual | Alvo |
|---------|-------|------|
| Unit tests | ~22 | ~20 (mantém services, middlewares, validations, prompts, infra pura) |
| Integration tests | 0 | 5 (repositórios) |
| E2E tests | 1 | 4 |
| Controller tests | 4 | **0** |
| Repository tests mockados | 5 | **0** |
| Validation gaps | 3 módulos sem teste | 0 |
