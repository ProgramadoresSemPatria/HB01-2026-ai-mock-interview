# AI Rate Limit by User — Specification

## Problem Statement

O `aiRateLimiter` atual (`src/shared/middlewares/rate-limit-middleware.ts`) limita `/api/interview/*` e `/api/resumes/*` **por endereço IP** (comportamento padrão do `express-rate-limit`), embora todas essas rotas exijam autenticação (`checkAuth` roda antes e popula `req.userId`). Isso gera dois problemas: (1) usuários atrás do mesmo IP (rede corporativa, NAT, proxy) compartilham a mesma cota — um usuário abusivo penaliza os demais; (2) o contador vive em memória do processo Node, então em múltiplas instâncias da API cada instância mantém sua própria contagem, permitindo multiplicar a cota real disponível. Além disso, o limite é aplicado hoje a **todas** as rotas do módulo (incluindo `GET` de listagem), sem distinguir chamadas que efetivamente disparam custo de IA.

Esta feature substitui a chave de limite de IP para **`userId`** (chave estável, já disponível via JWT), restringe a aplicação do limiter às rotas que realmente invocam a OpenAI, e move o contador para um **store compartilhado no Redis** (já usado pelo BullMQ), tornando o limite correto em deployments com múltiplas instâncias.

## Goals

- [ ] `aiRateLimiter` usa `req.userId` como chave de contagem, não `req.ip`.
- [ ] Requisição autenticada sem `userId` populado (estado inesperado) falha de forma explícita, sem aplicar fallback silencioso por IP.
- [ ] Limiter aplicado apenas às rotas que disparam chamada à OpenAI (criação de sessão, turno de entrevista/stream, upload de currículo), liberando rotas de leitura (`GET`) do mesmo limite.
- [ ] Contagem usa um store compartilhado no Redis (`rate-limit-redis` + `ioredis`), consistente entre múltiplas instâncias da API.
- [ ] Testes unitários e E2E atualizados para validar contagem por usuário (não por IP) e o novo escopo de rotas.

## Out of Scope

| Item | Motivo |
|------|--------|
| Rate limit de `/api/auth/*` por usuário | Rotas públicas/pré-login; `authRateLimiter` continua por IP |
| Rate limit no worker (`src/worker.ts`) | Processamento assíncrono de currículo não é uma requisição HTTP; fora do escopo de `express-rate-limit` |
| Budget de tokens / custo por usuário (contagem de tokens OpenAI) | Rate limit é por nº de requisições, não por custo; feature futura se necessário |
| Rate limit distribuído por cluster de Redis (sharding) | Single Redis instance já usado pelo BullMQ é suficiente para o porte atual |
| UI/endpoint para o usuário consultar sua cota restante | Os headers `RateLimit-*` já expõem isso ao cliente; sem endpoint dedicado |

---

## Relationship to Existing Features

| Feature / doc | Relevância |
|---------------|------------|
| [ai-best-practices-hardening](../ai-best-practices-hardening/spec.md) / [design.md](../ai-best-practices-hardening/design.md) | Introduziu o `aiRateLimiter` original (por IP, `RATE_LIMIT_AI_*`); esta feature substitui a estratégia de chave e o store, mantendo as mesmas env vars de janela/máximo |
| `docs/TESTING.md` | Deve documentar o novo comportamento de teste (limiter por `userId`, Redis real via Testcontainers nos E2E) |

**Brownfield (pontos de partida):**

- `src/shared/middlewares/rate-limit-middleware.ts` — `aiRateLimiter` com `MemoryStore` implícito, sem `keyGenerator` (usa IP padrão).
- `src/modules/interview/routes/interview-routes.ts` — `router.use(aiRateLimiter)` aplicado a todas as rotas do módulo.
- `src/modules/resumes/routes/resumes-routes.ts` — mesmo padrão (`router.use(aiRateLimiter)`).
- `src/infrastructure/queue/resume-queue.ts` — `redisConnection` (instância `ioredis`) já existente e reutilizável para o novo store.
- `src/modules/auth/middlewares/check-auth-middleware.ts` — popula `req.userId` antes de qualquer rota autenticada rodar; já garante que o limiter roda depois da autenticação.
- Testes existentes: `rate-limit-middleware.test.ts`, `interview.e2e.test.ts` (`describe("AI rate limiting")`), `resumes.e2e.test.ts` (`describe("AI rate limiting")`) — todos assumem contagem por IP via `supertest`.

---

## Decisions (resolved)

### AIRL-DEC-01 — Comportamento quando `userId` está ausente

| Opção | Comportamento |
|-------|---------------|
| **A** (escolhida) | `keyGenerator` lança erro explícito (500, tratado pelo `errorHandler` existente) se `req.userId` não estiver definido quando o limiter roda |
| B | Fallback silencioso para `req.ip` |
| C | Chave fixa compartilhada `"anonymous"` |

**Decisão:** **Opção A** — nas rotas onde `aiRateLimiter` é aplicado, `checkAuth` já garante `req.userId` (rota pública não usa este limiter). Um `userId` ausente é sinal de bug de configuração (limiter aplicado antes do `checkAuth`, ou em rota pública por engano) e deve falhar ruidosamente em vez de mascarar o problema com fallback por IP.

### AIRL-DEC-02 — Granularidade das rotas com limite

| Opção | Comportamento |
|-------|---------------|
| A | Manter `router.use(aiRateLimiter)` no nível do router (todas as rotas do módulo) |
| **B** (escolhida) | Aplicar `aiRateLimiter` apenas às rotas que efetivamente chamam a OpenAI |

**Decisão:** **Opção B**. Rotas cobertas:

- `interview-routes.ts`: `POST /sessions` (cria sessão + LangGraph state), `POST /sessions/:sessionId/stream` (turno de entrevista via LLM)
- `resumes-routes.ts`: `POST /` (upload dispara extração assíncrona via LLM)

Rotas **fora** do limite de IA (mas ainda atrás de `checkAuth`): `GET /sessions`, `GET /sessions/:sessionId/messages`, `DELETE /sessions/:sessionId`, `GET /` (list resumes), `GET /:id`, `DELETE /:id`.

**Nota sobre `POST /sessions/:sessionId/feedback`:** não chama a OpenAI (apenas persiste feedback humano) — **não** deve receber `aiRateLimiter` nesta feature, mesmo que a task original do `ai-best-practices-hardening` a tenha incluído por padrão de "rota IA-adjacente". Revisar/remover essa aplicação como parte da migração.

### AIRL-DEC-03 — Store do rate limiter

| Opção | Comportamento |
|-------|---------------|
| A | Manter `MemoryStore` padrão (por processo) |
| **B** (escolhida) | `RedisStore` (`rate-limit-redis`) usando a conexão `ioredis` já existente (`redisConnection` de `resume-queue.ts`) |

**Decisão:** **Opção B** — o projeto já roda Redis (BullMQ) em todos os ambientes, então o custo de infraestrutura é zero. Isso corrige a contagem incorreta em múltiplas instâncias da API e é consistente com o objetivo de "budget de uso por usuário" (deve valer para o usuário como um todo, não por instância/processo que o atendeu).

**Detalhes técnicos (a confirmar em Design):**
- Pacote `rate-limit-redis` (store oficial recomendado pelos mantenedores do `express-rate-limit`), usando `sendCommand: (...args) => redisConnection.call(...args)`.
- Prefixo de chave dedicado (ex.: `rl:ai:`) para não colidir com chaves do BullMQ na mesma instância Redis.
- Reaproveitar a mesma instância `redisConnection` já exportada por `resume-queue.ts` (evitar segunda conexão Redis).

---

## User Stories

### P1: Rate limit por usuário nas rotas de IA — MVP ⭐

**User Story**: Como operador da plataforma, quero que o limite de uso de IA seja contado por usuário autenticado (não por IP), para que o budget reflita o uso real de cada conta e não seja compartilhado indevidamente entre usuários do mesmo IP.

**Why P1**: Correção do comportamento incorreto identificado — é o núcleo da feature.

**Acceptance Criteria**:

1. WHEN uma requisição autenticada chega em uma rota protegida pelo `aiRateLimiter` THEN a contagem SHALL usar `req.userId` como chave (não `req.ip`).
2. WHEN dois usuários diferentes fazem requisições do mesmo IP THEN cada um SHALL ter sua própria cota, independente do outro.
3. WHEN o mesmo usuário faz requisições de IPs diferentes (ex.: celular e notebook) THEN a cota SHALL ser compartilhada (mesma chave `userId`).
4. WHEN `req.userId` está ausente no momento em que o `aiRateLimiter` roda THEN a requisição SHALL falhar explicitamente (erro tratado pelo `errorHandler`, sem aplicar fallback por IP) — ver AIRL-DEC-01.
5. WHEN o limite é excedido THEN a resposta SHALL continuar sendo `429` com o mesmo corpo já usado hoje (`{ message: "Too many requests, please try again later." }`).

**Independent Test**: Dois usuários autenticados diferentes, mesma origem de rede (mesmo IP no teste), cada um consegue fazer até `RATE_LIMIT_AI_MAX` requisições antes de receber `429` — sem interferência entre eles.

---

### P1: Restringir limite às rotas que chamam IA — MVP ⭐

**User Story**: Como usuário da plataforma, quero poder listar minhas sessões e currículos livremente, sem consumir a mesma cota reservada para ações que geram custo de IA.

**Why P1**: Sem isso, o P1 acima ainda penaliza navegação comum (listagens) com o mesmo budget caro.

**Acceptance Criteria**:

1. WHEN uma requisição chega em `POST /api/interview/sessions` ou `POST /api/interview/sessions/:sessionId/stream` THEN ela SHALL passar pelo `aiRateLimiter` (chave por `userId`).
2. WHEN uma requisição chega em `POST /api/resumes` (upload) THEN ela SHALL passar pelo `aiRateLimiter`.
3. WHEN uma requisição chega em rotas de leitura (`GET /api/interview/sessions`, `GET .../messages`, `GET /api/resumes`, `GET /api/resumes/:id`) ou de escrita não-IA (`DELETE`, `POST .../feedback`) THEN ela SHALL NOT passar pelo `aiRateLimiter`.
4. WHEN o `maxTurns` de uma sessão é atingido THEN o `ConflictError` de negócio SHALL continuar dependente apenas da regra de domínio, sem qualquer interferência do rate limiter (ambos podem disparar de forma independente, sem um mascarar o outro).

**Independent Test**: Exceder `RATE_LIMIT_AI_MAX` fazendo apenas `POST /sessions/:sessionId/stream` repetidamente; confirmar que chamadas simultâneas a `GET /sessions` continuam retornando `200` mesmo após o `429` nas rotas de IA.

---

### P2: Store compartilhado (Redis) para contagem — should have

**User Story**: Como operador, quero que o limite de uso seja respeitado mesmo com múltiplas instâncias da API rodando, para que o budget real por usuário não seja multiplicado pelo número de processos.

**Why P2**: Correção importante para produção com múltiplas réplicas, mas não bloqueia o valor do P1 (contagem por usuário já é uma melhoria mesmo em single-instance).

**Acceptance Criteria**:

1. WHEN o `aiRateLimiter` é instanciado THEN ele SHALL usar um `RedisStore` (pacote `rate-limit-redis`) conectado à mesma instância Redis já usada pelo BullMQ (`redisConnection`).
2. WHEN duas instâncias da API (processos diferentes) atendem requisições do mesmo usuário THEN a contagem SHALL ser somada corretamente entre elas (validável simulando duas instâncias do app apontando para o mesmo Redis).
3. WHEN a conexão com o Redis está indisponível THEN o comportamento SHALL ser explícito (erro logado, requisição falha de forma clara) — não SHALL falhar silenciosamente permitindo bypass do limite sem registro.
4. WHEN chaves do rate limiter são gravadas no Redis THEN SHALL usar um prefixo dedicado (ex.: `rl:ai:`) para não colidir com chaves do BullMQ.

**Independent Test**: Testes E2E rodam com Redis real (Testcontainers, já usado no projeto); teste dedicado sobe duas instâncias do `Express app` compartilhando o mesmo `redisConnection` e confirma que o limite é respeitado somado entre as duas.

---

## Edge Cases

- WHEN um usuário autenticado nunca fez nenhuma chamada de IA antes THEN a primeira requisição SHALL ser contabilizada normalmente (sem estado prévio no Redis para essa chave).
- WHEN a janela de tempo (`RATE_LIMIT_AI_WINDOW_MS`) expira THEN a contagem daquele usuário SHALL resetar (comportamento padrão do `express-rate-limit`, preservado com o novo store).
- WHEN o token JWT é válido mas corresponde a um usuário deletado do banco (`userId` sem registro) THEN o rate limiter SHALL continuar funcionando normalmente pela chave numérica (`userId` não depende de lookup no banco).
- WHEN dois testes E2E rodam em paralelo usando o mesmo Redis de teste THEN os prefixos/chaves SHALL ser isolados o suficiente para não causar flakiness (revisar necessidade de `flushdb` entre testes ou prefixo por execução).
- WHEN o pacote `rate-limit-redis` falha ao se conectar no boot (Redis indisponível) THEN o comportamento SHALL ser consistente com o já existente para BullMQ (a app não deve subir silenciosamente sem rate limit funcional).

---

## Implementation Notes (for Design / Execute)

**Escopo TLC:** **Large** — nova dependência (`rate-limit-redis`), mudança de arquitetura do middleware (keyGenerator + store), reorganização de granularidade de rotas, decisões já resolvidas (AIRL-DEC-01 a 03). Recomenda-se `design.md` cobrindo:

- Assinatura final do `aiRateLimiter` (ou dois limiters: `interviewAiRateLimiter` / `resumesAiRateLimiter`, a decidir em Design se precisam de configs diferentes).
- Estratégia de teste para Redis compartilhado em E2E (Testcontainers já usado — confirmar se a instância de Redis dos testes de fila pode ser reaproveitada).
- Tratamento de erro quando `keyGenerator` lança (AIRL-DEC-01) — confirmar que o `errorHandler` já cobre exceções síncronas lançadas dentro de um middleware de terceiros.

**Arquivos principais:**

| Área | Arquivos |
|------|----------|
| Middleware | `src/shared/middlewares/rate-limit-middleware.ts`, `rate-limit-middleware.test.ts` |
| Rotas | `src/modules/interview/routes/interview-routes.ts`, `src/modules/resumes/routes/resumes-routes.ts` |
| Redis | `src/infrastructure/queue/resume-queue.ts` (reuso de `redisConnection`) |
| Dependências | `package.json` (`rate-limit-redis`) |
| Testes E2E | `src/test/e2e/interview.e2e.test.ts`, `src/test/e2e/resumes.e2e.test.ts` (`describe("AI rate limiting")`) |
| Docs | `docs/TESTING.md` (nota sobre Redis real em E2E de rate limit) |

**Não alterar:** env vars `RATE_LIMIT_AI_WINDOW_MS` / `RATE_LIMIT_AI_MAX` (mantidas), contrato de resposta `429` (mensagem e headers padrão).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| AIRL-01 | P1: Contagem por `userId` | Design | Pending |
| AIRL-02 | P1: Cota independente entre usuários no mesmo IP | Design | Pending |
| AIRL-03 | P1: Cota compartilhada entre IPs do mesmo usuário | Design | Pending |
| AIRL-04 | P1: Falha explícita quando `userId` ausente (AIRL-DEC-01) | Design | Pending |
| AIRL-05 | P1: Contrato de resposta 429 preservado | Design | Pending |
| AIRL-06 | P1: Limiter aplicado só a rotas que chamam IA (AIRL-DEC-02) | Design | Pending |
| AIRL-07 | P1: Rotas de leitura/feedback fora do limite de IA | Design | Pending |
| AIRL-08 | P1: `maxTurns` (ConflictError) independente do rate limiter | Design | Pending |
| AIRL-09 | P2: Store Redis compartilhado (AIRL-DEC-03) | Design | Pending |
| AIRL-10 | P2: Contagem correta entre múltiplas instâncias da API | Design | Pending |
| AIRL-11 | P2: Falha explícita se Redis indisponível | Design | Pending |
| AIRL-12 | P2: Prefixo de chave dedicado no Redis | Design | Pending |

**Coverage:** 12 total, 0 mapped to tasks, 12 unmapped ⚠️ (aguardando `design.md` / `tasks.md`)

---

## Success Criteria

- [ ] Dois usuários autenticados no mesmo IP têm cotas independentes no `aiRateLimiter`.
- [ ] `GET`s de listagem (sessões, mensagens, currículos) não são afetados pelo limite de IA.
- [ ] Contagem correta mesmo com múltiplas instâncias da API rodando (validado com Redis compartilhado).
- [ ] `bun run test:all` passa com os testes existentes atualizados + novos cenários (contagem por usuário, Redis compartilhado).
- [ ] Nenhuma mudança no contrato de resposta `429` observável pelo cliente.

---

**Próximos passos:**

1. Revisar e aprovar esta spec (decisões AIRL-DEC-01 a 03 já resolvidas nesta conversa).
2. Rodar fase **Design** (`design.md`) — arquitetura do `keyGenerator`, do `RedisStore` compartilhado e estratégia de teste com Testcontainers.
3. Rodar fase **Tasks** (`tasks.md`) — quebra em tarefas atômicas com dependências e commits.
4. **Execute**.
