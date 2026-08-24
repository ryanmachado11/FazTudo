import type { FastifyReply, FastifyRequest } from 'fastify';

type Bucket = { count: number; resetAt: number };

export function createRateLimit(options: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>();
  let nextCleanupAt = 0;

  return async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
    const now = Date.now();
    if (now >= nextCleanupAt) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
      nextCleanupAt = now + options.windowMs;
    }

    const key = request.ip;
    const current = buckets.get(key);
    if (!current && buckets.size >= 10_000) {
      reply.header('Retry-After', Math.max(1, Math.ceil(options.windowMs / 1000)));
      return reply.code(429).send({ error: 'Too many requests. Try again later.' });
    }
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : current;
    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, options.limit - bucket.count);
    reply.header('RateLimit-Limit', options.limit);
    reply.header('RateLimit-Remaining', remaining);
    reply.header('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > options.limit) {
      reply.header('Retry-After', Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      return reply.code(429).send({ error: 'Too many requests. Try again later.' });
    }
  };
}
