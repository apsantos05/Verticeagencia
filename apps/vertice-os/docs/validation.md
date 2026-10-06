# Validação — 06/10/2026

## Executado localmente

- `npm run lint`: passou, sem avisos.
- `npm run typecheck`: passou.
- `npm run build`: passou, Next.js 16.3.8.
- `npm test`: 3 testes passaram. O teste SQL contém verificações de todos os sete cargos, segregação de tenants, membro revogado, FKs compostas, pagamentos parciais, duplicações, auditoria e bloqueio de anonimato.
- `npm run test:e2e`: 4 testes passaram no Edge; login/recuperação e bloqueio de rotas em 375/768/1440 px, além de renderização isolada dos estados vazios do dashboard nessas larguras.
- Capturas desktop/mobile revisadas visualmente; sem overflow horizontal detectado.
- `npm audit --omit=dev`: zero vulnerabilidades.
- `npm audit`: 5 ocorrências de severidade alta na árvore de lint, originadas do advisory de `braces <=3.0.3`. A versão publicada mais recente consultada foi 3.0.3. Correção sugerida pelo npm exigia downgrade major do eslint-config-next; não foi aplicada por incompatibilidade com o framework atual.
- Arquivos institucionais `index.html`, `css/style.css`, `js/main.js` e `img` não possuem alterações no diff.

## Limites desta validação

Não havia credenciais ou projeto Supabase conectado. As migrations foram executadas em PostgreSQL PGlite com schemas Auth/Storage mínimos para teste, não no serviço Supabase. O banco de teste valida as políticas reais da aplicação, mas não a API Auth, o SMTP, o PostgREST, o Storage remoto ou concorrência financeira com múltiplas conexões.

O login no navegador foi testado sem configuração (acesso bloqueado). O dashboard usou uma fixture de componente isolada, sem criar autenticação falsa no app. Fluxo autenticado completo, interação da sidebar e notificações dentro de uma sessão real precisam de homologação em staging.

Não houve deploy, push, criação de usuários reais ou alteração em serviços externos.

## Critérios antes da liberação

1. Aplicar migrations em staging e provisionar o proprietário com o script versionado.
2. Validar login correto/incorreto, recuperação real por e-mail, expiração, logout e revogação de usuário.
3. Conferir visibilidade por cargo e entre dois workspaces via interface e API Supabase.
4. Homologar as interações autenticadas da sidebar, modais e notificações em desktop/mobile.
5. Manter bucket privado sem acesso a objetos até a fase de arquivos.
6. Rever o advisory de ferramentas de desenvolvimento e publicar em projeto Vercel separado.
