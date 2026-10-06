# Vértice OS — fundação (fase 1)

**Atualização de ambiente:** o Supabase já foi conectado localmente e as duas migrations foram aplicadas no projeto informado. Consulte [o registro de configuração](docs/supabase-setup.md) para verificações e pendências de primeiro acesso.

Workspace interno da Vértice Agência. O institucional na raiz continua estático e independente. Este app roda em **outro projeto Vercel**, com Root Directory `apps/vertice-os`. Não altere o Root Directory do institucional.

## Escopo entregue

- Next.js 16.3.8 (App Router), React 19.3, TypeScript 6 em modo estrito, Tailwind CSS 4, componentes locais no padrão shadcn/ui com Radix, Zod e Supabase SSR.
- `/login`, recuperação por e-mail, callback PKCE/token hash, redefinição e encerramento de sessão.
- `/app` protegido no proxy **e** na camada de dados do servidor. Login exige usuário real do Supabase; não existe modo demo ou bypass.
- Workspace vinculado à conta, perfis, sete cargos e isolamento RLS. Sem vínculo ativo, há uma tela de acesso pendente.
- Sidebar responsiva, menu mobile acessível, estados vazios, loading e erros. Botão Novo explica a disponibilidade futura dos cadastros; não simula gravações. Busca global e módulos posteriores estão explicitamente pendentes.
- Dashboard conectado a uma função PostgreSQL `SECURITY INVOKER`; totais e listas respeitam RLS, sem números simulados ou limite de 1.000 registros nos agregados. Financeiro só é consultado para owner/admin/financeiro. Indicadores operacionais dos especialistas se referem somente aos itens permitidos/atribuídos.
- Notificações existentes exibidas no sino. Geração automática e marcação como lida ficam na fase 7.
- `/app/configuracoes` mostra o perfil e a permissão atuais. Gestão de membros fica na fase 7.

## Instalação e execução

Requisitos: Node.js 22+ (validado com 24), npm, projeto Supabase dedicado. Para banco local: CLI Supabase e Docker.

```powershell
cd apps/vertice-os
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Preencha `.env.local` localmente, sem commit:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública anon (ou publishable compatível).
- `NEXT_PUBLIC_APP_URL`: origem completa do app, como `http://localhost:3000` ou a URL HTTPS do novo projeto Vercel.

Não é utilizada chave `service_role`. Nenhum secret administrativo é necessário no runtime. Sem as variáveis Supabase, o login mostra configuração pendente e as rotas internas redirecionam ao login. Ausência de dados não é confundida com falha de consulta: falhas mostram o estado de erro.

## Supabase e migrations

Execute na **raiz do repositório**, onde está a pasta `supabase`:

```powershell
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Em ambiente local, use `npx supabase start` e `npx supabase db reset`. O reset apaga o banco local; não use em um ambiente com dados necessários. As migrations são versionadas e transacionais:

1. `202610060001_foundation.sql`: identidade, workspace, tabelas iniciais, índices, FKs compostas, RLS, auditoria e bucket privado.
2. `202610060002_dashboard.sql`: consulta agregada, validada no servidor com Zod.

### Primeiro acesso

1. No Supabase Auth, desabilite cadastro público e crie/confirme a conta do proprietário. Não há rota de cadastro no app.
2. Com conexão administrativa via `psql`, execute o provisionamento versionado:

```powershell
psql $env:DATABASE_URL -v owner_id=UUID_DO_USUARIO_AUTH -f supabase/provision.sql
```

`DATABASE_URL` é apenas uma variável local da sessão administrativa, **não** uma variável do app. O script cria workspace, vínculo owner e etapas do CRM numa transação; reexecutá-lo não duplica dados. Ele não contém senha ou dados fictícios.

Até existir gestão de equipe, crie membros pelo Auth e vincule seus UUIDs via conexão administrativa à tabela `workspace_members`, usando o workspace criado pelo script. As contas não podem editar seu próprio cargo nem se vincular a outros workspaces pela API pública. Documente mudanças de equipe no processo administrativo; a auditoria automática desta fase cobre entidades operacionais e movimentos financeiros, não alterações administrativas de membros.

### Recuperação de senha

Em Auth / URL Configuration, defina a Site URL do app e permita exatamente `https://SEU_APP/auth/callback` (também localhost no desenvolvimento). Mantenha rate limits do Supabase ativos e configure SMTP para entrega em produção.

O template padrão com `ConfirmationURL` funciona via PKCE no mesmo navegador. Para link utilizável em outro navegador, configure o link no template **Reset Password**:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Redefinir senha</a>
```

O callback valida o token no Supabase e só redireciona para a página fixa de redefinição. A atualização exige sessão validada. Ative também senha mínima de 12 caracteres no Supabase hospedado. SMTP, links reais e revogação de sessões devem ser homologados no projeto conectado.

## Modelo e permissões

O schema é **inicial**, não representa os 50 itens do briefing concluídos. Não criamos dezenas de tabelas vazias de módulos ainda não implementados.

| Cargo | Escopo inicial |
|---|---|
| Owner / admin | Leitura e escrita operacional/financeira; leitura da auditoria |
| Gestor | Clientes, leads, projetos, conteúdo, tarefas e agenda; sem financeiro |
| Social media | Leitura de clientes, conteúdo, tarefas e eventos atribuídos |
| Designer / editor | Leitura de conteúdo, tarefas e eventos atribuídos |
| Financeiro | Contas, recebimentos/pagamentos e eventos atribuídos; sem CRM |

Escrita especializada será adicionada com funções específicas e validação de workflow em migrations futuras; não concedemos UPDATE irrestrito só para liberar mudanças de status. Membership e roles são provisionados administrativamente. Exclusões não estão liberadas nesta fase; cancelamentos preservam histórico.

- `app_role` é enum em `workspace_members`, em vez de duplicar `roles` + `user_roles`. Cada usuário tem um cargo por workspace. As políticas consultam o vínculo ativo no banco, e não uma role alterável no JWT.
- Todas as referências entre clientes, projetos, conteúdo, tarefas e membros usam `(workspace_id, id)`, impedindo relações entre empresas.
- `receivables` e `payables` representam competência; `receipts` e `disbursements` representam caixa. Despesas são contas a pagar, sem duplicação em outra tabela. Movimentos são append-only; pagamentos parciais são aceitos, valores acima do saldo e cancelamento de contas liquidadas são rejeitados.
- `recurrence_key` único por workspace prepara geração idempotente futura. **Não há job de recorrência nesta fase.**
- Auditoria é gerada por triggers e não aceita escrita do usuário. Não armazenamos IP, credenciais de redes sociais nem cópias de conteúdo sensível nos logs.
- Bucket `workspace-files` é privado e ainda não possui políticas de objetos; uploads/downloads serão liberados na fase 7 com autorização por entidade e URLs assinadas.
- Não há seed de negócio aplicado automaticamente. Os dados dos testes são isolados em PostgreSQL efêmero e fixtures fora de `src`.
- O dashboard usa `America/Sao_Paulo`. Receita prevista e despesas usam competência do mês; recebido/pago usam data do movimento; a receber/atrasados usam saldo de todas as competências. Lucro estimado = receita prevista − despesas da competência, não fluxo de caixa. Pipeline e leads fechados são contagens comerciais, não contratos assinados.

## Estrutura

```text
src/app/(auth)/       login, recuperação e redefinição
src/app/auth/         Server Actions e callback
src/app/app/          rotas internas protegidas
src/components/      layout, dashboard e componentes de interface
src/lib/             sessão, validações, permissões e client Supabase
src/proxy.ts         renovação de cookies e barreira inicial de autenticação
tests/               testes de regras, PostgreSQL e Playwright
../../supabase/      migrations, configuração local e provisionamento
```

`database.types.ts` tipa as projeções usadas nesta fase. Ao ampliar o schema, gere tipos completos a partir do projeto conectado e revise o diff:

```powershell
npx supabase gen types typescript --project-id SEU_PROJECT_REF --schema public > apps/vertice-os/src/lib/database.types.ts
```

## Verificações

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Os testes PostgreSQL executam as migrations reais no PGlite, com apenas schemas/roles externos do Supabase reproduzidos. Cobrem RLS entre empresas, os sete cargos, membro revogado, anonimato, escalada de privilégio, FKs, pagamento parcial, duplicidade, saldo e auditoria. Não substituem a homologação de Auth, PostgREST e Storage no Supabase real, nem teste de concorrência com conexões independentes.

Playwright usa Edge instalado (`channel: msedge`) e verifica login/recuperação, bloqueio de rotas sem configuração e overflow em 375, 768 e 1440 px. O dashboard é verificado em uma fixture isolada de componente; **não é login simulado dentro do app**. Capturas ficam em `test-results`, ignorado pelo Git.

`npm audit` identificou um advisory em `braces` via ferramentas de lint (5 ocorrências na árvore de desenvolvimento), sem versão corrigida publicada na consulta inicial. Não aplicamos downgrade major automático do Next/ESLint. `npm audit --omit=dev` deve ser revisto antes de publicar; consulte `docs/validation.md` para o resultado desta entrega.

## Vercel

1. Crie **um novo projeto**, usando o mesmo repositório.
2. Root Directory: `apps/vertice-os`; preset Next.js; Node 22 ou 24; comandos padrão.
3. Configure as três variáveis em cada ambiente. Use Supabase separado para testes/previews quando necessário.
4. Aplique migrations antes de liberar tráfego, configure Auth/SMTP e provisione o proprietário.
5. Valide login, recuperação, logout, cargos, acesso cruzado e banco vazio em staging antes de produção.

Não foi feito deploy nem push nesta execução. O projeto institucional não precisa de novos comandos de build ou rewrites.

## Próximas fases

2. CRM: campos completos, Kanban, timeline, follow-up e conversão transacional.
3. Clientes: visão 360°, onboarding, contatos, contratos e serviços.
4. Operação: CRUD de projetos, tarefas, subtarefas e agenda.
5. Conteúdo: calendário, copy, versões, comentários e aprovações.
6. Financeiro: telas, estornos, recorrência idempotente e relatórios de caixa/competência.
7. Empresa: equipe, administração de permissões, arquivos privados e notificações.
8. Relatórios manuais, busca global e refinamento.

Referências de implementação: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Next.js autenticação](https://nextjs.org/docs/app/guides/authentication).
