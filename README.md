# FazTudo+ — Plataforma de Conexão e Manutenção Residencial

> **Projeto Integrador / Apresentação Escolar e Banca Examinadora**  
> **Tema Central:** Fraternidade e Moradia  
> **Equipe 3405:** João Lucas Dionísio, Ryan Machado, Erick Rosa, Gustavo  

---

## 1. Visão Geral do Projeto

O **FazTudo+** é uma aplicação web desenvolvida para conectar, de maneira direta, segura e acessível, moradores que necessitam de reparos e reformas residenciais a prestadores de serviços autônomos locais (como eletricistas, encanadores, pintores, pedreiros e montadores).

A plataforma centraliza todo o ciclo de contratação em um ambiente unificado: desde a busca geográfica e por categoria de serviço, passando pelo alinhamento de escopo via **chat interno em tempo real**, até a gestão de ordens de serviço e avaliações pós-atendimento.

---

## 2. O Problema que o Projeto Resolve

A manutenção de uma moradia é essencial para a integridade física, saúde e dignidade de qualquer família. Contudo, o cenário tradicional de contratação de serviços manuais e autônomos no Brasil enfrenta sérios gargalos:

* **Insegurança e incerteza:** Dificuldade de encontrar profissionais recomendados sem depender exclusivamente do "boca a boca".
* **Exposição de dados pessoais:** Necessidade frequente de compartilhar números particulares de telefone celular em redes abertas para solicitar orçamentos simples.
* **Barreiras tecnológicas:** Plataformas corporativas complexas, com excesso de termos técnicos, cadastros burocráticos e interfaces hostis para pessoas idosas ou com pouca familiaridade digital.
* **Falta de controle dos prestadores:** Dificuldade dos trabalhadores autônomos em organizar suas solicitações de trabalho, histórico de atendimentos e reputação profissional em um painel estruturado.

---

## 3. Proposta de Valor

* **Para o Cliente (Morador):** Facilidade em localizar prestadores disponíveis próximos à sua casa, solicitar orçamentos detalhados, acionar atendimentos urgentes e negociar diretamente por um chat privativo e integrado, sem exposição de contato pessoal e sem intermediários abusivos.
* **Para o Prestador (Profissional Autônomo):** Visibilidade digital gratuita na sua região, autonomia na definição de preços e especialidades, controle de disponibilidade e urgência, além de um painel simples para aceitar, gerenciar e concluir ordens de serviço.

---

## 4. Relação com o Tema "Fraternidade e Moradia"

O projeto foi concebido sob a inspiração do tema **Fraternidade e Moradia**, que defende o direito a um lar digno, seguro e saudável como condição básica para a vida humana:

1. **Dignidade e Salubridade do Lar:** Problemas estruturais, elétricos ou hidráulicos não reparados comprometem a segurança física dos lares e agravam situações de vulnerabilidade. Ao tornar o acesso a reparos residenciais rápido e acessível, o FazTudo+ contribui para a conservação e preservação das habitações.
2. **Solidariedade e Economia Comunitária:** Valoriza a mão de obra autônoma local, gerando trabalho e renda diretamente na comunidade, sem taxas abusivas de intermediação.
3. **Inclusão Social e Acessibilidade:** Desenvolvido com tipografia legível, botões amplos, contrastes adequados e fluxos intuitivos, garantindo que famílias de baixa renda, idosos e pessoas com pouca experiência digital possam cuidar do seu espaço de moradia com autonomia.

---

## 5. Público-Alvo e Diferencial

### Público-Alvo
* Famílias, moradores urbanos, idosos e pessoas com rotinas intensas que precisam solucionar emergências ou manutenções residenciais rotineiras.
* Trabalhadores autônomos e pequenos prestadores de serviços técnicos e manuais que buscam organizar seus atendimentos e consolidar sua carteira de clientes.

### Diferenciais Competitivos
* **Comunicação Privativa e Centralizada:** Toda a interação acontece dentro do **chat interno do FazTudo+**, dispensando o uso de WhatsApp, mensagens SMS ou apps externos.
* **Foco em Moradia Real e Urgência:** Filtros dedicados para prestadores que atendem demandas emergenciais de conserto.
* **Simplicidade de Acesso:** Cadastro rápido e objetivo, sem requisição de documentos oficiais desnecessários (sem RG/CPF).
* **Ciclo Completo com Avaliações Verificadas:** Apenas clientes que concluíram um serviço contratado pela plataforma podem emitir avaliações e notas para o prestador.

---

## 6. Fluxos de Uso da Aplicação

### 6.1. Fluxo do Cliente (`CLIENT`)
1. **Cadastro e Login:** O usuário cria sua conta como cliente com nome, e-mail, telefone e senha, acessando `/login`.
2. **Exploração e Busca (`/home`):** Visualiza prestadores recomendados, filtra por categoria (eletricista, encanador, pintor, etc.), cidade e disponibilidade para urgência, ou realiza busca textual.
3. **Perfil do Prestador (`/prestador/:id`):** Consulta biografia, especialidades, valor hora de referência, média de notas e comentários reais de serviços anteriores.
4. **Abertura de Chamado / Contratação:** Clica em contratar ou no botão de urgência (`/urgente`), descreve a necessidade, define data/hora pretendida e envia a solicitação (`REQUESTED`).
5. **Comunicação Direta (`/chat/:id` ou `/chat/servico/:serviceRequestId`):** Alinha escopo, valores e detalhes no chat integrado em tempo real.
6. **Acompanhamento de Serviços (`/servicos`):** Visualiza status dos seus pedidos, pode editar pedidos pendentes, cancelar pedidos em aberto e, após a conclusão (`COMPLETED`), avaliar o prestador de 1 a 5 estrelas com comentário.
7. **Gestão de Perfil:** Atualiza sua foto de perfil/avatar diretamente pela interface.

### 6.2. Fluxo do Prestador (`PROVIDER`)
1. **Cadastro Profissional (`/cadastro-prestador`):** Cadastra seus dados básicos e preenche o perfil técnico (categoria principal, especialidades, cidade, bairro, estado, valor hora estimado, biografia e disponibilidade para emergências).
2. **Painel do Prestador (`/dashboard`):** Acompanha solicitações pendentes (`REQUESTED`), serviços em andamento, serviços concluídos no mês, média de avaliação e últimas avaliações recebidas.
3. **Gestão do Serviço:**
   * Recebe nova solicitação (`REQUESTED`) e pode **Aceitar** (`ACCEPTED`) ou **Recusar/Cancelar** (`CANCELLED`).
   * Inicia o trabalho passando para **Em Andamento** (`IN_PROGRESS`).
   * Finaliza o atendimento marcando como **Concluído** (`COMPLETED`).
4. **Chat com Clientes (`/mensagens` e `/chat/:id`):** Responde dúvidas de clientes, envia esclarecimentos e negocia os detalhes do serviço.
5. **Edição de Perfil Profissional (`/perfil/editar`):** Atualiza biografia, áreas atendidas, valor hora e especialidades.

---

## 7. Ciclo de Vida do Serviço (Ordens de Serviço)

As solicitações de serviço (`ServiceRequest`) operam com uma máquina de estados estrita garantida pelo banco de dados e pela API:

```
                  ┌───────────────┐
                  │   REQUESTED   │ ◄── (Criado pelo Cliente)
                  └───────┬───────┘
                          │
          ┌───────────────┼───────────────┐
          │ (Prestador    │               │ (Cliente ou Prestador)
          ▼ aceita)       │               ▼
   ┌──────────────┐       │       ┌───────────────┐
   │   ACCEPTED   │       │       │   CANCELLED   │
   └──────┬───────┘       │       └───────────────┘
          │               │               ▲
          ├───────────────┤ (Cancela)     │
          │               └───────────────┤
          ▼ (Inicia)                      │
  ┌───────────────┐                       │
  │  IN_PROGRESS  ├───────────────────────┘
  └───────┬───────┘
          │
          ▼ (Prestador conclui)
   ┌──────────────┐
   │  COMPLETED   │ ──► (Libera avaliação 1 a 5 estrelas pelo Cliente)
   └──────────────┘
```

### Regras de Transição e Edição
* **Edição pelo Cliente:** Um serviço só pode ter sua descrição, categoria, agendamento ou urgência editados pelo cliente enquanto estiver no estado inicial `REQUESTED`.
* **Cancelamento:** Pode ser efetuado tanto pelo cliente quanto pelo prestador enquanto o serviço não estiver finalizado.
* **Conclusão:** Apenas o prestador vinculado pode transicionar o serviço para `COMPLETED`.
* **Estados Terminais:** `COMPLETED` e `CANCELLED` são estados finais permanentes.

---

## 8. Chat Interno do FazTudo+

O canal oficial e exclusivo de comunicação entre usuários é o **Chat Interno**:

* **Salas Dedicadas (`ChatRoom`):** Vinculadas ao cliente, ao prestador e, opcionalmente, a uma solicitação de serviço específica (`serviceRequestId`).
* **Mensagens (`ChatMessage`):** Suporte nativo a tipos `TEXT`, `IMAGE`, `AUDIO` e `PROPOSAL`.
* **Indicadores de Leitura:** Cada mensagem possui o atributo booleano `isRead`.
* **Contador de Não Lidas:** A rota `/api/chat/rooms` agrega mensagens não lidas geradas pelo interlocutor (`unreadCount`).
* **Marcação de Leitura:** Endpoint dedicado (`POST /api/chat/rooms/:id/read`) atualiza as mensagens pendentes ao abrir a conversa.
* **Segurança e Isolamento (IDOR Protection):** Usuários só conseguem listar, ler ou enviar mensagens em salas nas quais são participantes legítimos (`clientId` ou `providerId`).

> **Aviso Importante:** O FazTudo+ não possui botões, links ou integrações com WhatsApp. A negociação ocorre 100% dentro do sistema.

---

## 9. Sistema de Avaliações e Reputação

Para garantir a credibilidade e evitar avaliações falsas:
* Apenas o cliente contratante pode avaliar o prestador.
* A avaliação só é permitida após o serviço atingir o status **`COMPLETED`**.
* Cada ordem de serviço permite exatamente **uma única avaliação** (`@unique([serviceRequestId])`).
* A nota varia de 1 a 5 estrelas, acompanhada de comentário opcional.
* O cálculo da média (`averageRating`) e do total de avaliações (`totalReviews`) do prestador é atualizado atomicamente no banco de dados via transação serializável.

---

## 10. Arquitetura de Software e Tecnologias

O projeto é estruturado em duas camadas principais totalmente integradas:

```
FazTudo/
├── src/                    # Front-end SPA (React + TypeScript + Vite)
│   ├── app/
│   │   ├── components/     # Componentes UI (Shadcn/UI, Radix, ProfilePhoto, etc.)
│   │   ├── hooks/          # Hooks customizados (useAuth)
│   │   ├── lib/            # Cliente API (api.ts), sessão (session.ts) e dados locais
│   │   ├── pages/          # Telas da aplicação (ClientHome, ProviderDashboard, Chat, etc.)
│   │   └── App.tsx         # Roteamento central e proteção por papel (RequireRole, RequireGuest)
├── backend/                # Back-end API RESTful (Node.js + Fastify + Prisma)
│   ├── prisma/             # Schema relacional e migrations do banco de dados
│   ├── src/
│   │   ├── config/         # Conexão com banco de dados (Prisma client)
│   │   ├── lib/            # Utilitários de criptografia (Argon2id) e JWT
│   │   ├── middleware/     # Middlewares de autenticação (JWT Bearer) e Rate Limit
│   │   ├── routes/         # Endpoints REST organizados por domínio
│   │   └── app.ts          # Configuração de plugins, headers de segurança e CORS
│   └── docker-compose.yml  # Orquestração do serviço Fastify e do MySQL 8.0
```

### Tecnologias do Front-end
* **React 18** com **TypeScript** e **Vite 8**.
* **React Router DOM v7:** Navegação declarativa, proteção de rotas com histórico de redirecionamento.
* **Tailwind CSS v4:** Estilização com design system responsivo e mobile-first.
* **Radix UI & Lucide Icons:** Acessibilidade, componentes modais, formulários e ícones modernos.
* **Sonner:** Feedback visual e notificações de sucesso/erro.

### Tecnologias do Back-end
* **Node.js 20+** com **TypeScript**.
* **Fastify v5:** Servidor HTTP de altíssimo desempenho e baixa latência.
* **Prisma ORM v6:** Modelagem estrita de banco de dados, migrações automatizadas e queries seguras.
* **MySQL 8.0:** Banco de dados relacional com integridade referencial e índices otimizados.
* **Docker & Docker Compose:** Conteinerização completa da API e do banco de dados.

---

## 11. Segurança e Proteção de Rotas

O FazTudo+ implementa boas práticas de desenvolvimento seguro baseadas no OWASP Top 10:

1. **Autenticação Baseada em Tokens (JWT):**
   * Emissão de tokens assinados com HMAC-SHA256 e expiração curta (15 minutos).
   * Validação via cabeçalho `Authorization: Bearer <token>`.
2. **Criptografia Forte de Senhas:**
   * Utilização de **Argon2id** (`m=65536, p=4, t=3`) para hash e salting de senhas.
   * Mitigação de ataques de temporização (*timing attacks*) via verificação de hash simulado para usuários inexistentes.
3. **Controle de Acesso Baseado em Papéis (RBAC):**
   * Papéis suportados: `CLIENT`, `PROVIDER` e `ADMIN`.
   * **No Front-end:** Componentes `RequireRole` e `RequireGuest` que impedem acesso indevido e direcionam automaticamente para a área correta de cada papel (`roleHome`: `/home` para clientes, `/dashboard` para prestadores).
   * **No Back-end:** Verificação nos handlers de rota (`requireAuth` e checagem explícita de `user.role`).
4. **Proteção contra IDOR (Insecure Direct Object References):**
   * Chaves primárias UUID v4 em todas as entidades.
   * Validação rigorosa de vínculo em chamadas de chat, serviços e avaliações (o usuário só lê/altera o que lhe pertence).
5. **Mitigação de Abusos e Força Bruta (Rate Limiting):**
   * Limitação de requisições em memória por janela deslizante para endpoints críticos (login, cadastro e envio de mensagens).
6. **Cabeçalhos de Segurança HTTP:**
   * `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
   * `X-Frame-Options: DENY`
   * `X-Content-Type-Options: nosniff`
   * `Referrer-Policy: no-referrer`
   * `Cross-Origin-Resource-Policy: same-site`
7. **Isolamento de Sessão Front-end:**
   * Armazenamento de credenciais ativas em `sessionStorage`, com expiração ao fechar a aba/janela e limpeza proativa de `localStorage`.
8. **Prevenção contra Injeção SQL:**
   * Uso exclusivo de consultas parametrizadas fornecidas pelo Prisma ORM.

---

## 12. Escopo Atual do MVP vs. Fora de Escopo

### Funcionalidades Presentes no MVP Atual
* Cadastro e autenticação para Clientes e Prestadores.
* Catálogo de categorias e profissionais com busca e filtros por localização e urgência.
* Visualização completa de perfil do profissional com avaliações reais.
* Solicitação, acompanhamento, edição e cancelamento de serviços residenciais.
* **Chat interno privativo** com contador de mensagens não lidas e marcação de lido.
* Sistema de avaliação de 1 a 5 estrelas após conclusão do serviço.
* Dashboard operacional para o prestador de serviços.
* Upload e atualização de foto de perfil (avatar) em formato base64.

### Funcionalidades Explicitamente Fora de Escopo
* **Validação documental oficial:** O sistema **não** exige e **não** realiza upload de RG, CPF, CNH ou fotos de documentos para uso da plataforma.
* **WhatsApp e Mensageiros Externos:** O sistema **não** possui integração ou redirecionamento para WhatsApp; toda comunicação é interna.
* **Sistema de Gamificação / Ranking:** Sem pontuações fictícias, medalhas ou rankings competitivos artificiais.
* **Hardware ou Dispositivos Embarcados:** Sem sensores, microcontroladores ou ESP32.
* **Gateway de Pagamento Integrado:** O acerto financeiro é combinado entre as partes, sem cobrança de taxa de serviço ou transação financeira in-app no estágio atual do MVP.

---

## 13. Instruções de Instalação e Execução

### Pré-requisitos
* **Node.js** (versão 20 ou superior) e gerenciador `npm`.
* **Docker Desktop** (com suporte a Docker Compose).

### Passo a Passo

#### 1. Iniciar o Banco de Dados e a API (Back-end)
Abra um terminal no diretório do projeto e navegue para a pasta `backend`:

```bash
cd backend
docker compose up --build
```

O container inicializará o MySQL 8.0, executará as migrações automáticas do Prisma e iniciará o servidor Fastify em:
* **API Back-end:** `http://localhost:3001`
* **Healthcheck:** `http://localhost:3001/health`

#### 2. Iniciar a Aplicação Web (Front-end)
Em um segundo terminal, na raiz do projeto:

```bash
npm install
npm run dev
```

A interface web estará disponível em:
* **Aplicação Front-end:** `http://localhost:5173`

#### 3. Usuários Pré-configurados para Demonstração (Seed)
Todos os usuários possuem a mesma senha padrão: `FazTudo123!`

* **Prestadores de Exemplo:**
  * `carlos@example.com` (Eletricista)
  * `roberto@example.com` (Encanador)
  * `paulo@example.com` (Montador de Móveis)
  * `fernando@example.com` (Pintor)
* **Clientes de Exemplo:**
  * `joao@example.com`
  * `ana@example.com`
  * `maria@example.com`

---

## 14. Validação e Qualidade do Código

O projeto conta com validação automatizada e rotinas de build sem erros:
* **Build Front-end:** `npm run build` (validação de tipos TypeScript e empacotamento Vite sem erros).
* **Testes Automatizados:** Testes de segurança de rotas e regressão end-to-end executáveis via navegador local.
