# Expansão de Cenários de Teste — Specification

## Problem Statement

A feature [test-structure-refactor](../test-structure-refactor/spec.md) entregou a **pirâmide correta** (unit / integration / E2E separados, Testcontainers, 4 suites E2E). Porém, uma auditoria pós-refatoração mostrou que **cenários de erro e fluxos de negócio** ainda dependem quase só de testes unit — especialmente fora de `auth`.

Consequências:

- Regressões HTTP (400/409/502) podem passar com suites verdes em unit.
- Métodos de repositório com SQL real (`pg_trgm`, updates de sessão) não são exercitados em integration.
- Dois prompts e o `validation-middleware` violam a política “código com lógica → unit”.

Esta feature **não altera código de produção** (salvo helpers de teste). O objetivo é fechar lacunas de cenário identificadas na auditoria, priorizando E2E.

## Relationship to Prior Work

| Documento | Relação |
|-----------|---------|
| [test-structure-refactor/spec.md](../test-structure-refactor/spec.md) | Define **onde** cada teste vive; esta feature define **quais cenários** faltam |
| [docs/TESTING.md](../../../docs/TESTING.md) | Política por camada — permanece fonte de verdade para sufixos e comandos |

## Goals

- [x] **E2E:** adicionar ≥25 novos casos cobrindo erros principais e fluxos de negócio em interview, resumes, review-items e auth (além dos 30 existentes)
- [x] **Integration:** cobrir métodos de `SessionRepository` e `ReviewRepository` ainda sem teste contra PostgreSQL real
- [x] **Unit:** 3 arquivos colocados (`validation-middleware`, 2 prompts) alinhados ao padrão de `interviewer-system-prompt.test.ts`
- [x] **Zero** alteração de comportamento de produção — apenas testes e, se necessário, helpers em `src/test/`
- [x] Todas as suites passam: `bun run test`, `bun run test:integration`, `bun run test:e2e`

## Out of Scope

| Item | Motivo |
|------|--------|
| Novos endpoints ou mudança de contrato API | Escopo é cobertura, não feature de produto |
| Testes de rate limiting (`authRateLimiter`) | Comportamento de infra; não listado na auditoria crítica |
| CI/CD (GitHub Actions com Docker) | Feature separada |
| Refatorar produção para alinhar design antigo (ex.: 409 vs 400 em resume) | Testes devem refletir **comportamento atual** documentado abaixo |
| Cobertura % como meta | Foco em cenários de valor, não métrica |
| `review-items-generator-adapter` dedicado | Coberto indiretamente; adapter orquestra LLM + repo |

## HTTP Status Reference (comportamento atual)

Testes E2E SHALL assertar estes códigos/mensagens (fonte: services + `http-errors.ts` + middleware):

| Cenário | Status | `message` (quando aplicável) |
|---------|--------|------------------------------|
| Sem Bearer | 401 | `Authentication required` |
| Bearer malformado (sem scheme/token) | 401 | `Authentication required` |
| Token JWT inválido/expirado | 401 | `Invalid or expired token` |
| Payload Zod inválido | 422 | `Validation failed` + `errors` |
| Resume não encontrado / outro user | 404 | `Resume not found` ou `Not Found` |
| Sessão não encontrada / outro user | 404 | `Not Found` |
| Resume `processing` ao criar sessão | 400 | `Resume is still being processed` |
| Resume `failed` ao criar sessão | 400 | `Resume processing failed` |
| Sessão finalizada no stream | 409 | `Interview session is finished` |
| Upload sem PDF / não-PDF / tamanho | 400 | `PDF file is required` / `Only PDF files are allowed` / `PDF file must be at most N bytes` |
| Falha R2 no upload | 502 | `Failed to upload PDF` |
| Fila indisponível no upload | 503 | `Resume processing is unavailable` |
| Email duplicado signup | 400 | `Email already in use` |

---

## User Stories

### P1: E2E — fluxos de negócio críticos (Interview + Resumes) ⭐ MVP

**User Story**: Como mantenedor, quero E2E que provem regras de negócio expostas via HTTP que hoje só existem em unit, para evitar regressões em produção.

**Why P1**: Maior risco identificado na auditoria; impacto direto no usuário (entrevista com CV não pronto, stream em sessão encerrada, upload inválido).

**Acceptance Criteria**:

1. WHEN `POST /api/interview/sessions` com resume em status `processing` THEN API SHALL retornar **400** com mensagem contendo processamento em andamento
2. WHEN `POST /api/interview/sessions` com resume em status `failed` THEN API SHALL retornar **400** com mensagem de falha de processamento
3. WHEN `POST /api/interview/sessions` com `resumeId` inexistente ou de outro usuário THEN API SHALL retornar **404**
4. WHEN `POST /api/interview/sessions/:sessionId/stream` em sessão com `isFinished: true` THEN API SHALL retornar **409** com `Interview session is finished`
5. WHEN `POST /api/resumes/` sem arquivo THEN API SHALL retornar **400** `PDF file is required`
6. WHEN `POST /api/resumes/` com mimetype não-PDF THEN API SHALL retornar **400** `Only PDF files are allowed`
7. WHEN `POST /api/resumes/` com PDF acima de `RESUME_MAX_BYTES` THEN API SHALL retornar **400** com limite de bytes na mensagem

**Independent Test**: `bun run test:e2e -- src/test/e2e/interview.e2e.test.ts src/test/e2e/resumes.e2e.test.ts` — novos `it` passam sem alterar produção.

---

### P1: E2E — autorização HTTP consistente ⭐ MVP

**User Story**: Como mantenedor, quero que rotas protegidas retornem 401 de forma previsível, não apenas no smoke de auth.

**Why P1**: Lacuna transversal; middleware já testado em unit mas não propagado a todos os módulos E2E.

**Acceptance Criteria**:

1. WHEN `GET /api/interview/sessions` sem auth THEN API SHALL retornar **401** `Authentication required`
2. WHEN `GET /api/interview/sessions/:id/messages` sem auth THEN API SHALL retornar **401**
3. WHEN `POST /api/interview/sessions/:sessionId/stream` sem auth THEN API SHALL retornar **401**
4. WHEN `GET /api/resumes/:id` sem auth THEN API SHALL retornar **401**
5. WHEN rota protegida recebe `Authorization: Bearer not-a-jwt` THEN API SHALL retornar **401** `Invalid or expired token`
6. WHEN rota protegida recebe header malformado (ex.: `Token xyz`) THEN API SHALL retornar **401** `Authentication required`

**Independent Test**: Novos `it` em `interview.e2e.test.ts`, `resumes.e2e.test.ts` e `auth.e2e.test.ts` (bearer inválido).

---

### P2: E2E — erros de domínio e resiliência

**User Story**: Como mantenedor, quero E2E para erros 404/422/502/503 e listagens vazias/isoladas, completando “erros principais” da spec P2 do refactor.

**Why P2**: Importante para confiança, mas menor risco que P1.

**Acceptance Criteria**:

1. WHEN `GET /api/interview/sessions/:id/messages` para sessão inexistente (UUID válido) THEN API SHALL retornar **404** `Not Found`
2. WHEN `POST /api/interview/sessions/:sessionId/stream` para sessão inexistente ou de outro user THEN API SHALL retornar **404**
3. WHEN `POST /api/interview/sessions/:sessionId/stream` com body inválido (`streamMessageSchema`) THEN API SHALL retornar **422** `Validation failed`
4. WHEN `POST /api/resumes/` e mock de storage lança THEN API SHALL retornar **502**; registro no DB SHALL ficar `failed`
5. WHEN `POST /api/resumes/` e mock de queue lança THEN API SHALL retornar **503**; registro no DB SHALL ficar `failed`
6. WHEN `GET /api/review-items/` para usuário sem itens THEN API SHALL retornar **200** com `reviewItems: []`
7. WHEN `GET /api/review-items/` THEN itens de outro usuário SHALL NOT aparecer na resposta
8. WHEN `POST /api/auth/login` com payload inválido THEN API SHALL retornar **422**
9. WHEN `POST /api/auth/request-password-reset` com payload inválido THEN API SHALL retornar **422**
10. WHEN `POST /api/auth/reset-password` com payload inválido THEN API SHALL retornar **422**
11. WHEN `POST /api/auth/refresh` com token aleatório (não reutilização) THEN API SHALL retornar **401**

**Independent Test**: Suites E2E completas passam (`bun run test:e2e`).

---

### P2: Integration — métodos de repositório faltantes

**User Story**: Como desenvolvedor, quero provar em PostgreSQL real os updates de sessão e buscas fuzzy de review items.

**Why P2**: SQL `similarity()` / `pg_trgm` e updates Prisma não são validados com mock.

**Acceptance Criteria**:

1. WHEN `SessionRepository.incrementTurnCount(id)` THEN `turnCount` SHALL incrementar e persistir
2. WHEN `SessionRepository.markFinished(id)` THEN `isFinished` SHALL ser `true`
3. WHEN `ReviewRepository.findByUserIdAndTopicCaseInsensitive` com variação de case THEN SHALL retornar o mesmo item
4. WHEN `ReviewRepository.findSimilarByUserIdAndTopic` com tópicos semanticamente próximos THEN SHALL retornar match acima do threshold (seed controlado no teste)

**Independent Test**: `bun run test:integration` — arquivos de session e review repository passam com novos `it`.

---

### P2: Unit — prompts e validation middleware

**User Story**: Como desenvolvedor, quero testes unitários colocados para funções puras de prompt e middleware de validação.

**Why P2**: Política do refactor; baixo esforço, alto alinhamento estrutural.

**Acceptance Criteria**:

1. WHEN `buildReviewItemsGeneratorPrompt` com `existingItems` vazio THEN prompt SHALL conter `(none)` na seção de itens existentes
2. WHEN `buildReviewItemsGeneratorPrompt` com itens THEN SHALL serializar JSON na seção correta
3. WHEN `buildClosingFeedbackPrompt` para cada `level` (`entry`/`mid`/`senior`) THEN SHALL incluir instruções de nível e guardrails
4. WHEN `validate(schema)` com body válido THEN `next()` SHALL ser chamado e `req.body` parseado
5. WHEN `validate(schema)` com body inválido THEN resposta SHALL ser **422** com `message` e `errors`

**Independent Test**: `bun run test` — 3 novos arquivos `*.test.ts` passam; pre-commit continua sem Docker.

---

### P3: Integration — casos null/vazio (robustez)

**User Story**: Como desenvolvedor, quero casos de borda em repositórios para documentar comportamento de queries vazias.

**Why P3**: Melhora confiança; não bloqueia MVP.

**Acceptance Criteria**:

1. WHEN `getById` / `findById` com id inexistente THEN SHALL retornar `null` (repos já cobertos no happy path)
2. WHEN `listByUserId` / `listBySessionId` sem dados THEN SHALL retornar array vazio

**Independent Test**: Novos `it` nos arquivos integration existentes; suite integration verde.

---

## Inventário de Novos Testes (checklist)

### `auth.e2e.test.ts` (+6)

| ID | Título sugerido (`it`) |
|----|------------------------|
| COV-E-01 | `returns 422 when login payload is invalid` |
| COV-E-02 | `returns 401 when refresh token is invalid or expired` |
| COV-E-03 | `returns 422 when request-password-reset payload is invalid` |
| COV-E-04 | `returns 422 when reset-password payload is invalid` |
| COV-E-05 | `returns 401 when bearer token is malformed` |
| COV-E-06 | `returns 401 when bearer token is invalid or expired` |

### `interview.e2e.test.ts` (+12)

| ID | Título sugerido |
|----|-----------------|
| COV-E-07 | `returns 404 when resume does not exist or belongs to another user` |
| COV-E-08 | `returns 400 when resume is still processing` |
| COV-E-09 | `returns 400 when resume processing failed` |
| COV-E-10 | `returns 401 without authentication` (GET sessions) |
| COV-E-11 | `returns 401 without authentication` (GET messages) |
| COV-E-12 | `returns 404 when session does not exist` (messages) |
| COV-E-13 | `returns 401 without authentication` (POST stream) |
| COV-E-14 | `returns 404 when session does not exist or belongs to another user` (stream) |
| COV-E-15 | `returns 409 when interview session is finished` |
| COV-E-16 | `returns 422 when stream payload is invalid` |

### `resumes.e2e.test.ts` (+7)

| ID | Título sugerido |
|----|-----------------|
| COV-E-17 | `returns 400 when no PDF file is attached` |
| COV-E-18 | `returns 400 when file is not a PDF` |
| COV-E-19 | `returns 400 when PDF exceeds maximum allowed size` |
| COV-E-20 | `returns 502 when object storage upload fails` |
| COV-E-21 | `returns 503 when resume queue is unavailable` |
| COV-E-22 | `returns 401 without authentication` (GET :id) |

### `review-items.e2e.test.ts` (+2)

| ID | Título sugerido |
|----|-----------------|
| COV-E-23 | `returns 200 with empty reviewItems when user has none` |
| COV-E-24 | `does not return review items belonging to another user` |

### Unit (+3 arquivos)

| ID | Arquivo |
|----|---------|
| COV-U-01 | `validation-middleware.test.ts` |
| COV-U-02 | `review-items-generator-prompt.test.ts` |
| COV-U-03 | `closing-feedback-prompt.test.ts` |

### Integration (+~8 casos em 2 arquivos)

| ID | Arquivo / método |
|----|------------------|
| COV-I-01 | `session-repository.integration.test.ts` → `incrementTurnCount` |
| COV-I-02 | `session-repository.integration.test.ts` → `markFinished` |
| COV-I-03 | `review-repository.integration.test.ts` → `findByUserIdAndTopicCaseInsensitive` |
| COV-I-04 | `review-repository.integration.test.ts` → `findSimilarByUserIdAndTopic` |
| COV-I-05+ | Casos null/vazio (P3) nos repos existentes |

**Total estimado:** ~27 E2E novos + 3 unit files + 4–8 integration cases.

---

## Edge Cases

- WHEN E2E mocka `interview-graph-factory` THEN stream 409 SHALL ser testado **sem** depender de tokens OpenAI reais
- WHEN E2E testa upload grande THEN usar buffer sintético > `RESUME_MAX_BYTES` (não arquivo em disco)
- WHEN integration testa `findSimilarByUserIdAndTopic` THEN usar tópicos com similaridade conhecida (ex.: `system design` vs `system designs`) e documentar threshold do repositório no teste
- WHEN sessão é marcada finished para teste 409 THEN usar `prisma.interviewSession.update` ou `SessionRepository.markFinished` no seed
- WHEN resume `processing` é necessário THEN usar `ResumeRepository.createProcessing` sem `updateReady`
- WHEN múltiplos E2E rodam THEN `truncateTables` em `beforeEach` SHALL manter isolamento (padrão existente)

---

## Requirement Traceability

| Requirement ID | Story | Layer | Status |
|----------------|-------|-------|--------|
| COV-E-01 | P2 Auth 422 | E2E | Verified |
| COV-E-02 | P2 Auth refresh inválido | E2E | Verified |
| COV-E-03 | P2 Auth request-reset 422 | E2E | Verified |
| COV-E-04 | P2 Auth reset-password 422 | E2E | Verified |
| COV-E-05 | P1 Bearer malformado | E2E | Verified |
| COV-E-06 | P1 Bearer inválido/expirado | E2E | Verified |
| COV-E-07 | P1 Interview resume 404 | E2E | Verified |
| COV-E-08 | P1 Interview resume processing | E2E | Verified |
| COV-E-09 | P1 Interview resume failed | E2E | Verified |
| COV-E-10 | P1 Interview GET sessions 401 | E2E | Verified |
| COV-E-11 | P1 Interview GET messages 401 | E2E | Verified |
| COV-E-12 | P2 Interview messages 404 | E2E | Verified |
| COV-E-13 | P1 Interview stream 401 | E2E | Verified |
| COV-E-14 | P2 Interview stream 404 | E2E | Verified |
| COV-E-15 | P1 Interview stream 409 | E2E | Verified |
| COV-E-16 | P2 Interview stream 422 | E2E | Verified |
| COV-E-17 | P1 Resumes sem arquivo | E2E | Verified |
| COV-E-18 | P1 Resumes não-PDF | E2E | Verified |
| COV-E-19 | P1 Resumes tamanho | E2E | Verified |
| COV-E-20 | P2 Resumes 502 storage | E2E | Verified |
| COV-E-21 | P2 Resumes 503 queue | E2E | Verified |
| COV-E-22 | P1 Resumes GET 401 | E2E | Verified |
| COV-E-23 | P2 Review-items vazio | E2E | Verified |
| COV-E-24 | P2 Review-items isolamento | E2E | Verified |
| COV-U-01 | P2 validation-middleware | Unit | Verified |
| COV-U-02 | P2 review-items prompt | Unit | Verified |
| COV-U-03 | P2 closing-feedback prompt | Unit | Verified |
| COV-I-01 | P2 session incrementTurnCount | Integration | Verified |
| COV-I-02 | P2 session markFinished | Integration | Verified |
| COV-I-03 | P2 review case-insensitive | Integration | Verified |
| COV-I-04 | P2 review similarity | Integration | Verified |
| COV-I-05 | P3 repos null/vazio | Integration | Verified |

**Coverage:** 32 requirements, 32 verified, 0 pending.

---

## Success Criteria

- [x] `bun run test` passa com **+3** arquivos unit (total unit ≥23 arquivos `*.test.ts` excl. integration/e2e)
- [x] `bun run test:integration` passa com novos casos em session + review repos
- [x] `bun run test:e2e` passa com **≥54** testes E2E no total (30 atuais + ~24 novos)
- [x] Nenhum `vi.mock("@/infrastructure/database")` adicionado em unit
- [x] Documentação `docs/TESTING.md` atualizada com seção “Cenários cobertos por módulo” (opcional, task final)

---

## Open Questions (defaults for Execute)

| Questão | Decisão padrão (Execute sem bloquear) |
|---------|--------------------------------------|
| Onde testar bearer inválido? | `auth.e2e.test.ts` contra `/api/protected-smoke` + um caso em interview |
| Seed resume processing/failed | Helper em `src/test/helpers/interview-seed-helpers.ts` |
| Stream 409 com turnCount >= maxTurns? | Escopo P3 deferido — apenas `isFinished: true` no MVP |
