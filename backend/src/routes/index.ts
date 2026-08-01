import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { categoriesRoutes } from './categories.js';
import { providersRoutes } from './providers.js';
import { servicesRoutes } from './services.js';
import { chatRoutes } from './chat.js';
import { reviewsRoutes } from './reviews.js';
import { dashboardRoutes } from './dashboard.js';
import { providerProfileRoutes } from './provider-profile.js';

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(categoriesRoutes, { prefix: '/api/categories' });
  app.register(providersRoutes, { prefix: '/api/providers' });
  app.register(servicesRoutes, { prefix: '/api/services' });
  app.register(chatRoutes, { prefix: '/api/chat' });
  app.register(reviewsRoutes, { prefix: '/api/reviews' });
  app.register(dashboardRoutes, { prefix: '/api/provider/dashboard' });
  app.register(providerProfileRoutes, { prefix: '/api/provider/profile' });
}
