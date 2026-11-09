import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
  tone = 'light',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <div className="reveal flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className={`text-sm font-semibold tracking-wide uppercase ${dark ? 'text-teal-100' : 'text-teal-800'}`}>{eyebrow}</p> : null}
        <h1 className={`mt-2 font-serif text-4xl sm:text-5xl ${dark ? 'text-white' : 'text-navy-900'}`}>{title}</h1>
        {description ? <p className={`mt-3 max-w-2xl text-base leading-7 ${dark ? 'text-sand-100' : 'text-muted'}`}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-navy-900">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
