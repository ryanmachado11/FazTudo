# Guia de Execução e Testes — FazTudo+

> Este documento orienta avaliadores, professores e desenvolvedores na execução e validação completa das funcionalidades do sistema.

---

## 1. Como Iniciar o Sistema Localmente

O ambiente de execução é composto pela API com banco de dados conteinerizados e pelo servidor de desenvolvimento do front-end.

### Passo 1: Iniciar o Back-end (Docker)
No terminal, entre na pasta do backend e suba os containers:

```bash
cd backend
docker compose up --build
```

O container inicializará o banco MySQL 8.0, executará as migrações do Prisma e iniciará o servidor Fastify na porta **3001**:
* **API REST:** `http://localhost:3001`
* **Healthcheck:** `http://localhost:3001/health`

### Passo 2: Iniciar o Front-end (Vite)
Em um segundo terminal, na raiz do projeto:

```bash
npm install
npm run dev
```

Acesse no navegador:
* **Aplicação Web:** `http://localhost:5173`

---

## 2. Usuários de Teste Pré-cadastrados (Seed)

Todos os usuários abaixo já constam no banco de dados com a senha padrão:  
**`FazTudo123!`**

### Prestadores de Serviços (`PROVIDER`)
| E-mail | Nome | Categoria Principal |
|---|---|---|
| `carlos@example.com` | Carlos Silva | Eletricista |
| `roberto@example.com` | Roberto Santos | Encanador |
| `paulo@example.com` | Paulo Costa | Montador de Móveis |
| `fernando@example.com` | Fernando Lima | Pintor |

*Os prestadores acima possuem perfil completo e categorias vinculadas, estando aptos a receber chamados e responder no chat.*

### Clientes (`CLIENT`)
| E-mail | Nome |
|---|---|
| `joao@example.com` | João Pedro |
| `ana@example.com` | Ana Santos |
| `maria@example.com` | Maria Oliveira |

---

## 3. Roteiro de Testes das Funcionalidades Principais

### Teste 1: Autenticação e Redirecionamentos de Papel
1. Acesse `http://localhost:5173/login`.
2. Faça login com o cliente `joao@example.com`. Verifique o redirecionamento automático para `/home`.
3. Tente acessar `/dashboard` diretamente pela barra de endereço do navegador. Verifique que o acesso é bloqueado e redirecionado para `/home`.
4. Faça logout pelo botão "Sair" do cabeçalho.
5. Faça login com o prestador `carlos@example.com`. Verifique o redirecionamento automático para `/dashboard`.
6. Tente acessar `/servicos` pela barra de endereço. Verifique o redirecionamento de volta para `/dashboard`.

### Teste 2: Proteção de Rotas para Visitantes
1. Em aba anônima (ou sem sessão ativa), tente acessar `http://localhost:5173/home`.
2. Confirme que o sistema bloqueia o acesso e redireciona para `/login?redirectTo=%2Fhome`.
3. Acesse `http://localhost:5173/cadastro` e `http://localhost:5173/cadastro-prestador`. Confirme que ambos os formulários de cadastro estão abertos para visitantes.

### Teste 3: Busca de Prestadores e Abertura de Chamado (Fluxo do Cliente)
1. Conecte-se como `joao@example.com`.
2. Na `/home`, utilize a barra de busca ou filtre pela categoria "Encanador" ou pela chave "Atende urgência".
3. Clique no perfil do profissional Roberto Santos (`/prestador/:id`).
4. Clique em "Contratar", descreva o serviço pretendido e confirme a solicitação.
5. Acesse "Meus serviços" (`/servicos`). Verifique que a solicitação aparece listada com o badge `Solicitado`.
6. Enquanto o serviço estiver como `Solicitado`, clique em "Editar" para atualizar a descrição.

### Teste 4: Chat Interno do FazTudo+
1. No perfil do prestador ou na lista de serviços, clique no botão "Chat" (`/chat/servico/:serviceRequestId` ou `/chat/:id`).
2. Digite uma mensagem de teste e clique em enviar.
3. Abra uma segunda janela anônima e entre como o prestador correspondente (`roberto@example.com`).
4. Acesse `/mensagens`. Verifique o contador de mensagens não lidas e a prévia da última mensagem.
5. Abra a conversa. As mensagens pendentes serão marcadas automaticamente como lidas.
6. Responda à mensagem no chat e observe a troca de mensagens na interface.

### Teste 5: Ciclo de Vida do Serviço e Avaliação
1. No painel do prestador (`/dashboard`), localize o pedido recebido em "Solicitações pendentes".
2. Clique para **Aceitar** o pedido (status muda para `Aceito`).
3. Em seguida, avance para **Em andamento** e posteriormente para **Concluído**.
4. Retorne à sessão do cliente em `/servicos`. O status do serviço estará atualizado para `Concluído`.
5. Um botão "Avaliar" estará visível. Clique, selecione as estrelas (de 1 a 5), digite um comentário e envie.
6. Verifique que a avaliação é gravada e o perfil do prestador reflete a nova média e total de avaliações.

---

## 4. Validação de Build do Front-end

Para certificar a integridade do código sem falhas de compilação:

```bash
npm run build
```

O comando compilará os assets via Vite na pasta `dist/` sem qualquer erro de TypeScript.
