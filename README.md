# Amigo por Perto

Landing page de uma empresa fictícia de aluguer de companhia, em HTML, CSS e JavaScript puro. Formulário preparado para um webhook e chat preparado para um serviço RAG externo.

## Ficheiros

| Ficheiro | Função |
| --- | --- |
| `index.html` | Conteúdo, formulário e janela de chat |
| `style.css` | Estilos e adaptação a telemóvel |
| `script.js` | Formulário, chat e configuração dos endpoints |
| `.nojekyll` | Publicação dos ficheiros estáticos sem processamento Jekyll |

Os caminhos do CSS e JS são relativos, para funcionar também dentro de `/aluga-um-amigo/`.

## Abrir no computador

Descarrega os ficheiros para a mesma pasta e abre `index.html` no navegador. Não é necessário instalar dependências nem compilar.

Para testar as integrações, podes servir a pasta com:

```bash
python -m http.server 8000
```

Abre então `http://localhost:8000`. O backend deve permitir essa origem durante os testes.

## Publicar no GitHub Pages

A configuração inicial é feita uma única vez:

1. Abre [Settings → Pages](https://github.com/diegorobertodev/aluga-um-amigo/settings/pages).
2. Em **Build and deployment → Source**, seleciona **Deploy from a branch**.
3. Em **Branch**, escolhe **main** e a pasta **/(root)**.
4. Clica em **Save** e aguarda que a publicação termine.

Depois de ativado, as alterações à branch `main` são publicadas automaticamente. Não é necessário criar um workflow próprio.

O endereço previsto após a ativação é:
https://diegorobertodev.github.io/aluga-um-amigo/

O workflow anterior foi removido porque tentava ativar o Pages com o token padrão, que não tem as permissões necessárias para essa ativação inicial. A presença dos ficheiros no repositório, por si só, não ativa o Pages.

Referências oficiais: [configuração da publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) e [parâmetro enablement da action](https://github.com/actions/configure-pages/blob/main/action.yml).

## Ligar o webhook e o chat RAG

No início de `script.js`, preenche apenas os dois endereços:

```js
const CONFIG = {
  bookingWebhook: "https://TEU-SERVIDOR/webhook/reservas",
  chatEndpoint: "https://TEU-SERVIDOR/chat"
};
```

Por defeito os endereços estão vazios. Nesse modo, a página funciona como demonstração e não envia dados nem confirma reservas reais.

### Formulário

Envia um `POST` com `Content-Type: application/json` para `bookingWebhook`:

```json
{
  "name": "Pessoa de teste",
  "email": "teste@example.com",
  "activity": "Café & conversa",
  "message": "Gostava de combinar um café."
}
```

O webhook deve devolver um código HTTP de sucesso (2xx). O corpo da resposta pode estar vazio. Em caso de erro, os dados permanecem no formulário para uma nova tentativa.

### Chat

Envia um `POST` com `Content-Type: application/json` para `chatEndpoint`:

```json
{
  "message": "Como funciona?"
}
```

O teu backend RAG deve devolver HTTP 2xx e este formato JSON:

```json
{
  "answer": "Escolhe uma atividade e envia o teu pedido pelo formulário."
}
```

Cada pedido envia a mensagem atual. O backend pode ser adaptado depois para guardar contexto de conversa. A resposta é apresentada como texto, sem executar HTML.

### Backend e CORS

O GitHub Pages aloja os ficheiros do site. O webhook, a pesquisa RAG e o modelo devem correr no teu serviço externo.

O serviço deve usar HTTPS e aceitar pedidos da origem `https://diegorobertodev.github.io`. Para os pedidos JSON entre origens, configura a resposta a `OPTIONS` e os cabeçalhos de CORS:

```http
Access-Control-Allow-Origin: https://diegorobertodev.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Inclui os cabeçalhos de CORS também nas respostas do `POST`, incluindo erros. Mantém chaves de API e tokens secretos apenas no backend: todos os ficheiros deste site são públicos.

Para alterar o texto, edita `index.html`. Para alterar cores ou layout, edita `style.css`.

