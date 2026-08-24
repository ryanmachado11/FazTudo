import 'dotenv/config';
import { buildApp } from './app.js';
import { validateAuthConfig } from './lib/auth.js';

validateAuthConfig();
const app = await buildApp();

const port = Number(process.env.PORT || 3001);

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API listening on http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
