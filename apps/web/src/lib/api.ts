export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export type FieldError = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: FieldError[],
  ) {
    super(message);
  }
}

type Options = RequestInit & { json?: unknown };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('X-PracticeBridge-Request', '1');
  let body = options.body;
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      body,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'The server could not be reached. Check that the API is running and try again.', 'NETWORK');
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { message?: string; code?: string; details?: FieldError[] }; meta?: unknown }
    | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.message ?? 'The request could not be completed.',
      payload?.error?.code,
      payload?.error?.details,
    );
  }

  return payload as T;
}
