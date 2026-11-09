import { cn } from '@/lib/cn';

const tones = {
  neutral: 'bg-sand-100 text-navy-800',
  info: 'bg-teal-100 text-teal-800',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
};

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: keyof typeof tones }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>;
}

export function statusTone(status?: string): keyof typeof tones {
  if (status === 'APPROVED' || status === 'ACKNOWLEDGED') return 'success';
  if (status === 'PENDING_REVIEW' || status === 'OPEN') return 'warning';
  if (status === 'REJECTED') return 'danger';
  if (status === 'WITHDRAWN' || status === 'CLOSED') return 'neutral';
  return 'info';
}
