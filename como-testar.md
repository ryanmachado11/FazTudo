Instala docker no pc aí, pede pra alguma ia ensinar
dps abre a pasta do projeto e faz isso no cmd do vscode, e não no powershell:

npm run dev na pasta principal
e depois
cd backend -> docker compose up

deve funcionar.

usa esses usuários pra testar as funções do prestador, pq eles ja vem verificados para interagir com os cliente. Prestador sem verificação não consegue falar com ngm.

carlos@example.com
roberto@example.com
paulo@example.com
fernando@example.com
senha igual para tds: FazTudo123!

se achar erro tenta falar pro copilot resolver, os token diário ta acabando do codex.

copilot ensinando:
Este diretório contém a configuração Docker para o backend.

Para rodar a stack:

1. Construir e subir:
   docker compose up --build

2. O app aguarda o MySQL, aplica migrações e inicia.

3. Acesse:
   - API: http://localhost:3001
   - phpMyAdmin: http://localhost:8080

Configurações importantes:
- MySQL root/password: password
- Banco: faztudo
- O container app depende do mysql e do redis.
