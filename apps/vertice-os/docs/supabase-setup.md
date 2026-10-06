# Supabase conectado — 06/10/2026

Projeto: `grxsavqchdqzqvqoonqo` (`Verticeeagencia`).

## Configuração aplicada

- Migrations `202610060001_foundation.sql` e `202610060002_dashboard.sql` executadas no SQL Editor, em transações, e registradas em `supabase_migrations.schema_migrations` com versão, nome e SQL de origem.
- Verificação remota: 16 tabelas públicas com RLS e nenhuma tabela pública sem RLS.
- Bucket `workspace-files` privado, sem políticas de objetos que liberem acesso.
- `.env.local` configurado com URL do projeto, chave **publishable** e origem local. O arquivo está ignorado pelo Git. Nenhuma chave secret/service_role foi usada.
- Site URL: `http://localhost:3000`.
- Redirect permitido: `http://localhost:3000/auth/callback`.
- Cadastro público desabilitado; login por e-mail habilitado; confirmação de e-mail mantida.
- Senha mínima configurada para 12 caracteres.
- API Auth respondeu HTTP 200; API de clientes sem autenticação respondeu HTTP 401 / permission denied, como esperado.
- Login local respondeu HTTP 200 e deixou de mostrar a mensagem de ambiente não configurado.

## Pendências

- Definir/criar a conta Auth do proprietário e executar `supabase/provision.sql` com seu UUID. No momento da inspeção inicial, o projeto tinha zero usuários e zero tabelas públicas. O workspace será provisionado junto com seu proprietário.
- A senha deve ser definida pelo próprio usuário; não registrar senha em SQL, repositório ou documentação.
- Homologar login, dashboard autenticado, recuperação e logout com a conta real.
- SMTP próprio não configurado. O painel exige SMTP personalizado para editar templates; o template padrão de recuperação permanece, usando o callback PKCE no mesmo navegador.
- A organização exibe aviso de cota/grace period. O projeto estava Healthy e respondendo durante a configuração; limites da organização podem afetar disponibilidade.
- Não houve deploy Vercel. Ao publicar o app, atualizar `NEXT_PUBLIC_APP_URL`, Site URL e a lista de redirects para o domínio definitivo.

As evidências remotas complementam `validation.md`, cujo primeiro relatório foi produzido antes da conexão.
