# Reestruturação: Front + Backend (sem monorepo) — Specification

## Problem Statement

O projeto nasceu como monorepo Turborepo (Better-T-Stack) com `apps/*`, `packages/*` e dependências `workspace:*`. Isso aumenta complexidade de build, acoplamento entre pacotes e dificulta evolução do backend modular já implementado em partes (`apps/server/src/modules/auth`), enquanto a lógica de domínio permanece espalhada em `packages/auth`, `packages/common`, `packages/db`, etc.

A reestruturação elimina Turborepo e workspaces na raiz, organiza o repositório em duas aplicações independentes (`Front/` e `Backend/`) e consolida todo o código do servidor em uma árvore modular única dentro de `Backend/src/`.

## Goals

- [ ] Repositório com apenas `Front/` e `Backend/` como aplicações executáveis na raiz (sem `apps/`, `packages/`, `turbo.json`)
- [ ] `Backend/` com arquitetura modular por feature (`modules/*`) e camadas compartilhadas (`shared/*`, `infrastructure/*`)
- [ ] `Front/` como Next.js standalone, sem `@hackathon2026/ui` nem workspaces
- [ ] Scripts de desenvolvimento, testes e banco funcionando sem `turbo`
- [ ] Comportamento funcional preservado: auth REST, middlewares, Prisma, variáveis de ambiente validadas
- [ ] API exclusivamente REST — sem tRPC no Backend nem no Front

## Out of Scope

| Item | Reason |
|------|--------|
| Dois repositórios Git | Usuário confirmou repo único |
| Manter `packages/ui` ou shadcn compartilhado | Front standalone; componentes ficam dentro de `Front/` |
| Subpastas `Backend/packages/*` | Pacotes npm internos descartados; tudo inline em `src/` |
| Reescrever regras de negócio de auth | Código já pronto; apenas reorganização e ajuste de imports |
| Novos endpoints ou features de produto | Escopo é estrutural |
| Migração de stack (trocar Express, Prisma, Bun, Next) | Mantém stack atual |
| Deploy / CI / Docker | Pode ser ajustado depois em feature própria |
| tRPC (`packages/api`, `/trpc`, `@trpc/*`) | API será REST apenas; pacote e middlewares tRPC removidos |

---

## User Stories

### P1: Remover monorepo e Turborepo ⭐ MVP

**User Story**: Como desenvolvedor, quero um repositório sem Turborepo nem workspaces na raiz, para instalar e rodar cada app de forma isolada.

**Why P1**: É o bloqueio principal; sem isso nada do resto se sustenta.

**Acceptance Criteria**:

1. WHEN o desenvolvedor inspecionar a raiz do repo THEN o sistema SHALL NOT conter `turbo.json`, pasta `apps/`, pasta `packages/`, nem `workspaces` no `package.json` raiz (raiz pode ter apenas tooling compartilhado opcional: husky, prettier, ou ser mínima)
2. WHEN o desenvolvedor executar `bun install` dentro de `Backend/` THEN o sistema SHALL resolver todas as dependências do servidor sem referências `workspace:*`
3. WHEN o desenvolvedor executar `bun install` dentro de `Front/` THEN o sistema SHALL resolver todas as dependências do Next.js sem referências `workspace:*`
4. WHEN o desenvolvedor buscar por `turbo` nos scripts THEN o sistema SHALL NOT expor comandos que invoquem Turborepo

**Independent Test**: Clonar repo, `cd Backend && bun install && bun run dev` e `cd Front && bun install && bun run dev` sem erro de workspace.

---

### P1: Backend modular consolidado ⭐ MVP

**User Story**: Como desenvolvedor backend, quero toda a lógica do servidor em `Backend/src/` com módulos por domínio, para navegar e evoluir o código sem saltar entre pacotes npm.

**Why P1**: Objetivo central da migração; o código já existe, falta a organização.

**Acceptance Criteria**:

1. WHEN o código de `packages/auth` for migrado THEN o sistema SHALL colocá-lo sob `Backend/src/modules/auth/` (service, repository, validations)
2. WHEN o código de `packages/common` for migrado THEN o sistema SHALL colocá-lo sob `Backend/src/shared/` (middlewares, adapters, protocols, errors, types)
3. WHEN o código de `packages/db` for migrado THEN o sistema SHALL colocá-lo sob `Backend/infrastructure/database/` (Prisma schema, migrations, client export)
4. WHEN o código de `packages/env` (server) for migrado THEN o sistema SHALL colocá-lo sob `Backend/src/config/env/` (schemas Zod + loader server)
5. WHEN o código de `packages/api` (tRPC) existir no repo THEN o sistema SHALL NOT migrá-lo — remover `packages/api` e dependências `@trpc/*`, `@hono/trpc-server`
6. WHEN `apps/server` montar a aplicação THEN o sistema SHALL NOT registrar rota `/trpc` nem middleware tRPC em `config/app.ts`
7. WHEN o código atual de `apps/server/src` for migrado THEN o sistema SHALL preservar `config/`, `factories/`, `modules/*/controller`, `modules/*/routes` e `index.ts` como entrypoint
8. WHEN `check-auth-middleware` listar rotas públicas THEN o sistema SHALL NOT incluir `POST /trpc` (apenas rotas REST reais, ex.: auth e health)
9. WHEN os testes existentes forem executados em `Backend/` THEN o sistema SHALL manter cobertura equivalente dos testes de auth controller, middlewares e adapters migrados

**Estrutura alvo (referência)**:

```
Backend/
├── package.json
├── tsconfig.json
├── prisma/                    # ou infrastructure/database/prisma — ver design
├── .env.example
└── src/
    ├── index.ts
    ├── config/
    │   ├── app.ts
    │   ├── routes.ts
    │   └── env/
    ├── factories/
    │   └── auth/
    ├── modules/
    │   └── auth/
    │       ├── controller/
    │       ├── routes/
    │       ├── service/
    │       ├── repository/
    │       └── validations/
    ├── shared/
    │   ├── adapters/
    │   ├── middlewares/
    │   ├── protocols/
    │   ├── errors/
    │   └── types/
    └── infrastructure/
        └── database/
```

**Independent Test**: `cd Backend && bun run test` e `bun run dev`; login/signup/refresh respondem como antes; `GET /` retorna OK; nenhuma rota `/trpc` responde (404 ou inexistente).

---

### P2: Front standalone ⭐ MVP (segunda fatia entregável)

**User Story**: Como desenvolvedor frontend, quero o Next.js em `Front/` sem dependências de monorepo, para rodar a UI contra a API do Backend.

**Why P2**: Repo dividido em duas pastas; Front é a segunda metade do layout acordado.

**Acceptance Criteria**:

1. WHEN `apps/web` for migrado THEN o sistema SHALL colocar a aplicação em `Front/` com `package.json` próprio
2. WHEN componentes eram importados de `@hackathon2026/ui` THEN o sistema SHALL importá-los de caminhos locais dentro de `Front/src/components/` (ou equivalente)
3. WHEN variáveis de ambiente web forem necessárias THEN o sistema SHALL validá-las em `Front/src/config/env` (sem `@hackathon2026/env`)
4. WHEN o Front chamar o Backend THEN o sistema SHALL usar HTTP REST (`fetch` ou cliente HTTP leve) com `NEXT_PUBLIC_SERVER_URL` (ou equivalente) — sem `@trpc/client`, `@trpc/tanstack-react-query` nem `utils/trpc.ts`
5. WHEN formulários de auth existirem THEN o sistema SHALL chamar endpoints REST do módulo auth (ex.: `POST /auth/login`) conforme contrato documentado no design
6. WHEN o desenvolvedor executar `bun run dev` em `Front/` THEN o sistema SHALL subir Next.js na porta configurada (ex.: 3001)

**Independent Test**: Abrir login no browser, formulários renderizam; chamadas à API não falham por imports quebrados (CORS já configurado no Backend).

---

### P2: Tooling e documentação

**User Story**: Como novo contribuidor, quero README e scripts claros para cada pasta.

**Why P2**: Sem docs o ganho da simplificação se perde.

**Acceptance Criteria**:

1. WHEN o README raiz for atualizado THEN o sistema SHALL documentar estrutura `Front/` + `Backend/`, comandos de install/dev/test/db por pasta
2. WHEN testes forem executados na raiz (se mantida) THEN o sistema SHALL delegar para `Backend` e opcionalmente `Front`, ou cada pasta ter seu `bun run test`
3. WHEN husky/lint-staged existirem THEN o sistema SHALL continuar formatando/lintando arquivos em `Front/**` e `Backend/**`

**Independent Test**: Seguir README do zero em máquina limpa (com Postgres) e subir ambos os apps.

---

### P3: Limpeza de artefatos e referências mortas

**User Story**: Como mantenedor, quero zero referências ao layout antigo no código e na config.

**Why P3**: Evita regressão e confusão.

**Acceptance Criteria**:

1. WHEN a migração terminar THEN o sistema SHALL NOT conter imports `@hackathon2026/*` em `Backend/` nem `Front/`
2. WHEN buscar por `apps/`, `packages/`, `turbo` no código-fonte THEN o sistema SHALL NOT retornar matches relevantes (exceto histórico git ou changelog se existir)
3. WHEN buscar por `trpc`, `@trpc/` ou `initTRPC` no código-fonte de `Front/` e `Backend/` THEN o sistema SHALL NOT retornar matches
4. WHEN `.gitignore` for revisado THEN o sistema SHALL ignorar `node_modules`, `.next`, `dist` em `Front/` e `Backend/`

**Independent Test**: `rg "@hackathon2026"`, `rg "turbo"` e `rg -i trpc` em `Front/` e `Backend/` retornam vazio.

---

## Edge Cases

- WHEN paths de Prisma mudarem THEN o sistema SHALL atualizar `prisma.config.ts`, scripts `db:*` e documentação de `.env` no Backend
- WHEN `tsdown` bundlear o Backend THEN o sistema SHALL incluir módulos locais (sem `noExternal` para pacotes workspace inexistentes)
- WHEN o Front precisar de tipos de resposta da API THEN o sistema SHALL definir tipos/DTOs locais em `Front/src/types/` ou inferir de schemas compartilhados via documentação OpenAPI futura (fora desta feature)
- WHEN testes Vitest estavam na raiz THEN o sistema SHALL mover config para `Backend/vitest.config.ts` (e opcionalmente `Front/` se houver testes)
- WHEN `CORS_ORIGIN` no Backend THEN o sistema SHALL incluir URL do Front em `.env.example`
- WHEN falhar migração parcial THEN o sistema SHALL NOT deixar repo em estado híbrido sem documentar rollback (branch dedicada recomendada)

---

## Decisões registradas (discuss)

| Decisão | Escolha |
|---------|---------|
| Layout do repo | Um Git repo; `Front/` + `Backend/` independentes |
| Frontend | Migrar Next.js para `Front/` standalone (sem `packages/ui`) |
| Pacotes backend | Inline em `Backend/src/` (modules + shared + infrastructure) |
| Nomes das pastas | `Front` e `Backend` (capitalização conforme pedido) |
| Protocolo de API | **REST apenas** — remover tRPC e `packages/api` |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| RESTR-01 | P1: Remover monorepo | Design | Pending |
| RESTR-02 | P1: Remover monorepo | Design | Pending |
| RESTR-03 | P1: Backend modular | Design | Pending |
| RESTR-04 | P1: Backend modular | Design | Pending |
| RESTR-05 | P1: Backend modular | Design | Pending |
| RESTR-06 | P1: Backend modular (sem tRPC) | Design | Pending |
| RESTR-07 | P1: Backend modular | Design | Pending |
| RESTR-08 | P1: Backend modular | Design | Pending |
| RESTR-09 | P2: Front standalone (REST) | Design | Pending |
| RESTR-10 | P2: Front standalone | Design | Pending |
| RESTR-11 | P2: Tooling/docs | Tasks | Pending |
| RESTR-12 | P2: Tooling/docs | Tasks | Pending |
| RESTR-13 | P3: Limpeza (incl. zero tRPC) | Tasks | Pending |
| RESTR-14 | P3: Limpeza | Tasks | Pending |
| RESTR-15 | P3: Remover tRPC / packages/api | Tasks | Pending |

**Coverage:** 15 requisitos, 0 em tasks (aguardando fases Design → Tasks)

---

## Success Criteria

- [ ] `Backend/`: `bun install`, `bun run dev`, `bun run test`, `bun run db:push` funcionam sem Turborepo
- [ ] `Front/`: `bun install`, `bun run dev`, build Next.js sem erros de import
- [ ] Auth REST (signup, login, refresh, password reset) comportamento inalterado em testes manuais ou automatizados
- [ ] Nenhum `workspace:*` nem pasta `packages/` na raiz
- [ ] Estrutura de pastas do Backend reflete módulos por domínio + shared + infrastructure
- [ ] Zero dependências e zero código tRPC em `Front/` e `Backend/`

---

## Mapa de migração (origem → destino)

| Origem atual | Destino |
|--------------|---------|
| `apps/server/src/**` | `Backend/src/**` (config, factories, modules) |
| `packages/auth/src/**` | `Backend/src/modules/auth/**` |
| `packages/common/src/**` | `Backend/src/shared/**` |
| `packages/db/**` | `Backend/prisma/` + `Backend/src/infrastructure/database/` |
| `packages/env/src/server*` | `Backend/src/config/env/` |
| `packages/api/**` | **Remover** (não migrar) |
| `apps/web/src/utils/trpc.ts`, providers tRPC | **Remover**; substituir por cliente REST |
| `packages/config/tsconfig.base.json` | `Backend/tsconfig.json` (inline extends) |
| `apps/web/**` | `Front/**` |
| `packages/ui/**` | `Front/src/components/ui/**` (copiar necessários) |
| `packages/env/src/web*` | `Front/src/config/env/` |
| `package.json` (root turbo scripts) | Remover ou reduzir a meta-tooling apenas |
| `turbo.json` | Remover |

---

## Próximos passos (workflow TLC)

1. ~~Revisar e aprovar este `spec.md`~~
2. ~~**Design** (`design.md`)~~ — ver [design.md](./design.md)
3. ~~**Tasks** (`tasks.md`)~~ — ver [tasks.md](./tasks.md) (27 tarefas)
4. **Execute**: implementar em branch `refactor/front-backend-split`
