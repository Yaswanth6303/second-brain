import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type Schemas = { body?: ZodType; query?: ZodType; params?: ZodType };

// Replaces each request part with its parsed value; ZodErrors become 400s in the error handler.
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      // defineProperty because Express 5 exposes req.query as a getter.
      if (schema)
        Object.defineProperty(req, key, { value: schema.parse(req[key]), writable: true });
    }
    next();
  };
