export function errorHandler(err, _req, res, _next) {
  // Zod validation errors should be 400 (bad request)
  const isZodError =
    err?.name === 'ZodError' || (Array.isArray(err?.issues) && err?.issues?.length);

  const status = isZodError ? 400 : Number.isInteger(err?.status) ? err.status : 500;
  const shouldExposeMessage =
    status < 500 || status === 502 || status === 503 || status === 504;
  const message = isZodError
    ? 'Invalid request payload'
    : shouldExposeMessage
      ? err?.message || 'Request failed'
      : 'Internal server error';

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const payload = { error: message };
  if (isZodError) {
    payload.details = err.issues?.map((i) => ({
      path: i.path?.join('.') || '',
      message: i.message,
    }));
  }
  if (Number.isInteger(err?.retryAfterSeconds)) {
    payload.retryAfterSeconds = err.retryAfterSeconds;
  }

  res.status(status).json(payload);
}

