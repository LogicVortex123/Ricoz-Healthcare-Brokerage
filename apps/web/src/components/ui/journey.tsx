import { cn } from '@/lib/cn';

export type JourneyStep = {
  label: string;
  detail: string;
  state: 'done' | 'current' | 'upcoming';
};

export function Journey({ steps, label = 'Progress' }: { steps: JourneyStep[]; label?: string }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={label}>
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={cn(
            'rounded-xl border bg-white px-4 py-4',
            step.state === 'current' && 'border-teal-700',
            step.state === 'done' && 'border-line',
            step.state === 'upcoming' && 'border-line',
          )}
          aria-current={step.state === 'current' ? 'step' : undefined}
        >
          <p className={cn('text-xs font-bold tracking-[0.14em] uppercase', step.state === 'upcoming' ? 'text-muted' : 'text-teal-800')}>
            {String(index + 1).padStart(2, '0')}
            {step.state === 'done' ? ' · Done' : step.state === 'current' ? ' · Now' : ''}
          </p>
          <p className="mt-2 font-semibold text-navy-900">{step.label}</p>
          <p className="mt-1 text-sm leading-6 text-navy-800">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}
