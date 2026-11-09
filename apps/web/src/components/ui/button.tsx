import Link from 'next/link';
import { cn } from '@/lib/cn';

const variants = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'border border-line bg-white text-navy-900 hover:bg-sand-100',
  ghost: 'text-navy-900 shadow-none hover:bg-sand-100 hover:shadow-none',
  danger: 'bg-danger-700 text-white hover:bg-danger-700/90',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-12 px-5 text-base',
};

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  href?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
};

export function Button({ href, variant = 'primary', size = 'md', loading, className, children, disabled, onClick, ...props }: Props) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
    variants[variant],
    sizes[size],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} onClick={onClick} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  );
}
