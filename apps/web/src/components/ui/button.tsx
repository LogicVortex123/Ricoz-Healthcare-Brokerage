import Link from 'next/link';
import { cn } from '@/lib/cn';

const variants = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'border border-line bg-white text-navy-900 hover:bg-sand-100',
  ghost: 'text-navy-900 hover:bg-sand-100',
  danger: 'bg-danger-700 text-white hover:bg-danger-700/90',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export function Button({ href, variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: Props) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}
