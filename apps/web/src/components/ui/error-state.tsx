import { Button } from './button';

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-danger-100 bg-white px-6 py-10 text-center" role="alert">
      <h2 className="font-serif text-2xl text-navy-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">{message}</p>
      {onRetry ? (
        <div className="mt-5">
          <Button type="button" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
