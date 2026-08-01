import 'dotenv/config';
import Fastify from 'fastify';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registerRoutes } from './routes/index.js';
const app = Fastify({
    logger: true,
});
app.get('/health', async () => ({ ok: true, service: 'faztudo-backend' }));
app.get('/docs', async () => {
    const file = await readFile(join(process.cwd(), 'docs', 'openapi.json'), 'utf8');
    return JSON.parse(file);
});
await registerRoutes(app);
const port = Number(process.env.PORT || 3001);
try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`API listening on http://localhost:${port}`);
}
catch (error) {
    app.log.error(error);
    process.exit(1);
}
