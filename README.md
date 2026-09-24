# NEXOR TV

Protótipo completo do novo NEXOR, com visual vermelho/preto e navegação por páginas.

## Estrutura
- `/` Início
- `/live.html` TV ao vivo
- `/sports.html` Esportes
- `/movies.html` Filmes
- `/series.html` Séries
- `/search.html` Pesquisa
- `/favorites.html` Favoritos
- `/settings.html` Configurações
- `/player.html?id=...` Player

## Dados IPTV
As credenciais NÃO ficam no navegador. Configure no Vercel:
- `IPTV_BASE_URL` — endereço base do provedor, sem credenciais
- `IPTV_USERNAME`
- `IPTV_PASSWORD`

A API serverless em `api/iptv.js` consulta os endpoints Xtream compatíveis e devolve somente os dados necessários ao frontend.

Use apenas uma fonte IPTV que você tenha autorização para acessar e reproduzir.
