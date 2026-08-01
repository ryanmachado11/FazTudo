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
