import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type Props = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, required, hint, error, children }: Props) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: htmlFor,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })
    : children;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-danger-700"> *</span> : null}
      </label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-sm leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{Children.toArray(children)}</div>;
}
