FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
RUN chmod +x /app/docker/entrypoint.sh
EXPOSE 3001
CMD ["/bin/sh", "/app/docker/entrypoint.sh"]
