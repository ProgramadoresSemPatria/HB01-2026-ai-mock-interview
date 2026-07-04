# Interview Human Feedback (Frontend Integration) — Specification

## Problem Statement

O backend já implementa um canal de feedback humano (`POST /api/interview/sessions/:sessionId/feedback`, `{ rating: "up" | "down", comment?: string }`, upsert por `sessionId` + `userId`) como parte da feature [ai-best-practices-hardening](../../../Backend/.specs/features/ai-best-practices-hardening/spec.md) (story P3, requisito `AIBP-37`). Esse endpoint hoje não é chamado por nenhuma tela — não existe forma do usuário avaliar a entrevista (thumbs up/down) nem deixar um comentário ao final. Esta feature fecha essa lacuna integrando o widget de feedback ao fluxo de entrevista do Front-end (`src/features/interview/`).

## Goals

- [x] Usuário consegue avaliar a entrevista finalizada com "👍"/"👎" e, opcionalmente, um comentário livre.
- [x] Envio do feedback usa o endpoint já existente no backend, sem exigir mudanças no Backend.
- [x] Widget aparece apenas quando a entrevista está concluída (`isFinished` ou `turnCount >= maxTurns`), no banner "Interview completed" da aba Chat.

## Out of Scope

| Item | Motivo |
| ---- | ------ |
| Endpoint `GET` para recuperar feedback já enviado | Não existe no backend hoje; fora do escopo desta feature (frontend-only). Ver decisão FDBK-DEC-01. |
| Alterações no backend (`InterviewFeedback`, `FeedbackService`, rotas) | Já implementado e testado em `ai-best-practices-hardening`; reuso direto |
| Feedback por turno/mensagem individual | Backend só suporta 1 feedback por sessão (`@@unique([sessionId, userId])`) |
| Exibir feedback agregado/analytics para o operador | Fora do escopo do usuário final; feature futura de admin/dashboard |
| Persistir "já enviei feedback" entre reloads de página | Requer endpoint GET (não existe) — ver FDBK-DEC-01 |

---

## Relationship to Existing Features

| Feature / doc | Relevância |
| -------------- | ---------- |
| [ai-best-practices-hardening](../../../Backend/.specs/features/ai-best-practices-hardening/spec.md) (Backend) | Define e implementa o endpoint, schema Zod e modelo Prisma que esta feature consome |
| `src/features/interview/interview-chat.tsx` | Componente que orquestra o fluxo de entrevista; hospeda o banner de conclusão onde o widget será integrado |
| `src/features/interview/interview-completion-banner.tsx` | Componente alterado para incluir o widget de feedback |
| `src/lib/api/interview.ts`, `src/lib/query/hooks/` | Padrão de API client / hooks a seguir para a nova chamada |

**Brownfield (pontos de partida):**

- `interviewApi` (`src/lib/api/interview.ts`) não tem método de feedback — precisa de `submitFeedback(sessionId, body, token)`.
- `src/types/interview.ts` não tem tipos `FeedbackRating`/`SubmitFeedbackInput`/resposta de feedback.
- `InterviewCompletionBanner` é hoje só texto + link "Jump to review", sem nenhuma interação de feedback.
- Não existe `useMutation` no código hoje (mutações são feitas via função assíncrona direta, ex. `sendMessage` em `interview-chat.tsx`) — este padrão deve ser seguido para consistência, em vez de introduzir `useMutation` do zero.

---

## Decisions (resolved)

| ID | Decisão | Opção escolhida | Detalhe |
| -- | ------- | ---------------- | ------- |
| FDBK-DEC-01 | Onde vive o widget de feedback | No banner "Interview completed" (`InterviewCompletionBanner`), na aba Chat | Usuário vê a oferta de feedback assim que a entrevista termina, antes de navegar para o Review |
| FDBK-DEC-02 | Comportamento do campo de comentário | Rating seleciona 👍/👎; envio via botão "Submit feedback" abaixo do textarea | Rating e comentário vão juntos no POST; reenvio (upsert) pelo mesmo botão ("Update feedback") |
| FDBK-DEC-03 | Persistência de "já enviei feedback" entre reloads | Não persistir — estado de confirmação (`"Thanks for your feedback!"`) vive só em memória do componente durante a sessão do navegador; reload volta a mostrar o widget normalmente, e reenviar apenas atualiza o registro existente (upsert já é idempotente no backend) | Evita adicionar complexidade de storage local sem endpoint GET para validar consistência; comportamento é seguro pois backend faz upsert |

---

## User Stories

### P1: Enviar feedback (thumbs up/down + comentário) ao final da entrevista ⭐ MVP

**User Story**: Como candidato que terminou uma entrevista simulada, quero avaliar a experiência com 👍/👎 e deixar um comentário opcional, para que o time saiba se a entrevista foi útil.

**Why P1**: É a única entrega desta feature — sem isso, o endpoint de feedback já existente no backend permanece sem uso.

**Acceptance Criteria**:

1. WHEN a entrevista está concluída (`isFinished === true` ou `turnCount >= maxTurns`) THEN o banner "Interview completed" SHALL exibir dois botões ("👍 Helpful" / "👎 Not helpful") e um campo de texto opcional para comentário, sempre visíveis.
2. WHEN o usuário seleciona um rating e clica em "Submit feedback" THEN o sistema SHALL enviar `POST /api/interview/sessions/:sessionId/feedback` com `{ rating: "up" | "down", comment }` (comentário vazio SHALL ser omitido do body, não enviado como string vazia).
3. WHEN o envio é bem-sucedido (`201`) THEN o widget SHALL mostrar um estado de confirmação (ex. "Thanks for your feedback!", botão selecionado destacado) e permanecer editável (usuário pode trocar o rating ou reenviar com outro comentário, disparando um novo `upsert`).
4. WHEN o envio falha (erro de rede, `4xx`/`5xx`) THEN o sistema SHALL exibir um toast de erro (`ApiError` → mensagem do backend; erro genérico → mensagem padrão) e manter o widget em estado editável para nova tentativa.
5. WHEN o usuário edita rating ou comentário e clica em "Update feedback" THEN o sistema SHALL reenviar (upsert) com os valores atuais.
6. WHEN a entrevista NÃO está concluída THEN o widget de feedback SHALL NOT ser exibido em nenhuma tela.
7. WHEN o usuário não está autenticado (token ausente) no momento do clique THEN o sistema SHALL exibir toast "Not authenticated" e não disparar a requisição (mesmo padrão já usado em `sendMessage`).

**Independent Test**: Finalizar uma entrevista (ou simular sessão com `isFinished: true`), clicar em 👍 com um comentário, verificar chamada de rede para o endpoint correto e confirmação visual; recarregar a página e verificar que o widget volta ao estado inicial (sem persistência, conforme FDBK-DEC-03).

---

## Edge Cases

- WHEN o comentário excede 1000 caracteres (limite do `submitFeedbackSchema` no backend) THEN o sistema SHALL truncar/validar no client (contador de caracteres ou `maxLength` no `<textarea>`) para evitar erro `422` desnecessário.
- WHEN o usuário clica rapidamente duas vezes no mesmo botão de rating THEN o sistema SHALL evitar disparar requisições duplicadas simultâneas (desabilitar botões durante o envio, mesmo padrão de `isStreaming`/`canSend` já usado no chat).
- WHEN a sessão pertence a outro usuário (não deveria ocorrer via UI normal, mas o backend responde `404`) THEN o sistema SHALL tratar como erro genérico de envio (toast), sem crash de UI.
- WHEN o usuário está na aba "Review" (não no banner do Chat) THEN não há widget de feedback duplicado — ele só existe no banner do Chat (FDBK-DEC-01); o link "Jump to review" continua funcionando normalmente.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FDBK-01 | P1: Widget renderizado no banner de conclusão | Implementing | Verified |
| FDBK-02 | P1: Envio de rating + comentário via API | Implementing | Verified |
| FDBK-03 | P1: Estado de confirmação após sucesso, reenvio permitido | Implementing | Verified |
| FDBK-04 | P1: Tratamento de erro com toast e retry | Implementing | Verified |
| FDBK-05 | P1: Widget oculto quando entrevista não concluída | Implementing | Verified |
| FDBK-06 | P1: Guardas de autenticação e duplo clique | Implementing | Verified |

**Coverage:** 6 total, 6 mapeados diretamente para Execute (escopo Medium — sem `tasks.md` formal).

---

## Implementation Notes (for Execute)

**Escopo TLC:** **Medium** — feature clara, poucos arquivos, sem decisões arquiteturais novas. Design e Tasks formais são pulados; a lista abaixo serve de checklist para o Execute.

**Arquivos a criar/alterar:**

| Arquivo | Mudança |
| ------- | ------- |
| `src/types/interview.ts` | Adicionar `FeedbackRating`, `SubmitFeedbackInput`, `InterviewFeedback` (resposta do endpoint) |
| `src/lib/api/interview.ts` | Adicionar `interviewApi.submitFeedback(sessionId, body, token)` |
| `src/features/interview/interview-feedback-widget.tsx` (novo) | Componente com botões 👍/👎, textarea de comentário, estados de loading/success/error — lógica isolada (sem misturar com `interview-chat.tsx`) |
| `src/features/interview/interview-completion-banner.tsx` | Renderizar `InterviewFeedbackWidget` recebendo `sessionId` |
| `src/features/interview/interview-chat.tsx` | Passar `sessionId` para `InterviewCompletionBanner` (hoje só recebe `onViewReview`) |

**Reuso:**

- `useAuth().getAccessToken()` + `ApiError` — mesmo padrão de `sendMessage` em `interview-chat.tsx`.
- `toast` (`sonner`) para sucesso/erro.
- Tailwind + tokens (`text-(--foreground)`, `border-(--border)`, etc.) e `cn()` para os botões de rating, consistente com o resto do módulo `interview`.

**Ordem sugerida de execução (commit único ou 2 commits atômicos):**

1. Tipos + método de API (`interview.ts`, `types/interview.ts`).
2. `InterviewFeedbackWidget` + integração em `InterviewCompletionBanner`/`InterviewChat`.

---

## Success Criteria

- [x] Ao finalizar uma entrevista, o banner de conclusão exibe o widget de feedback com botões 👍/👎 e campo de comentário.
- [x] Clicar em um rating envia `POST /api/interview/sessions/:sessionId/feedback` com o body correto e trata sucesso/erro visualmente.
- [x] Reenvio (upsert) funciona ao trocar o rating ou editar o comentário após o primeiro envio.
- [x] Nenhuma regressão no fluxo existente de chat/review (`interview-chat.tsx`, `interview-completion-banner.tsx`).

---

**Próximos passos:**

1. Revisar e aprovar esta spec (decisões FDBK-DEC-01 a 03 já confirmadas com o usuário).
2. **Execute** diretamente (escopo Medium — sem Design/Tasks formais): implementar tipos → API → widget → integração, com verificação manual do fluxo de envio.
