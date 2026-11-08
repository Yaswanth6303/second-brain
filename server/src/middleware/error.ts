import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error.ts';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, fields: err.fields } });
    return;
  }
  // express.json() could not parse the body.
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'The request body is not valid JSON.' } });
    return;
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) fields[issue.path.join('.')] ??= issue.message;
    res.status(400).json({ error: { message: 'Check the highlighted fields.', fields } });
    return;
  }
  // Mongo duplicate key, e.g. an email or handle that is already taken.
  if (err?.code === 11000) {
    const fields = Object.fromEntries(
      Object.keys(err.keyValue ?? {}).map((k) => [k, 'Already taken.']),
    );
    res.status(409).json({ error: { message: 'Already taken.', fields } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong.' } });
};
