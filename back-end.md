# FazTudo+ — Especificação do Back-End & Arquitetura de Segurança

> **Serviço de Back-end RESTful:** Localizado no diretório `backend/`  
> **Tecnologias Centrais:** Node.js (TypeScript), Fastify v5, Prisma ORM v6, MySQL 8.0, Docker & Docker Compose  

---

## 1. Visão Geral da Arquitetura do Back-End

O back-end do **FazTudo+** foi desenvolvido como uma API RESTful modular, segura e de alta performance, estruturada para atender aos fluxos de clientes e prestadores autônomos de serviços residenciais.

A arquitetura adota o princípio de **Defesa em Profundidade** e **Security by Design**, garantindo:
* Isolamento de permissões por perfil de usuário (`CLIENT`, `PROVIDER`, `ADMIN`).
* Criptografia moderna de senhas e autenticação de curta duração baseada em tokens JWT.
* Prevenção contra vulnerabilidades comuns da web (OWASP Top 10), tais como IDOR, injeção de comandos/SQL e ataques de força bruta.
* Canal de comunicação privativo e seguro via **Chat Interno** com controle de leitura.

---

## 2. Stack Tecnológica do Back-End

* **Ambiente de Execução:** Node.js 20+ / Node 26 (LTS) com **TypeScript** e módulos ECMAScript (`NodeNext`).
* **Framework Web:** **Fastify v5** — roteamento de alta performance com tipagem nativa e baixo consumo de memória.
* **Validação de Schemas:** **Zod** — validação estrita em todas as entradas de dados (`.strict()`), com tipagem estática inferida e saneamento de payloads.
* **ORM e Acesso a Dados:** **Prisma ORM v6** — mapeamento objeto-relacional estrito, migrações automatizadas e queries seguras com prepared statements.
* **Banco de Dados:** **MySQL 8.0** — transações ACID, chaves estrangeiras com ações em cascata/restrição e índices secundários.
* **Criptografia e Hashing:** **Argon2id** (v=19, m=65536, p=4, t=3) para senhas; **jsonwebtoken** para tokens JWT.
* **Conteinerização:** Docker com Docker Compose (serviço `app` em multi-stage build e serviço `mysql:8.0` com healthcheck dedicado).

---

## 3. Segurança da Informação (OWASP Top 10 & Boas Práticas)

### 3.1. Autenticação e Gestão de Sessões
1. **Hash Seguro com Argon2id:** Senhas armazenadas com função de derivação de chave de memória difícil, resistente a ataques acelerados por GPU/ASIC.
2. **Mitigação de Timing Attacks:** Em tentativas de login com e-mail inexistente, a aplicação calcula um hash Argon2id simulado antes de responder, impedindo enumeração de usuários por diferença no tempo de resposta da API.
3. **Tokens JWT com Assinatura HMAC-SHA256:**
   * Expiração configurada para 15 minutos (`exp: 15m`).
   * Validação de emissor (`iss: faztudo-api`) e público-alvo (`aud: faztudo-web`).
   * Transmissão via cabeçalho HTTP padrão `Authorization: Bearer <token>`.

### 3.2. Controle de Acesso e Prevenção contra IDOR
1. **Role-Based Access Control (RBAC):** Os papéis `CLIENT` e `PROVIDER` possuem escopos rigorosamente delimitados:
   * Somente `PROVIDER` pode acessar `/api/provider/dashboard` e gerenciar o perfil profissional.
   * Somente `CLIENT` pode criar avaliações e editar solicitações de serviço pendentes.
2. **Prevenção a Acesso Direto a Objetos Inseguros (IDOR):**
   * Todas as entidades públicas utilizam identificadores universais únicos (**UUID v4**), impedindo adivinhação de registros por sequência incremental.
   * Endpoints de chat (`/api/chat/rooms`, `/api/chat/rooms/:id/messages`, `/api/chat/rooms/:id/read`, `/api/chat/messages`) validam expressamente se o usuário autenticado é o cliente ou o prestador vinculado àquela conversa antes de fornecer qualquer informação ou permitir envio de mensagens.

### 3.3. Proteção contra Injeção e Manipulação de Dados
1. **Injeção de SQL:** Todo o acesso à base de dados é mediado pelas APIs do Prisma Client, garantindo o uso de consultas preparadas parametrizadas.
2. **Saneamento de Strings e URLs:** O schema do Zod higieniza campos de texto com `.trim()` e restringe comprimentos máximos. Links de mídia no chat devem seguir protocolo HTTPS obrigatório.

### 3.4. Rate Limiting e Proteção de Rede
1. **Rate Limiter por Janela Deslizante:** Middleware em memória (`rate-limit.ts`) limitando requisições por IP e endpoint:
   * Cadastro: máximo de 5 tentativas por hora.
   * Login: máximo de 10 tentativas a cada 15 minutos.
   * Envio de mensagens no chat: máximo de 30 mensagens por minuto.
2. **Cabeçalhos de Segurança:** Configurados no hook `onSend` do Fastify:
   * `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
   * `X-Frame-Options: DENY`
   * `X-Content-Type-Options: nosniff`
   * `Referrer-Policy: no-referrer`
   * `Cross-Origin-Resource-Policy: same-site`
   * `Cache-Control: no-store` para rotas privadas de dados e controle de cache para catálogo público.

---

## 4. Modelagem do Banco de Dados (Schema Relacional)

O banco de dados relacional é estruturado pelas seguintes tabelas principais:

### 4.1. `users`
* `id` (VARCHAR 36, UUID, PK)
* `name` (VARCHAR 255)
* `email` (VARCHAR 255, UNIQUE)
* `phone` (VARCHAR 50, UNIQUE)
* `password_hash` (VARCHAR 255)
* `role` (ENUM: 'CLIENT', 'PROVIDER', 'ADMIN')
* `avatar_url` (LONGTEXT — dados de imagem codificados em base64)
* `is_active` (BOOLEAN, default: true)
* `created_at` / `updated_at` (DATETIME)

### 4.2. `categories` e `provider_categories`
* `categories`: `id`, `name`, `slug` (UNIQUE), `icon_url`, `is_active`.
* `provider_categories`: tabela de junção N:M entre `provider_profiles` e `categories` com chave composta `(provider_profile_id, category_id)`.

### 4.3. `provider_profiles`
* `id` (VARCHAR 36, UUID, PK)
* `user_id` (VARCHAR 36, UNIQUE, FK -> `users.id`)
* `bio` (TEXT)
* `specialties` (JSON)
* `city` / `neighborhood` / `state` (VARCHAR)
* `hourly_rate` (DECIMAL 10,2)
* `average_rating` (DECIMAL 3,2)
* `total_reviews` (INT, default: 0)
* `is_urgent_available` (BOOLEAN, default: false)
* `is_verified` (BOOLEAN, default: false)

### 4.4. `service_requests`
* `id` (VARCHAR 36, UUID, PK)
* `client_id` (FK -> `users.id`)
* `provider_id` (FK -> `users.id`, nullable)
* `category_id` (FK -> `categories.id`)
* `status` (ENUM: `'REQUESTED'`, `'ACCEPTED'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'CANCELLED'`)
* `description` (TEXT)
* `urgency_flag` (BOOLEAN, default: false)
* `scheduled_for` (DATETIME, nullable)
* `created_at` / `updated_at` (DATETIME)

### 4.5. `chat_rooms` e `chat_messages`
* `chat_rooms`: `id` (UUID, PK), `service_request_id` (FK, nullable), `client_id` (FK), `provider_id` (FK), `created_at`.
* `chat_messages`: `id` (UUID, PK), `room_id` (FK), `sender_id` (FK), `message_type` (ENUM: `'TEXT'`, `'IMAGE'`, `'AUDIO'`, `'PROPOSAL'`), `content` (TEXT), `is_read` (BOOLEAN, default: false), `created_at`.

### 4.6. `reviews`
* `id` (UUID, PK)
* `service_request_id` (UNIQUE, FK -> `service_requests.id`)
* `client_id` (FK -> `users.id`)
* `provider_id` (FK -> `users.id`)
* `rating` (SMALLINT, 1 a 5)
* `comment` (TEXT, nullable)
* `status` (ENUM: `'PENDING'`, `'APPROVED'`, `'REJECTED'`, default: `'APPROVED'`)
* `created_at` (DATETIME)

---

## 5. Catálogo de Endpoints da API

Todas as rotas da API são prefixadas com `/api`:

### Autenticação & Perfil (`/api/auth`)
* `POST /api/auth/register` — Cadastra cliente ou prestador (com perfil profissional associado). Não requer e não processa documentos oficiais (sem RG/CPF).
* `POST /api/auth/login` — Autenticação com e-mail e senha, retornando token JWT e objeto do usuário autenticado.
* `GET /api/auth/me` — Retorna dados da sessão e perfil do usuário logado (requer JWT).
* `POST /api/auth/avatar` — Atualiza a foto de perfil do usuário em base64 (requer JWT).

### Categorias & Prestadores (`/api/categories`, `/api/providers`)
* `GET /api/categories` — Lista as categorias de serviços ativas.
* `GET /api/providers` — Busca prestadores com filtros por categoria (`category`), cidade (`city`), atendimento urgente (`urgent=true`) e ordenação (`sort=rating` ou `sort=price`).
* `GET /api/providers/:id` — Dados detalhados do prestador, especialidades, média de avaliações e comentários aprovados.

### Gestão de Serviços (`/api/services`)
* `GET /api/services` — Lista solicitações do usuário (como cliente ou prestador).
* `POST /api/services` — Cria nova solicitação de serviço/orçamento (estado inicial: `REQUESTED`).
* `PATCH /api/services/:id` — Edita detalhes da solicitação (permitido apenas para o cliente e enquanto o status for `REQUESTED`).
* `PATCH /api/services/:id/status` — Atualiza o status do serviço respeitando a máquina de estados (ex.: prestador aceita, inicia ou conclui; cliente ou prestador cancela).

### Chat Interno (`/api/chat`)
* `POST /api/chat/rooms` — Abre ou recupera uma sala de conversa entre cliente e prestador.
* `GET /api/chat/rooms` — Lista as conversas ativas do usuário com última mensagem e contagem de mensagens não lidas (`unreadCount`).
* `GET /api/chat/rooms/:id/messages` — Histórico ordenado de mensagens da sala.
* `POST /api/chat/rooms/:id/read` — Marca como lidas (`isRead: true`) todas as mensagens recebidas na sala.
* `POST /api/chat/messages` — Envia mensagem no chat (protegido por autenticação, IDOR check e rate limit).

### Avaliações (`/api/reviews`)
* `POST /api/reviews` — Emite avaliação (nota de 1 a 5 e comentário). Só é permitida para serviços concluídos (`COMPLETED`). Atualiza a média do prestador via transação serializável.

### Painel do Prestador (`/api/provider/dashboard`)
* `GET /api/provider/dashboard` — Resumo de solicitações pendentes, serviços em andamento, concluídos no mês e avaliações recentes.

### Perfil do Prestador (`/api/provider/profile`)
* `GET /api/provider/profile/me` — Recupera dados completos do perfil profissional do prestador autenticado.
* `PUT /api/provider/profile/me` — Atualiza biografia, áreas atendidas, valor hora, especialidades e disponibilidade de emergência.

---

## 6. Ambiente Docker e Execução

O back-end é orquestrado via `backend/docker-compose.yml`:

```bash
cd backend
docker compose up --build
```

O ambiente inicializa automaticamente:
1. Container `mysql` na porta interna 3306 com volume persistente `mysql-data`.
2. Container `app` que aguarda o banco ficar saudável, aplica migrações e executa o seed de dados iniciais.
3. API pronta para atender na porta `3001` (`http://localhost:3001/health`).
