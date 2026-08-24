Este diretório contém a configuração Docker para o backend.

Para rodar a stack:

1. Para desenvolvimento local, o Compose já possui credenciais isoladas e dados de demonstração habilitados. Basta executar `docker compose up --build`.

   Para qualquer ambiente compartilhado ou de produção, sobrescreva obrigatoriamente `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `DATABASE_URL` com um usuário dedicado, `JWT_SECRET` (mínimo de 32 caracteres), `CORS_ORIGIN`, defina `NODE_ENV=production` e desative `SEED_ON_START`.

2. Construir e subir:
   docker compose up --build

3. O app aguarda o MySQL, aplica migrações e inicia. Para popular dados de demonstração explicitamente, use `SEED_ON_START=true`.

4. Acesse:
   - API: http://localhost:3001

O MySQL não é publicado para o host e não há painel administrativo exposto por padrão.
