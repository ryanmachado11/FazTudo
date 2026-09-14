FROM node:22-slim

WORKDIR /app

EXPOSE 5173

CMD ["sh", "-c", "npm ci && printf '\nFrontend: http://localhost:5173\nBackend:  http://localhost:3001\n\n' && exec npm run dev -- --host 0.0.0.0 --port 5173"]
