# FazTudo+ — Diretrizes de UI/UX & Design System

> **Documento de Referência de Design e Experiência do Usuário**  
> **Tema Central:** Fraternidade e Moradia  
> **Foco:** Mobile-first, Acessibilidade, Simplicidade e Confiança  

---

## 1. Princípios de Design e Propósito do Produto

O **FazTudo+** foi desenhado para ser uma plataforma brasileira acolhedora, humana e de alta utilidade prática, conectando moradores a profissionais autônomos para reparos e manutenções residenciais.

### Pilares Fundamentais:
* **Clareza e Acessibilidade:** Interfaces legíveis e descomplicadas, pensadas para pessoas de todas as idades, incluindo idosos e usuários com baixa intimidade digital.
* **Confiança e Transparência:** Perfis de profissionais com histórico real de avaliações, média de notas de clientes comprovados e informações claras sobre áreas atendidas.
* **Comunicação Segura e Centralizada:** Toda a interação acontece por meio do **Chat Interno do FazTudo+**, garantindo privacidade aos moradores e prestadores sem expor contatos particulares.
* **Agilidade no Atendimento:** Botão de emergência residencial (`/urgente`) e busca rápida por categorias de serviços essenciais.

---

## 2. O que Evitar e o que Priorizar

### Evitar:
* Aparência de template genérico internacional ou SaaS corporativo frio.
* Poluição visual, cores berrantes, néon ou elementos estilo gamer/cyberpunk.
* Menus profundos e navegações labirínticas.
* Redirecionamentos para canais externos (o sistema não utiliza WhatsApp nem mensageiros de terceiros).
* Telas de envio de documentos burocráticos (o sistema não utiliza validação por RG, CPF ou selfies).

### Priorizar:
* Botões grandes, áreas de toque confortáveis (mobile-first).
* Contraste tipográfico elevado e excelente legibilidade.
* Paleta acolhedora inspirada no ambiente urbano e residencial brasileiro.
* Microinterações discretas para feedback de ações (toasts, loading states, badge counters).

---

## 3. Identidade Visual e Design Tokens

### 3.1. Cores
* **Fundos e Superfícies:** Tons neutros balanceados, branco suave e superfícies limpas com sombras sutis (`shadow-sm`, `shadow-md`).
* **Cor Primária / Acento:** Laranja/âmbar quente (transmitindo acolhimento, energia e conexão com o trabalho manual/reforma).
* **Cor Secundária:** Tons grafite/chumbo para contrastes de texto e elementos de sustentação.
* **Cores de Estado (Feedback):**
  * Verde suave: status concluído (`COMPLETED`), confirmações de sucesso e mensagens lidas.
  * Âmbar / Azul suave: status em andamento (`IN_PROGRESS` / `ACCEPTED`).
  * Laranja suave: solicitações pendentes (`REQUESTED`).
  * Vermelho discreto: cancelamento (`CANCELLED`) e alertas de erro.

### 3.2. Tipografia
* Tipografia sem serifa moderna, neutra e de alta legibilidade em qualquer resolução (família Inter/sans-serif).
* Escala hierárquica bem definida com títulos objetivos e textos de apoio explicativos.

---

## 4. Telas e Fluxos Principais da Interface

### 4.1. Landing Page (`/`)
* **Hero Section:** Apresentação clara da proposta de valor com chamada para ação (buscar serviço ou cadastrar-se como prestador).
* **Categorias Populares:** Acesso direto a serviços essenciais como eletricista, encanador, pintor, montador e pedreiro.
* **Seção "Como Funciona":** Explicação em passos simples da busca ao atendimento.
* **Depoimentos e Confiança:** Destaque para a segurança e a valorização do trabalho local.

### 4.2. Home do Morador/Cliente (`/home`)
* Barra de busca rápida por profissional ou tipo de reparo.
* Atalhos por categoria e filtro para prestadores com atendimento urgente.
* Lista de cards de profissionais com foto, nota média, especialidades e localização.
* Cabeçalho intuitivo com acesso a "Meus serviços", "Mensagens" e foto de perfil.

### 4.3. Perfil do Prestador (`/prestador/:id`)
* Foto de identificação, nome e selo de perfil ativo.
* Valor hora de referência, especialidades e cidades/bairros atendidos.
* Estatísticas de atendimento e comentários reais de clientes com nota de 1 a 5 estrelas.
* Ação direta para contratação ou abertura de conversa no chat interno.

### 4.4. Chat Interno do FazTudo+ (`/chat/:id` e `/mensagens`)
* **Lista de Conversas (`/mensagens`):** Relação de conversas ativas com foto do interlocutor, resumo da última mensagem, horário e badge de mensagens não lidas.
* **Sala de Conversa (`/chat/:id`):**
  * Bolhas de mensagens claramente diferenciadas entre remetente e destinatário.
  * Indicador de leitura de mensagens (`isRead`).
  * Informações de contexto do serviço vinculado ao topo da conversa.
  * Envio instantâneo de texto e negociação direta dentro da plataforma.

### 4.5. Gestão de Serviços do Cliente (`/servicos`)
* Acompanhamento de todas as contratações em andamento e histórico.
* Badges coloridos indicando o status atual da ordem (`Solicitado`, `Aceito`, `Em andamento`, `Concluído`, `Cancelado`).
* Opção de editar a descrição e a data enquanto o chamado estiver aguardando aprovação (`REQUESTED`).
* Botão para cancelamento de serviços não finalizados.
* Modal de avaliação (1 a 5 estrelas e comentário) liberado assim que o serviço é finalizado.

### 4.6. Painel do Prestador (`/dashboard`)
* Resumo operacional com métricas simples: solicitações pendentes, serviços ativos e concluídos no mês.
* Lista de pedidos recebidos com ações imediatas para aceitar, iniciar atendimento ou recusar/cancelar.
* Acesso às últimas avaliações recebidas de clientes.

### 4.7. Edição de Perfil Profissional (`/perfil/editar`)
* Formulário para atualização de especialidades, biografia, valor hora e chave de disponibilidade para emergências.

### 4.8. Cadastro e Autenticação (`/login`, `/cadastro`, `/cadastro-prestador`)
* Formulários limpos, sem campos desnecessários e sem burocracia documental.
* Mensagens de validação em tempo real com orientações claras de preenchimento.

---

## 5. Acessibilidade e Experiência Inclusiva

Como o projeto está inserido no contexto de **Fraternidade e Moradia**, a interface foi pensada para acolher diferentes perfis da sociedade:
* **Áreas de Clique Confortáveis:** Todos os botões e links possuem altura mínima adequada para toque em telas de smartphones.
* **Textos Descritivos:** Rótulos explícitos em formulários (`<label>`) e contraste de cores que atende às recomendações WCAG AA.
* **Design Responsivo:** Comportamento fluido desde telas móveis compactas (360px de largura) até monitores desktop widescreen.