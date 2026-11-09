export type FieldError = {
  path: string;
  message: string;
};

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public details?: FieldError[],
  ) {
    super(message);
  }
}
