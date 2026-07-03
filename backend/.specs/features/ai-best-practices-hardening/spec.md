# AI Best Practices Hardening — Specification

## Problem Statement

Uma auditoria do backend (LangGraph + LangChain JS + OpenAI) contra um checklist de boas práticas para agentes de IA em produção encontrou lacunas em quatro frentes: **resiliência das chamadas LLM** (sem retry), **qualidade de prompt engineering** (sem LCEL, sem `ChatPromptTemplate`, sem parâmetros de geração por caso de uso), **segurança/deploy** (sem container da app, rate limiting incompleto) e **avaliação de qualidade** (sem métricas de negócio para eval, sem tom/conciseness medidos, sem feedback humano). Esta feature fecha as lacunas **aplicáveis e priorizadas pelo time**, deixando de fora itens de observabilidade avançada, LangSmith (já coberto por [langsmith-tracing](../langsmith-tracing/spec.md)), fallback multi-provider, validação de saída do LLM e segurança de nível "pré-lançamento" (OWASP, red-team, K8s) que serão tratados em fases posteriores.

## Goals

- [ ] Chamadas LLM críticas (`interviewer-node`, `review-items-generator-node`, extração de currículo) resilientes a falhas transitórias do provider (retry com backoff, mesmo provider/modelo).
- [ ] Prompts migrados para padrões idiomáticos do LangChain (`ChatPromptTemplate`, `MessagesPlaceholder`, LCEL) onde isso reduz acoplamento sem reescrever a arquitetura do grafo.
- [ ] Parâmetros de geração (`temperature`, `top_p`) definidos explicitamente por caso de uso (entrevista conversacional vs. extração/geração estruturada).
- [ ] Aplicação containerizada e com health checks reais (liveness + readiness com checagem de dependências), pronta para deploy em qualquer orquestrador.
- [ ] Rate limiting e budget de uso aplicados a todas as rotas de IA (entrevista/SSE, upload de currículo), não só auth.
- [ ] Base mínima de avaliação de qualidade (métricas de negócio, tom/conciseness, alinhamento, robustez a edge cases) e canal de feedback humano (thumbs up/down).

## Out of Scope

| Item | Motivo |
| ---- | ------ |
| Few-shot estático vs. dynamic | Não priorizado pelo time nesta rodada |
| Estratégia de context management (trim/summarize) | Não priorizado — `maxTurns` por nível já limita o histórico |
| Definição de histórico curto (modelo) vs. completo (analytics) | Não priorizado nesta rodada |
| Dataset diverso de avaliação no LangSmith | Depende de LangSmith em produção; tratar após adoção do tracing |
| Correctness com LLM-as-judge (`ScoreStringEvalChain`, temp=0) | Fase de avaliação avançada — depende de dataset (item acima) |
| Avaliação de trajetória do agente no LangSmith | Idem — depende de tracing maduro em produção |
| Qualidade do raciocínio CoT | Não aplicável hoje — modelo não expõe CoT explícito |
| Deploy progressivo (dev → limitado → rollout) | Processo de release, não mudança de código; tratar como prática de time |
| Documentação viva de resultados de avaliação | Depende da base de avaliação existir primeiro |
| Validação com filtragem semântica de input | Requer classificador/serviço adicional; fase de segurança avançada |
| Benchmarks OWASP LLM/Agentic Top 10 | Auditoria de segurança formal — fora do escopo de código desta feature |
| Red-teaming adversarial | Processo pré-lançamento, não implementação |
| Orquestração Kubernetes | Infraestrutura fora do escopo do time neste momento |
| TTFT / TPOT monitorados | Observabilidade avançada — fase posterior |
| Custo por tokens monitorado | Idem |
| Analytics de uso de tools | N/A — grafo não usa tools no v1 |
| Política de amostragem de tracking | Depende de LangSmith maduro |
| Retenção de dados (+30 dias) | Política de dados — fase posterior, envolve compliance |
| Alerting de erros recorrentes | Requer ferramenta externa (Sentry/Datadog) — fase posterior |
| Detecção de alucinação (LLM-as-judge/RAGAS) | Depende da base de avaliação (fora de escopo aqui) |
| Monitoramento de bias (fairlearn) | Observabilidade avançada — fase posterior |
| Cadência de observabilidade (real-time/diário/semanal) | Processo operacional, não implementação |
| Caching semântico (Redis/nó no grafo) | Otimização de custo — baixo ROI hoje (entrevista turn-by-turn); fase posterior |
| Trajetória monitorada para regressões | Depende de LangSmith + dataset de eval |
| Fallback multi-provider / `.withFallbacks()` (AIBP-DEC-01, opção C) | Time optou por reter só retry no mesmo provider; reavaliar se OpenAI tiver outage recorrente |
| Validação de saída do LLM antes do SSE (AIBP-DEC-03) | Time optou por não validar — texto livre já é aceitável hoje; reavaliar se houver incidentes de formato |

---

## Relationship to Existing Features

| Feature / doc | Relevância |
| -------------- | ---------- |
| [langsmith-tracing](../langsmith-tracing/spec.md) | Tracing já especificado/implementado; esta feature **não** duplica observabilidade de LLM, apenas resiliência e qualidade |
| [backend-sustainability-hardening](../backend-sustainability-hardening/spec.md) | Precedente de "auditoria → spec de hardening pragmático"; mesmo espírito (sem reescrever arquitetura) |
| [ai-mock-interview](../ai-mock-interview/spec.md) | Arquitetura base do grafo, prompts e streaming que esta feature endurece |
| `docs/prompts-catalog.md` | Deve ser atualizado se prompts migrarem para `ChatPromptTemplate` |
| `docs/TESTING.md` | Deve documentar testes novos (retry, rate limit, avaliação de qualidade) |

**Brownfield (pontos de partida):**

- `src/infrastructure/ai/openai-models.ts` — `ChatOpenAI` criado só com `model` + `apiKey`; sem `temperature`, `maxRetries`.
- `src/infrastructure/ai/langgraph/nodes/interviewer-node.ts` — `model.invoke([...messages])` direto, sem retry; mensagens montadas manualmente (sem `ChatPromptTemplate`).
- `src/infrastructure/ai/langgraph/nodes/review-items-generator-node.ts` — `withStructuredOutput` sem retry.
- `src/modules/interview/prompts/*.ts`, `src/modules/resumes/prompts/*.ts` — 4 prompts como funções TS que retornam string; sem persona em 2 deles (`review-items-generator-prompt.ts`, `resume-extraction-prompt.ts`).
- `src/shared/middlewares/rate-limit-middleware.ts` — `authRateLimiter` aplicado só em `auth-routes.ts`.
- `src/config/app.ts` — health check é `GET /` → `"OK"` fixo, sem checar Postgres/Redis/OpenAI.
- Sem `Dockerfile` no repositório (só `docker-compose.yml` para Postgres/Redis).
- Nenhum endpoint de feedback humano (thumbs up/down) em nenhum módulo.

---

## Decisions (resolved)

| ID | Decisão | Opção escolhida | Detalhe |
| -- | ------- | ---------------- | ------- |
| AIBP-DEC-01 | Estratégia de fallback multi-provider | **C** — só `maxRetries` + `.withRetry()` no mesmo provider, sem `.withFallbacks()`/segundo provider | Menor esforço; time aceita não cobrir indisponibilidade prolongada da OpenAI nesta rodada |
| AIBP-DEC-02 | Escopo da migração para `ChatPromptTemplate`/LCEL | **A** — migrar os 4 prompts para `ChatPromptTemplate` + `MessagesPlaceholder("history")`, nós LangGraph continuam chamando `.invoke()`/`.pipe()` na chain resultante (sem `RunnableSequence` multi-branch) | Ganho de padronização sem reescrever a orquestração do grafo |
| AIBP-DEC-03 | Validação de saída do LLM antes do SSE | **Não validar** — feedback de encerramento continua sendo enviado ao cliente como hoje, sem checagem de formato/conteúdo antes do SSE | Time decidiu que o risco atual é aceitável; reavaliar se houver incidentes reais de formato malformado |
| AIBP-DEC-04 | Onde vive o health check estendido | **B** — criar `GET /health` (liveness simples) + `GET /health/ready` (readiness com Postgres/Redis), mantendo `GET /` como estava | Separa liveness de readiness sem quebrar o teste e2e que espera `GET /` → `"OK"` |

---

## User Stories

### P1: Resiliência de chamadas LLM (retry) ⭐ MVP

**User Story**: Como operador da plataforma, quero que falhas transitórias da OpenAI (rate limit, timeout, 5xx) não derrubem uma entrevista em andamento ou o processamento de currículo, para que o usuário tenha uma experiência confiável.

**Why P1**: Maior risco de produção hoje — uma única chamada falha e todo o turno (ou o job do worker) falha sem nova tentativa.

**Acceptance Criteria**:

1. WHEN `createInterviewModel()`, `createExtractionModel()` ou `createReviewModel()` são instanciados THEN o modelo SHALL ser configurado com `maxRetries` (backoff nativo do LangChain) para erros transitórios (rate limit, timeout, 5xx do provider).
2. WHEN o nó `interviewer-node` invoca o modelo THEN a chamada SHALL usar `.withRetry()` (ou equivalente) com política definida (ex. 2 tentativas, backoff exponencial) antes de propagar erro ao stream.
3. WHEN o nó `review-items-generator-node` ou a extração de currículo invocam o modelo THEN a mesma política de retry SHALL se aplicar.
4. WHEN todas as tentativas de retry se esgotam THEN o erro SHALL ser tratado e propagado ao cliente sem stack trace (SSE `event: error` na entrevista; erro tratado no job do worker para extração), sem fallback para outro modelo/provider (conforme AIBP-DEC-01, opção C).
5. WHEN o retry se esgota THEN o evento SHALL ser registrado via `logger.error` com contexto (`sessionId`/`resumeId`, modelo, número de tentativas).

**Independent Test**: Simular timeout/erro do provider em teste unitário (mock do `ChatOpenAI`) e verificar que o retry é acionado o número de vezes configurado e, esgotado, o erro é propagado de forma tratada (sem stack trace, sem crash do processo).

---

### P1: Containerização e health check real ⭐ MVP

**User Story**: Como operador, quero que a aplicação rode em um container com um endpoint de saúde que reflita a disponibilidade real das dependências, para que qualquer orquestrador (Docker, K8s, PaaS) saiba quando a app está pronta para receber tráfego.

**Why P1**: Pré-requisito para qualquer deploy fora do ambiente local; hoje só a infraestrutura (Postgres/Redis) é containerizada.

**Acceptance Criteria**:

1. WHEN a imagem Docker é construída THEN o `Dockerfile` SHALL empacotar a API (`bun run start` ou equivalente) com build multi-stage (deps → build → runtime enxuto).
2. WHEN o worker precisa rodar separadamente THEN o mesmo `Dockerfile` (ou um segundo estágio/target) SHALL suportar `bun run worker` sem duplicar dependências.
3. WHEN `GET /health` é chamado THEN o sistema SHALL responder `200` com status agregado de liveness (processo vivo), sem depender de dependências externas (conforme AIBP-DEC-04).
4. WHEN `GET /health/ready` é chamado THEN o sistema SHALL checar conectividade com PostgreSQL (`$queryRaw` simples) e Redis (`ping`), respondendo `200` se ambos OK e `503` com detalhe do serviço com falha caso contrário.
5. WHEN o teste e2e existente que espera `GET /` → `"OK"` roda THEN ele SHALL continuar passando sem alteração de contrato (rota `/` preservada).
6. WHEN `docker-compose.yml` é atualizado THEN a app e o worker SHALL poder subir via Compose junto com Postgres/Redis (ambiente de desenvolvimento completo em um comando).

**Independent Test**: `docker build` + `docker run` sobem a API; `curl /health` e `/health/ready` respondem corretamente com e sem Postgres/Redis disponíveis.

---

### P1: Rate limiting e budget de uso nas rotas de IA ⭐ MVP

**User Story**: Como operador, quero que as rotas de entrevista (incluindo o streaming SSE) e upload de currículo tenham rate limiting, para evitar abuso e custo descontrolado de tokens por usuário.

**Why P1**: Hoje só as rotas de auth têm limite; entrevista e upload (as rotas que geram custo de LLM) estão desprotegidas.

**Acceptance Criteria**:

1. WHEN uma requisição chega em `/api/interview/*` (incluindo o endpoint de streaming) THEN ela SHALL passar por um rate limiter configurado (janela e máximo dedicados, distintos do de auth).
2. WHEN uma requisição chega em `/api/resumes/*` (upload) THEN ela SHALL passar por rate limiter dedicado, considerando que é uma operação mais cara (processamento assíncrono).
3. WHEN o limite é excedido THEN o sistema SHALL responder `429` com corpo consistente com o padrão já usado em auth (`{ message: "Too many requests, please try again later." }` ou equivalente contextualizado).
4. WHEN uma sessão de entrevista já atingiu `maxTurns` do nível THEN requisições adicionais de turno SHALL continuar sendo rejeitadas pela regra de negócio existente (não regressão).
5. WHEN variáveis de ambiente de rate limit são adicionadas THEN elas SHALL seguir o padrão Zod existente em `server-schema.ts` (`RATE_LIMIT_*` com defaults sensatos).

**Independent Test**: Teste de integração/e2e disparando requisições acima do limite em `/api/interview/*` e `/api/resumes/*` e verificando `429`.

---

### P2: Adoção de LCEL, `ChatPromptTemplate` e `RunnableConfig`

**User Story**: Como desenvolvedor, quero que os prompts usem os padrões idiomáticos do LangChain (`ChatPromptTemplate`, `MessagesPlaceholder`, LCEL) e que parâmetros de execução (modelo, temperatura) sejam configuráveis via `RunnableConfig`, para reduzir acoplamento a strings manuais e facilitar testes/overrides.

**Why P2**: Melhora manutenibilidade e alinha com built-ins do LangChain, mas não bloqueia funcionalidade hoje (builders de string funcionam).

**Acceptance Criteria**:

1. WHEN os 4 prompts (`interviewer-system-prompt`, `closing-feedback-prompt`, `review-items-generator-prompt`, `resume-extraction-prompt`) são construídos THEN eles SHALL usar `ChatPromptTemplate.fromMessages([...])` no lugar de concatenação manual de strings (conforme AIBP-DEC-02).
2. WHEN o histórico da conversa é injetado no prompt do entrevistador THEN ele SHALL usar `new MessagesPlaceholder("history")` (ou equivalente) alimentado por `state.messages`, preservando o comportamento atual de checkpoint via `PostgresSaver`.
3. WHEN um nó LangGraph invoca a chain resultante THEN a chamada SHALL usar `.invoke()`/`.pipe()` sobre o `ChatPromptTemplate` composto com o modelo (LCEL básico: `prompt.pipe(model)`), sem exigir `RunnableSequence` multi-branch.
4. WHEN parâmetros como modelo ou temperatura precisam variar por execução (ex. teste vs. produção) THEN eles SHALL ser passáveis via `configurable` em `RunnableConfig`, além do `thread_id` já existente em `createInterviewGraphConfig`.
5. WHEN a migração é concluída THEN `docs/prompts-catalog.md` SHALL ser atualizado para refletir o uso de `ChatPromptTemplate` (templates continuam documentados com as mesmas variáveis dinâmicas).
6. WHEN os testes unitários de prompts (`interviewer-node.test.ts`, etc.) rodam THEN eles SHALL continuar validando o conteúdo renderizado final (não a implementação interna do template).

**Independent Test**: `bun run test` cobre renderização dos 4 prompts via `ChatPromptTemplate` com mesmas saídas esperadas hoje (snapshot ou assert de conteúdo); e2e de entrevista sem regressão.

---

### P2: Parâmetros de geração e prompt caching por caso de uso

**User Story**: Como desenvolvedor, quero definir explicitamente o parâmetro de geração correto para cada modelo (entrevista conversacional vs. extração/geração estruturada) e me beneficiar do cache de prompt automático da OpenAI, para obter saídas mais previsíveis nos casos estruturados e reduzir custo/latência nos casos repetitivos.

**Why P2**: Hoje todos os modelos usam o default do provider sem nenhum ajuste por caso de uso.

> **Nota de pesquisa (LangChain JS `@langchain/openai@1.4.7` + OpenAI API, verificado em 2026-07):** os modelos configurados por default (`gpt-5`, `gpt-5-nano`) são **modelos de reasoning** e **não aceitam `temperature`/`top_p`** — qualquer valor diferente do default (`1`) retorna `400 Unsupported parameter`. O ajuste de comportamento nesses modelos é feito via `reasoningEffort` (`"minimal" | "low" | "medium" | "high"`) e `verbosity` (`"low" | "medium" | "high"`), suportados nativamente pelo `ChatOpenAI` do LangChain JS. `temperature`/`top_p` só se aplicam a modelos não-reasoning (ex. `gpt-5-chat-latest`, `gpt-4o`). O AC abaixo foi ajustado para refletir isso — aplicar `temperature` sem essa distinção quebraria toda chamada ao entrevistador/extração/review em produção.

**Acceptance Criteria**:

1. WHEN `createInterviewModel()` é instanciado com um modelo da família reasoning (`gpt-5*`, exceto `-chat-latest`) THEN SHALL usar `reasoningEffort`/`verbosity` configuráveis via env (default adequado a um tom conversacional, ex. `reasoningEffort: "low"`, `verbosity: "medium"`) e SHALL NOT enviar `temperature`/`top_p` a esses modelos.
2. WHEN `createExtractionModel()` ou `createReviewModel()` são instanciados com um modelo reasoning THEN SHALL usar `reasoningEffort` adequado a saídas estruturadas (ex. `"minimal"` ou `"low"`, priorizando velocidade/custo já que a estrutura é garantida por `withStructuredOutput`).
3. WHEN um modelo não-reasoning é configurado (ex. `gpt-5-chat-latest`, `gpt-4o`) via env THEN o sistema SHALL aplicar `temperature`/`top_p` normalmente para esse modelo, mantendo a distinção por caso de uso (conversacional vs. estruturado).
4. WHEN as variáveis de geração (`reasoningEffort`, `verbosity`, e opcionalmente `temperature`/`top_p` para modelos não-reasoning) são adicionadas THEN SHALL seguir o padrão de validação Zod em `server-schema.ts`, com defaults documentados em `.env.example`.
5. WHEN o system prompt do entrevistador é estruturado (currículo + instruções fixas no início, conteúdo dinâmico do turno no final) THEN o sistema SHALL se beneficiar do prompt caching automático da OpenAI (sem código adicional necessário para prompts ≥1024 tokens) — validar que a ordem de montagem do prompt não muda o prefixo estável a cada turno.
6. WHEN a mudança é aplicada THEN os testes existentes que fazem asserts sobre chamadas ao modelo (mocks) SHALL ser atualizados para refletir os novos parâmetros sem quebrar.

**Independent Test**: Teste unitário verifica que `createInterviewModel()` usa `reasoningEffort`/`verbosity` (não `temperature`) para o modelo default `gpt-5`; teste manual confirma que a chamada real à OpenAI não retorna erro 400 de parâmetro não suportado.

---

### P2: Estrutura completa de prompts (persona, tarefa, contexto, formato)

**User Story**: Como desenvolvedor, quero que todos os prompts sigam a estrutura de 4 partes (persona, tarefa, contexto, formato), para garantir consistência e previsibilidade nas saídas do LLM.

**Why P2**: `review-items-generator-prompt.ts` e `resume-extraction-prompt.ts` hoje não têm persona explícita; `interviewer-system-prompt.ts` não tem seção de formato.

**Acceptance Criteria**:

1. WHEN `review-items-generator-prompt.ts` é revisado THEN SHALL incluir uma seção de persona (ex. "Você é um Tech Lead revisando uma entrevista para identificar gaps de aprendizado") antes das instruções.
2. WHEN `resume-extraction-prompt.ts` é revisado THEN SHALL incluir persona explícita (ex. "Você é um parser especializado em currículos técnicos") e separar claramente tarefa vs. formato de saída esperado.
3. WHEN `interviewer-system-prompt.ts` é revisado THEN SHALL incluir uma seção `## Format` explícita (mesmo que resumida: "respostas curtas, 2-4 frases, uma pergunta por turno" já documentado em `## Conduct` pode ser referenciado/reforçado na seção de formato).
4. WHEN os prompts são atualizados THEN `docs/prompts-catalog.md` SHALL refletir as novas seções em cada template documentado.
5. WHEN os testes de prompt existentes rodam THEN SHALL ser atualizados para verificar a presença das novas seções sem quebrar asserts de conteúdo existente.

**Independent Test**: Teste unitário verifica presença de headers de persona/formato nos 4 prompts; `docs/prompts-catalog.md` atualizado corresponde ao código.

---

### P3: Base mínima de avaliação de qualidade

**User Story**: Como tech lead do produto, quero métricas de negócio definidas para avaliação de qualidade do LLM e uma forma de medir tom/conciseness e alinhamento das respostas, para saber se o entrevistador está performando conforme o esperado antes de expandir o produto.

**Why P3**: Importante para maturidade do produto, mas não bloqueia o MVP funcional; depende de decisões de produto (quais métricas importam).

**Acceptance Criteria**:

1. WHEN as métricas de negócio de qualidade de IA são definidas THEN elas SHALL ser documentadas (ex. em `docs/` ou nesta spec) cobrindo pelo menos: aderência ao limite de turnos, aderência ao formato do feedback final, taxa de retries esgotados (da story de resiliência).
2. WHEN um conjunto de casos de teste para tom/conciseness é criado THEN SHALL existir ao menos um avaliador automatizado (custom, baseado em regras simples como contagem de frases/palavras) validando que respostas do entrevistador respeitam "2-4 frases por turno" e o feedback final respeita o limite de palavras.
3. WHEN alinhamento/segurança são avaliados THEN SHALL existir um conjunto de casos de teste (unitário ou integração) simulando tentativas de o usuário pedir para o entrevistador revelar o system prompt ou sair do escopo de entrevista, verificando que o bloco `## Security` é respeitado (via mock determinístico ou teste de prompt).
4. WHEN robustez a edge cases é testada THEN SHALL existir casos cobrindo: mensagem vazia, mensagem extremamente longa, currículo malformado/vazio, sessão já finalizada recebendo novo turno.
5. WHEN um canal de feedback humano é implementado THEN SHALL existir um endpoint simples (ex. `POST /api/interview/sessions/:id/feedback` com `{ rating: "up" | "down", comment?: string }`) persistindo o feedback do usuário sobre a sessão/feedback final.

**Independent Test**: Testes automatizados cobrindo os casos de tom/conciseness, segurança e edge cases passam; endpoint de feedback humano testável via e2e (cria feedback, lista/consulta por sessão).

---

## Edge Cases

- WHEN o retry se esgota sem sucesso THEN o sistema SHALL retornar erro tratado ao cliente (SSE `event: error` ou HTTP 502/503), nunca stack trace ou erro não tratado.
- WHEN o retry consome tempo suficiente para o cliente desconectar do SSE THEN o sistema SHALL abortar a geração restante sem vazar processamento órfão (verificar comportamento atual de desconexão).
- WHEN o rate limiter de `/api/interview/*` conflita com uma sessão legítima de streaming de longa duração THEN o limite SHALL considerar apenas novas conexões/turnos, não a duração da conexão SSE em si.
- WHEN `GET /health/ready` é chamado durante um restart do Postgres/Redis THEN SHALL responder `503` de forma rápida (timeout curto na checagem, não travar a resposta).
- WHEN a migração para `ChatPromptTemplate` altera espaçamento/formatação sutil do prompt renderizado THEN os testes SHALL comparar conteúdo semântico (seções presentes, valores interpolados), não string byte-a-byte frágil.
- WHEN `temperature` de extração/review é alterada THEN outputs de testes existentes que dependem de mocks determinísticos do modelo NÃO SHALL ser afetados (mock não chama API real).
- WHEN o usuário envia feedback humano para uma sessão que não é dele THEN o endpoint SHALL retornar 404 (mesmo padrão de ownership já usado nos demais recursos).

---

## Implementation Notes (for Design)

**Escopo TLC:** **Large** — múltiplos componentes (resiliência de modelos, prompts, deploy, rate limiting, avaliação), decisões já resolvidas (AIBP-DEC-01 a 04) e múltiplos arquivos. Recomenda-se `design.md` cobrindo:

- Estrutura de `.withRetry()` e onde centralizá-la (provável novo módulo `src/infrastructure/ai/resilient-model.ts` ou wrapper em `openai-models.ts`).
- Estrutura do `Dockerfile` multi-stage (build Bun + runtime) e ajuste de `docker-compose.yml`.
- Layout de `ChatPromptTemplate` por prompt (arquivos afetados: os 4 em `src/modules/*/prompts/`).
- Novo middleware de rate limit para IA (`ai-rate-limit-middleware.ts` ou parametrização do existente).
- Endpoint de feedback humano: módulo (`interview` vs. novo `feedback`), schema Zod, tabela Prisma nova (`InterviewFeedback`?).

**Ordem sugerida de execução (commits atômicos, após Design):**

1. Retry nos 3 modelos (`openai-models.ts` + nós) + testes
2. Temperature/top-p por caso de uso + testes
3. Dockerfile + `/health` + `/health/ready` + docker-compose + testes/documentação
4. Rate limiting em interview/resumes + testes
5. Migração `ChatPromptTemplate`/LCEL/`MessagesPlaceholder` (4 prompts) + atualização `prompts-catalog.md`
6. Estrutura de 4 partes nos prompts restantes (persona/formato)
7. Base de avaliação (métricas documentadas, testes de tom/segurança/edge case, endpoint de feedback humano)

**Arquivos principais:**

| Área | Arquivos |
| ---- | -------- |
| Resiliência LLM | `src/infrastructure/ai/openai-models.ts`, `src/infrastructure/ai/langgraph/nodes/interviewer-node.ts`, `review-items-generator-node.ts`, `src/config/env/server-schema.ts` |
| Prompts/LCEL | `src/modules/interview/prompts/*.ts`, `src/modules/resumes/prompts/resume-extraction-prompt.ts`, `docs/prompts-catalog.md` |
| Deploy | novo `Dockerfile`, `docker-compose.yml`, `src/config/app.ts` |
| Rate limiting | `src/shared/middlewares/rate-limit-middleware.ts`, `src/modules/interview/*-routes.ts`, `src/modules/resumes/*-routes.ts`, `server-schema.ts` |
| Avaliação | novo diretório de testes de qualidade (`src/test/quality/` ou similar), novo módulo/endpoint de feedback humano |

**Não alterar comportamento HTTP existente** exceto: novas rotas (`/health`, `/health/ready`, feedback humano) e novos códigos `429`/`502`/`503` nos casos específicos descritos.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --------------- | ----- | ----- | ------ |
| AIBP-01 | P1: `maxRetries` nos 3 modelos | Design | Pending |
| AIBP-02 | P1: `.withRetry()` no `interviewer-node` | Design | Pending |
| AIBP-03 | P1: `.withRetry()` em review/extração | Design | Pending |
| AIBP-04 | P1: erro tratado sem stack trace ao esgotar retry (sem fallback, AIBP-DEC-01=C) | Design | Pending |
| AIBP-05 | P1: log de retry esgotado | Design | Pending |
| AIBP-06 | P1: Dockerfile multi-stage (API) | Design | Pending |
| AIBP-07 | P1: Dockerfile suporta worker | Design | Pending |
| AIBP-08 | P1: `GET /health` liveness | Design | Pending |
| AIBP-09 | P1: `GET /health/ready` com dependências | Design | Pending |
| AIBP-10 | P1: `GET /` preservado (sem regressão e2e) | Design | Pending |
| AIBP-11 | P1: docker-compose com app + worker | Design | Pending |
| AIBP-12 | P1: rate limit em `/api/interview/*` | Design | Pending |
| AIBP-13 | P1: rate limit em `/api/resumes/*` | Design | Pending |
| AIBP-14 | P1: resposta 429 consistente | Design | Pending |
| AIBP-15 | P1: `maxTurns` preservado (sem regressão) | Design | Pending |
| AIBP-16 | P1: env `RATE_LIMIT_*` para IA via Zod | Design | Pending |
| AIBP-17 | P2: `ChatPromptTemplate` nos 4 prompts | Design | Pending |
| AIBP-18 | P2: `MessagesPlaceholder("history")` | Design | Pending |
| AIBP-19 | P2: LCEL básico (`prompt.pipe(model)`) | Design | Pending |
| AIBP-20 | P2: parâmetros via `RunnableConfig` | Design | Pending |
| AIBP-21 | P2: `prompts-catalog.md` atualizado | Design | Pending |
| AIBP-22 | P2: testes de prompt sem regressão | Design | Pending |
| AIBP-23 | P2: `reasoningEffort`/`verbosity` no interview (reasoning models) | Design | Pending |
| AIBP-24 | P2: `reasoningEffort` baixo em extraction/review | Design | Pending |
| AIBP-25 | P2: suporte a `temperature`/`top_p` só para modelos não-reasoning | Design | Pending |
| AIBP-26 | P2: env de geração via Zod + `.env.example` | Design | Pending |
| AIBP-27 | P2: prefixo estável do prompt (prompt caching automático OpenAI) | Design | Pending |
| AIBP-28 | P2: testes de modelo atualizados | Design | Pending |
| AIBP-29 | P2: persona em `review-items-generator-prompt` | Design | Pending |
| AIBP-30 | P2: persona em `resume-extraction-prompt` | Design | Pending |
| AIBP-31 | P2: seção `## Format` no prompt do entrevistador | Design | Pending |
| AIBP-32 | P2: catálogo de prompts refletindo novas seções | Design | Pending |
| AIBP-33 | P3: métricas de negócio de qualidade documentadas | Design | Pending |
| AIBP-34 | P3: avaliador de tom/conciseness (regras) | Design | Pending |
| AIBP-35 | P3: testes de alinhamento/segurança | Design | Pending |
| AIBP-36 | P3: testes de robustez/edge cases | Design | Pending |
| AIBP-37 | P3: endpoint de feedback humano (thumbs up/down) | Design | Pending |

**Coverage:** 37 total, 0 mapped to tasks, 37 unmapped ⚠️ — mapear em `tasks.md` após Design.

---

## Success Criteria

- [ ] Uma falha simulada (timeout/5xx) na chamada do entrevistador aciona retry e, se esgotado, propaga erro tratado sem quebrar a sessão de entrevista nem vazar stack trace (sem fallback de modelo/provider).
- [ ] `docker build` gera uma imagem funcional da API; `docker run` + `curl /health` e `/health/ready` respondem corretamente (200 saudável, 503 com Postgres/Redis fora do ar).
- [ ] `/api/interview/*` e `/api/resumes/*` retornam `429` ao exceder limites configurados, sem afetar usuários dentro do limite.
- [ ] Os 4 prompts usam `ChatPromptTemplate`/`MessagesPlaceholder`; `docs/prompts-catalog.md` reflete a nova implementação; testes de conteúdo continuam verdes.
- [ ] `createInterviewModel()` usa `reasoningEffort`/`verbosity` distintos de `createExtractionModel()`/`createReviewModel()`, configuráveis via env, sem enviar `temperature`/`top_p` a modelos reasoning (evitando erro 400 da OpenAI).
- [ ] Existe pelo menos um teste automatizado para tom/conciseness, um para alinhamento/segurança e um conjunto para edge cases (mensagem vazia, currículo malformado, sessão finalizada).
- [ ] Endpoint de feedback humano funcional, testável via e2e, respeitando ownership por `userId`.

---

**Próximos passos:**

1. ~~Revisar e aprovar esta spec (confirmar AIBP-DEC-01 a 04 e prioridades P1/P2/P3).~~ Decisões resolvidas em 2026-07-02.
2. Rodar fase **Design** para detalhar arquitetura de resiliência (wrapper de retry), Dockerfile e schema do endpoint de feedback humano.
3. Gerar `tasks.md` com breakdown atômico e dependências antes de Execute (escopo Large → tasks formais).
