# Backend Sustainability Hardening — Specification

## Problem Statement

O backend já segue boas práticas de modularidade, testes e DI nas bordas, mas a auditoria de sustentabilidade identificou **lacunas de processo e inconsistências localizadas** que aumentam risco à medida que o time ou o escopo cresce: ausência de CI no repositório, boilerplate repetido nos controllers, injeção oculta de dependências no adapter de review items, vazamento de tipos Prisma para services, e logging duplicado em erros 5xx.

Esta feature **não reescreve a arquitetura** — corrige os pontos de maior custo/benefício identificados na revisão, de forma pragmática (sem DDD completo, sem interfaces em todo repository).

## Goals

- [x] Pipeline CI no GitHub validando `lint`, `check-types` e testes unitários em todo PR.
- [x] Tratamento de erros async nos controllers centralizado (sem `try/catch` repetido).
- [x] `ReviewItemsGeneratorAdapter` recebe `ReviewRepository` via factory (sem `new` default).
- [x] Decisão explícita e implementação do bounded context de review items.
- [x] Services de resumes/sessions desacoplados de tipos gerados do Prisma (DTOs na borda do repository).
- [x] Logging de erro 5xx unificado no `errorHandler`.
- [x] Documentação de testes/CI atualizada; gates opcionais para integration/e2e e cobertura.

## Out of Scope

| Item | Motivo |
|------|--------|
| Refatoração completa de `InterviewStreamService.streamTurn` | Aceitável enquanto estável; fatiar só quando nova feature no stream exigir |
| Camada `domain/`, use cases genéricos, ADR suite | Retorno marginal para o porte atual |
| `IRepository` / interface em todo repositório | YAGNI — sem segundo implementador |
| Extrair `PRIORITY_RANK` / `RANK` compartilhado | Apenas 2 ocorrências — regra do três não aplicada |
| Pino, Datadog, request-id distribuído | Observabilidade avançada — fase posterior |
| Unificar auth/validação no `errorHandler` (401/422 inline) | Mudança de contrato HTTP; baixa prioridade |
| Teste de cada factory individualmente | Cobertura indireta via services/e2e |

---

## Relationship to Existing Features

| Feature / doc | Relevância |
|---------------|------------|
| [review-items-list-api](../review-items-list-api/spec.md) | Módulo `review-items` é fachada HTTP; decisão de bounded context impacta esta API |
| [ai-mock-interview](../ai-mock-interview/spec.md) | `ReviewRepository`, merge e generator no fluxo de entrevista |
| `docs/TESTING.md` | Atualizar com gates de CI e `test:coverage` |
| `.husky/pre-commit` | Hoje roda `lint` + `test` (unit); CI deve espelhar o mínimo |

**Brownfield (pontos de partida):**

- Controllers com `try/catch/next`: `auth-controller.ts`, `interview-controller.ts`, `resumes-controller.ts`, `review-items-controller.ts` (~13 handlers).
- `ReviewItemsGeneratorAdapter` — default `new ReviewRepository()` em `review-items-generator-adapter.ts`.
- Factory: `stream-service-factory.ts` instancia `new ReviewItemsGeneratorAdapter()` sem injetar repo.
- Prisma nos services: `resume-service.ts`, `session-service.ts`, `review-items-service.ts` importam tipos de `prisma/generated/client`.
- `error-handler-middleware.ts` — `logger.error` + `console.error` em 5xx.
- Scripts: `package.json` tem `test:all`, `check-types`, `lint`; **sem** `.github/workflows`.
- `@vitest/coverage-v8` instalado; **sem** script `test:coverage`.

---

## Decisions (required before Execute)

### SUS-DEC-01 — Bounded context de review items

| Opção | Comportamento | Prós | Contras |
|-------|---------------|------|---------|
| **A** | Manter módulo `review-items` + rota `GET /api/review-items`; extrair tipos/DTO compartilhados mínimos em `modules/interview` (repo permanece lá) | Sem breaking change de URL; API já documentada | Dois módulos ainda acoplados |
| **B** | Mover listagem para `interview` (`GET /api/interview/review-items`) e remover módulo `review-items` | Um bounded context | Breaking change para frontend; atualizar OpenAPI e docs |
| **C** | Novo pacote `modules/reviews/` com `ReviewRepository` + DTOs; `interview` e `review-items` consomem | Separação clara | Mais arquivos/moves; maior PR |

**Recomendação:** **Opção A** — menor risco; alinha com spec REV já verificada. Opção C só se o time planejar mais endpoints de review.

### SUS-DEC-02 — Local do `asyncHandler`

| Opção | Onde |
|-------|------|
| **A** | `shared/utils/async-handler.ts` (ou `shared/middlewares/`) |
| **B** | Wrapper no registro de rotas em `config/routes.ts` |

**Recomendação:** **Opção A** — reutilizável e testável; rotas continuam explícitas.

### SUS-DEC-03 — CI: integration/e2e no mesmo workflow?

| Opção | Comportamento |
|-------|---------------|
| **A** | Job `quality` (lint + types + unit) em todo PR; job `integration-e2e` só em `main` ou `workflow_dispatch` |
| **B** | Mesmo workflow com matrix; integration/e2e em todo PR (Docker no runner) |

**Recomendação:** **Opção A** — espelha Husky (unit sem Docker); e2e não bloqueia todo PR local sem Docker.

---

## User Stories

### P1: CI mínimo no GitHub — MVP ⭐

**User Story**: Como mantenedor, quero que todo PR execute lint, typecheck e testes unitários automaticamente para que regressões não cheguem ao remoto sem o Husky local.

**Why P1**: Maior lacuna entre “projeto bom” e “projeto sustentável em time”.

**Acceptance Criteria**:

1. WHEN um PR ou push para branches principais ocorre THEN o workflow SHALL executar `bun install`, `bun run lint`, `bun run check-types` e `bun run test` no diretório `Backend/`.
2. WHEN qualquer etapa falha THEN o workflow SHALL falhar e bloquear merge (se branch protection configurada).
3. WHEN o workflow roda THEN ele SHALL usar `actions/checkout` e setup de Bun (ou Node + bun) compatível com o projeto.
4. WHEN documentação de testes é atualizada THEN `docs/TESTING.md` SHALL descrever o gate de CI e diferença vs pre-commit.

**Independent Test**: Abrir PR com teste quebrado → CI vermelho; corrigir → verde.

---

### P1: `asyncHandler` nos controllers — MVP ⭐

**User Story**: Como desenvolvedor, quero um wrapper único para handlers async para não repetir `try/catch/next` e evitar esquecer tratamento de erro.

**Why P1**: Rule of three ultrapassada (~13 handlers); mudança pequena, alto ganho.

**Acceptance Criteria**:

1. WHEN um handler async é registrado nas rotas THEN ele SHALL ser envolvido por `asyncHandler` (ou equivalente) que encaminha erros para `next(error)`.
2. WHEN um controller lança `HttpError` ou erro não tratado THEN o `errorHandler` existente SHALL responder como hoje (sem mudança de contrato JSON).
3. WHEN todos os controllers são migrados THEN eles SHALL NOT conter blocos `try/catch` apenas para `next(error)`.
4. WHEN `asyncHandler` é adicionado THEN SHALL existir teste unitário cobrindo repasse de erro ao `next`.

**Independent Test**: E2E existentes (auth, resumes, interview, review-items) passam sem alteração de comportamento.

---

### P1: Injeção de `ReviewRepository` no adapter — MVP ⭐

**User Story**: Como mantenedor, quero que o adapter de geração de review items receba o repositório pela factory para alinhar com o composition root e facilitar testes.

**Why P1**: Inconsistência de DIP hoje; factory já existe em `stream-service-factory.ts`.

**Acceptance Criteria**:

1. WHEN `ReviewItemsGeneratorAdapter` é construído THEN `reviewRepository` SHALL ser obrigatório no construtor (sem default `new ReviewRepository()`).
2. WHEN `makeInterviewStreamService()` roda THEN SHALL passar uma instância de `ReviewRepository` ao adapter (mesma instância usada por `makeReviewMergeService()` quando aplicável).
3. WHEN testes do adapter existem ou são adicionados THEN SHALL usar mock/stub de repositório injetado.
4. WHEN o fluxo de entrevista finaliza THEN geração de review items SHALL comportar-se como antes (sem regressão funcional).

**Independent Test**: `bun run test` + e2e de interview passam; adapter testável com repo mock.

---

### P2: DTOs nos services (desacoplamento Prisma) — should have

**User Story**: Como mantenedor, quero que services de domínio não importem tipos do client Prisma para que mudanças de schema fiquem isoladas nos repositórios.

**Why P2**: Melhor custo/benefício “hexagonal light”; incremental.

**Acceptance Criteria**:

1. WHEN `ResumeService` retorna dados ao controller THEN tipos públicos SHALL ser DTOs definidos em `modules/resumes/` (ex.: `ResumePreview`, `ResumeDetail`) e NOT `Resume` do Prisma.
2. WHEN `SessionService` e `ReviewItemsService` expõem entidades THEN SHALL usar DTOs/tipos do módulo, mapeados no repository ou em funções `toXxx()`.
3. WHEN `ResumeRepository` (e demais) retornam dados THEN mapeamento Prisma → DTO SHALL ocorrer no repository ou em mapper dedicado no módulo.
4. WHEN testes de service são atualizados THEN SHALL usar DTOs/fixtures sem importar `prisma/generated/client` (exceto testes de integração de repository).

**Independent Test**: `grep` em `*service.ts` não encontra import de `prisma/generated/client`; testes unitários de services passam.

**Escopo incremental (ordem sugerida):** `ReviewItemsService` → `SessionService` → `ResumeService`.

---

### P2: Bounded context review (SUS-DEC-01) — should have

**User Story**: Como desenvolvedor, quero uma decisão documentada e código alinhado sobre onde vive a regra de review items para saber onde alterar no futuro.

**Acceptance Criteria**:

1. WHEN SUS-DEC-01 é aplicada THEN a estrutura de pastas SHALL refletir a opção escolhida (sem módulo órfão só de rota).
2. WHEN opção A é escolhida THEN `review-items` SHALL importar apenas APIs estáveis de `interview` (repository + schemas compartilhados documentados em comentário ou `README` do módulo).
3. WHEN opção B ou C é escolhida THEN OpenAPI, `docs/frontend-mock-interview-api.md` e e2e SHALL ser atualizados.
4. WHEN a decisão é tomada THEN SHALL constar em seção **Decisions (resolved)** desta spec.

**Independent Test**: `GET /api/review-items` (ou novo path) responde como antes para o frontend.

---

### P2: Logging 5xx unificado — should have

**User Story**: Como operador, quero um único canal de log para erros 5xx para facilitar filtragem.

**Acceptance Criteria**:

1. WHEN `errorHandler` trata status >= 500 THEN SHALL registrar via `logger.error` apenas (sem `console.error` duplicado).
2. WHEN `NODE_ENV` é desenvolvimento THEN MAY manter saída extra no logger se já suportado — não duplicar manualmente no middleware.
3. WHEN erro 4xx (`HttpError`) ocorre THEN SHALL NOT logar como erro de servidor (comportamento atual preservado).

**Independent Test**: Teste unitário do middleware ou manual: erro 500 gera uma linha estruturada no logger.

---

### P3: Cobertura e worker — nice to have

**User Story**: Como mantenedor, quero script de cobertura e smoke do worker para fechar buracos da pirâmide de testes.

**Acceptance Criteria**:

1. WHEN `bun run test:coverage` é executado THEN Vitest SHALL gerar relatório com `@vitest/coverage-v8`.
2. WHEN `package.json` é atualizado THEN script `test:coverage` SHALL estar documentado em `docs/TESTING.md`.
3. WHEN worker é testado THEN SHALL existir teste unitário com fila/processo mockados validando handler principal e tratamento de falha (sem Redis real).

**Independent Test**: `bun run test:coverage` completa; teste do worker passa em CI unit.

---

### P3: Job CI integration/e2e (SUS-DEC-03) — nice to have

**User Story**: Como mantenedor, quero rodar testes com Docker no CI em branch principal para validar integração antes de release.

**Acceptance Criteria**:

1. WHEN workflow `integration-e2e` dispara (push `main` ou manual) THEN SHALL executar `bun run test:integration` e `bun run test:e2e` com Docker disponível no runner.
2. WHEN Docker não está disponível no job THEN workflow SHALL falhar com mensagem clara (não passar silenciosamente).

**Independent Test**: Workflow manual ou push em `main` com suites verdes.

---

## Edge Cases

- WHEN CI roda em PR de fork THEN secrets e permissões SHALL seguir política do GitHub (sem expor env secrets).
- WHEN `asyncHandler` recebe função síncrona que lança THEN SHALL encaminhar ao `next` (comportamento Express padrão).
- WHEN migração de DTO quebra teste que usava modelo Prisma THEN ajustar fixture, não reintroduzir import Prisma no service.
- WHEN `ReviewRepository` é compartilhado entre merge service e adapter THEN transações Prisma existentes SHALL continuar válidas (mesma instância por request/factory scope).
- WHEN frontend ainda chama `GET /api/review-items` (opção A) THEN nenhuma mudança de contrato na resposta.

---

## Implementation Notes (for Design / Execute)

**Escopo TLC:** Large — após aprovação desta spec, criar `design.md` (SUS-DEC-01/03, factory compartilhada de interview) e `tasks.md` com commits atômicos.

**Ordem de execução sugerida (commits atômicos):**

1. `asyncHandler` + migração controllers + teste
2. Injeção `ReviewRepository` no adapter + factory
3. Workflow CI (unit) + doc TESTING
4. Unificar logging 5xx
5. DTOs: review-items → session → resume (um PR ou commits separados por módulo)
6. SUS-DEC-01 implementação + docs
7. (P3) `test:coverage`, worker test, job integration/e2e

**Arquivos principais:**

| Área | Arquivos |
|------|----------|
| CI | `.github/workflows/backend-ci.yml` (monorepo root ou `Backend/`) |
| asyncHandler | `src/shared/utils/async-handler.ts`, `*-routes.ts`, `*-controller.ts` |
| Adapter | `review-items-generator-adapter.ts`, `stream-service-factory.ts`, `review-merge-service-factory.ts` |
| DTOs | `resume-repository.ts`, `resume-service.ts`, `session-service.ts`, `review-items-service.ts` |
| Logging | `error-handler-middleware.ts` |
| Worker | `src/worker.ts`, novo `worker.test.ts` |

**Não alterar comportamento HTTP** exceto se SUS-DEC-01 opção B/C for escolhida.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| SUS-01 | P1: CI lint/types/unit | Execute | Verified |
| SUS-02 | P1: CI documentado em TESTING.md | Execute | Verified |
| SUS-03 | P1: asyncHandler implementado | Execute | Verified |
| SUS-04 | P1: Controllers sem try/catch boilerplate | Execute | Verified |
| SUS-05 | P1: Teste asyncHandler | Execute | Verified |
| SUS-06 | P1: Adapter sem default repository | Execute | Verified |
| SUS-07 | P1: Factory injeta ReviewRepository | Execute | Verified |
| SUS-08 | P1: Sem regressão interview e2e | Execute | Verified |
| SUS-09 | P2: DTOs ResumeService | Execute | Verified |
| SUS-10 | P2: DTOs SessionService | Execute | Verified |
| SUS-11 | P2: DTOs ReviewItemsService | Execute | Verified |
| SUS-12 | P2: SUS-DEC-01 implementada | Design → Execute | Verified |
| SUS-13 | P2: Logging 5xx unificado | Execute | Verified |
| SUS-14 | P3: Script test:coverage | Execute | Verified |
| SUS-15 | P3: Teste worker | Execute | Verified |
| SUS-16 | P3: Job CI integration/e2e | Execute | Verified |

**Coverage:** 16 total, 16 mapped to tasks, 0 unmapped — see [tasks.md](./tasks.md)

---

## Success Criteria

- [x] PR no GitHub mostra CI verde com lint + types + unit sem depender só do Husky local.
- [x] Nenhum controller com `try/catch` apenas para `next(error)`.
- [x] `ReviewItemsGeneratorAdapter` testável com repositório mockado.
- [x] Services listados não importam `prisma/generated/client`.
- [x] `GET /api/review-items` e fluxo de entrevista permanecem funcionais (e2e verdes).
- [x] Decisão SUS-DEC-01 registrada como resolvida nesta spec.
- [x] `bun run test:all` passa localmente antes de merge em `main` (com Docker).

---

## Decisions (resolved)

| ID | Decisão | Opção escolhida | Data |
|----|---------|-----------------|------|
| SUS-DEC-01 | Bounded context review | **A** — manter `/api/review-items` + doc em `interview/README.md` | 2026-05-30 |
| SUS-DEC-02 | Local asyncHandler | **A** — `src/shared/utils/async-handler.ts` | 2026-05-30 |
| SUS-DEC-03 | CI integration/e2e | **A** — job separado em `main` + manual | 2026-05-30 |

Detalhes de implementação: [design.md](./design.md).

---

**Próximos passos:**

1. ~~**Execute** tarefas em [tasks.md](./tasks.md) (T1 → … → T21).~~ Concluído em 2026-05-30.
2. Abrir PR e confirmar workflows no GitHub após push.
