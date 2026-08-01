# FazTudo+ — Especificação do Back-End & Arquitetura de Segurança

Aja como um **ENGENHEIRO DE SOFTWARE PRINCIPAL** e **ESPECIALISTA EM CIBERSEGURANÇA** com vasta experiência em:
- Arquitetura de APIs RESTful escaláveis (Node.js/TypeScript)
- Banco de Dados Relacional otimizado (MySQL 8.0+)
- Conteinerização e Orchestration básica (Docker & Docker Compose)
- Segurança da Informação (OWASP Top 10, LGPD, Criptografia, Auth Zero-Trust)
- Sistemas de mensageria em tempo real e WebSockets
- Plataformas de Marketplace e Gestão de Identidade/Verificação

Este repositório atual contém apenas o front-end React/Vite/Tailwind do FazTudo+. Não existe backend implementado aqui. Portanto, o objetivo é criar um serviço backend separado, preferencialmente em `backend/` ou `api/`, que exponha APIs compatíveis com o fluxo da UI já existente.

### Observação importante:
- Use a interface e telas atuais como contexto funcional e de domínio.
- Não assuma existência de controllers, services ou modelos backend no repositório.
- Preserve a arquitetura front-end existente; altere o front-end apenas quando necessário para conectar ao backend local.
- O backend deve ser desenvolvido como um serviço modular, integrado ao frontend via `http://localhost:PORT/api/...`.

Seu objetivo é implementar o **BACK-END COMPLETO E ULTRA-SEGURO** da plataforma **FazTudo+**, garantindo total integração com as telas e componentes definidos no Design System / Figma.

---

# 1. VISÃO GERAL DO PROJETO & DIRETRIZES DE SEGURANÇA

O FazTudo+ conecta clientes e prestadores de serviços locais no Brasil. Por lidar com acesso a residências, dados pessoais sensíveis (documentos, selfies, geolocalização) e transações, **A SEGURANÇA É O PILAR CENTRAL DA APLICAÇÃO**.

### Diretrizes Inegociáveis de Engenharia:
* **Segurança por Design (Security by Design):** Validação, saneamento e tipagem rigorosa de todas as entradas.
* **Conformidade com a LGPD:** Criptografia de Dados Pessoais Sensíveis (PII) em repouso (*at-rest*) e em trânsito (*in-transit*).
* **Simplicidade e Performance:** Arquitetura limpa (Clean Architecture / Layered Architecture) com foco em baixa latência.
* **Observabilidade:** Logs estruturados, tratamento global de erros e health check de serviço.

---

# 2. STACK TECNOLÓGICA OBRIGATÓRIA

* **Ambiente de Execução:** Node.js (Versão LTS / Node 20+) com **TypeScript** (estritamente tipado).
* **Framework Web:** Fastify (preferido) com Zod ou TypeBox para validação de schemas.
* **Banco de Dados:** MySQL 8.0+.
* **ORM / Query Builder:** Prisma ORM com migrations e seed scripts.
* **Autenticação e Sessões:** JWT (RSA256 ou HMAC-SHA256), cookies `HttpOnly`, `Secure`, `SameSite=Strict`, refresh tokens rotativos e revogação segura.
* **Mensageria / Chat:** Socket.io ou WebSockets nativo com autenticação de handshake por token.
* **Infraestrutura:** Docker & Docker Compose para app, MySQL e Redis.

---

# 3. REQUISITOS RIGOROSOS DE CIBERSEGURANÇA (OWASP TOP 10 & LGPD)

Você deve aplicar rigorosamente as seguintes camadas de defesa no código:

### 3.1. Autenticação & Gestão de Acesso (Broken Access Control & Auth)
1.  **Hash de Senhas:** Utilizar obrigatoriamente **Argon2id** ou **Bcrypt** (cost factor mínimo 12).
2.  **RBAC (Role-Based Access Control):** Controle de acesso baseado em papéis (`CLIENTE`, `PRESTADOR`, `ADMIN`). Usuários comuns jamais podem acessar endpoints administrativos ou dados de outros usuários.
3.  **Proteção IDOR (Insecure Direct Object References):** Garantir que um cliente só consiga visualizar/modificar seus próprios chats, agendamentos e dados de perfil. Utilizar **UUIDv4** para chaves primárias expostas em rotas públicas/APIs.

### 3.2. Proteção contra Injeção e Manipulação de Dados
1.  **SQL Injection:** Uso obrigatório de *Prepared Statements* via ORM. Consultas SQL puras estão proibidas sem higienização explicita.
2.  **XSS & Sanitização:** Higienizar todas as entradas de texto (especialmente mensagens no chat e comentários de avaliações) para impedir a execução de código malicioso.

### 3.3. Proteção de Infraestrutura e Redes
1.  **Rate Limiting & Anti-DDoS:** Implementar limite de requisições por IP/Usuário com Redis (ex.: 5 tentativas de login por minuto, 60 requisições por minuto na API).
2.  **Headers de Segurança (Helmet):** CORS restrito, CSP, HSTS, X-Content-Type-Options, X-Frame-Options e Referrer-Policy.
3.  **Upload Seguro de Arquivos:**
    * Validação de tipo MIME real (magic numbers), extensão e tamanho máximo.
    * Renomeação aleatória de arquivos e armazenamento seguro fora da raiz pública.
    * Preferir URLs pré-assinadas temporárias para downloads de mídia.
4.  **Proteção de Payload:** Limitar o tamanho máximo de requisição e aplicar timeouts adequados.

---

# 4. MODELAGEM DO BANCO DE DADOS (SCHEMA MYSQL)

Crie o modelo de dados em MySQL considerando os requisitos das telas da interface. O banco deve conter, no mínimo, as seguintes tabelas e relacionamentos:

### 4.1. Módulo de Usuários e Autenticação
* `users`: `id` (UUID), `name`, `email` (unique), `phone` (unique), `password_hash`, `role` (ENUM: 'CLIENT', 'PROVIDER', 'ADMIN'), `avatar_url`, `is_active`, `created_at`, `updated_at`.
* `user_verifications`: ID, `user_id`, `document_type` (CPF/CNH), `document_number_encrypted`, `document_front_url`, `document_back_url`, `selfie_url`, `status` (ENUM: 'PENDING', 'APPROVED', 'REJECTED'), `rejection_reason`, `reviewed_at`.

### 4.2. Módulo de Categorias e Prestadores (Foco no MVP)
* `categories`: ID, `name` (*Restrito ao MVP: "Eletricista", "Encanador", "Montador de Móveis"*), `slug`, `icon_url`, `is_active`.
* `provider_profiles`: ID, `user_id` (FK), `bio`, `city`, `neighborhood`, `state`, `is_verified` (Boolean), `hourly_rate`, `average_rating` (Decimal), `total_reviews` (Int), `is_urgent_available` (Boolean - para o botão de Urgência da Home).
* `provider_categories`: Relacionamento N:M entre `provider_profiles` e `categories`.

### 4.3. Módulo de Serviços, Agendamentos e Dashboard
* `service_requests`: ID (UUID), `client_id` (FK), `provider_id` (FK), `category_id` (FK), `status` (ENUM: 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'), `description`, `urgency_flag` (Boolean), `scheduled_for`, `created_at`.
* `provider_metrics`: Tabela/view agregada para o Dashboard do Prestador (ganhos acumulados, agenda do dia, pedidos pendentes).

### 4.4. Módulo de Comunicação em Tempo Real (Chat)
* `chat_rooms`: ID (UUID), `service_request_id` (FK), `client_id` (FK), `provider_id` (FK), `created_at`.
* `chat_messages`: ID (UUID), `room_id` (FK), `sender_id` (FK), `message_type` (ENUM: 'TEXT', 'IMAGE', 'AUDIO', 'PROPOSAL'), `content` (ou media_url), `is_read` (Boolean), `created_at`.

### 4.5. Módulo de Avaliações e Confiança
* `reviews`: ID (UUID), `service_request_id` (FK), `client_id` (FK), `provider_id` (FK), `rating` (SmallInt 1 a 5), `comment` (Text), `created_at`. *(Restrição: Um cliente só pode avaliar se o status do serviço for 'COMPLETED').*

---

# 5. ENDPOINTS E REGRAS DE NEGÓCIO DA API

Implemente os endpoints seguindo o padrão REST:

### Auth & Perfil
* `POST /api/auth/register` — Cadastro de usuário (Validação estrita de e-mail e CPF brasileiro).
* `POST /api/auth/login` — Autenticação com retorno de JWT e Cookies Seguros.
* `POST /api/auth/verification` — Upload de documentos e selfie para o processo de verificação de conta (Privativo para Prestadores).

### Cliente & Busca (Home / Perfil Prestador)
* `GET /api/categories` — Listagem do escopo do MVP.
* `GET /api/providers` — Filtros por categoria, localização, ordenar por nota e flag de "Atende Urgência".
* `GET /api/providers/:id` — Dados completos do prestador, selo de verificação, estatísticas e listagem de comentários.

### Chat & Serviços
* `POST /api/services` — Criar solicitação de serviço/orçamento.
* `GET /api/chat/rooms` — Listar conversas ativas.
* `GET /api/chat/rooms/:id/messages` — Histórico de mensagens.
* *WebSocket Handshake:* Eventos para `send_message`, `receive_message`, `send_proposal`, `typing`.

### Dashboard do Prestador
* `GET /api/provider/dashboard` — Resumo de ganhos, lista de pedidos recebidos, solicitações urgentes e métricas gerais.

### Avaliações
* `POST /api/reviews` — Criar avaliação (Atualiza atomicamente o `average_rating` do prestador dentro de uma transação de banco de dados).

---

# 6. CONFIGURAÇÃO DO AMBIENTE DOCKER

Disponibilize um arquivo `docker-compose.yml` contendo:
1.  **Container App (Node.js API):** Multi-stage build otimizado para produção.
2.  **Container MySQL 8.0:** Com volume persistente para os dados e script SQL inicial de seeds (populando as 3 categorias do MVP).
3.  **Container Redis:** Para gestão de sessões, cache e rate-limiting.
4.  **Rede Interna Isolada:** Apenas o container da App expõe a porta web para o host; o MySQL e o Redis permanecem inacessíveis externamente.

---

# 7. ENTREGÁVEIS ESPERADOS

Como Engenheiro de Software, você deverá gerar:
1.  **Código Fonte Modular:** Estruturado em camadas (`controllers`, `services`, `repositories`, `middlewares`, `models`) dentro de um novo módulo backend (`backend/` ou `api/`).
2.  **Arquivo `.env.example`:** Declarando variáveis para segredos, chaves JWT e configurações de banco sem expor credenciais reais.
3.  **Arquivo `docker-compose.yml`:** Pronto para executar via `docker compose up --build`, com `backend`, `mysql` e `redis`.
4.  **Documentação de API (Swagger/OpenAPI):** Detalhando esquemas de requisição, resposta e erros padronizados.
5.  **Integração front-end mínima:** Se necessário, apenas ajustes de configuração para apontar o front-end para o backend local, sem reestruturar a aplicação existente.
6.  **Migrations e seeds:** Prisma migrations e seed das categorias MVP.
7.  **Health check e logs:** Endpoint de saúde, logs estruturados e tratamento global de erros.

Construa um código defensivo, eficiente, limpo e totalmente pronto para suportar o ecossistema mobile-first do **FazTudo+**!

# 8. PROMPT DE EXEMPLO

Como Engenheiro de Software e CyberSegurança, você deve notar que as rotas citadas, por exemplo, não necessariamente existem. Logo, adapte-se para caso aja algumas incongruências para buscar um melhor código. Sempre leve como base o projeto já criado.

# 9. LONGEVIDADE

Como Engenheiro de Software e CyberSegurança, você deve escrever um código limpo e de fácil leitura e manutenção. Podera haver mudanças no código, como adição de trabalhos, por exemplo. Logo, crie um código de fácil inserção de novas funcionalidades.