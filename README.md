# Vértice Social Media

Site da agência Vértice: gestão de Instagram e criação de sites.

Site estático, sem build. Publicado pela Vercel a cada push na branch main.

## Vértice OS

O sistema interno está em [`apps/vertice-os`](apps/vertice-os/README.md), com Next.js, TypeScript e Supabase. Sua publicação deve usar **um projeto Vercel separado**, com Root Directory `apps/vertice-os`. O site institucional e seus arquivos continuam na raiz, sem alteração de build.

Consulte o README do app para instalação, variáveis, migrations, provisionamento do primeiro usuário, permissões, testes e limites da primeira fase. As migrations ficam em [`supabase/migrations`](supabase/migrations).

## Estrutura

```
index.html        estrutura e conteúdo da página
css/style.css     todos os estilos (com índice de seções no topo)
js/main.js        interações: menu mobile, planos, copiar contatos, formulário → WhatsApp
img/              favicon, imagem de compartilhamento (og) e posts do feed
```

## Onde mudar as coisas

- **Número do WhatsApp:** `CONFIG.whatsapp` no topo de `js/main.js` (DDI + DDD + número, só dígitos).
  Ele é aplicado no botão flutuante, no link do rodapé e na mensagem do formulário.
  Os números visíveis no texto (seção Contato e rodapé) ficam no `index.html`.
- **Cores e fontes:** variáveis em `:root`, no começo de `css/style.css`.
- **Logo:** definido uma vez no `<symbol id="logo">` no topo do `<body>` e reutilizado com `<use href="#logo">`.

## Rodar localmente

Abra o `index.html` direto no navegador, ou sirva a pasta:

```bash
python -m http.server 8000
```
