import Link from 'next/link';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#f4f1ea' : '#10233a'} />
        <path d="M6 22c4.2-8 15.8-8 20 0" fill="none" stroke={light ? '#0f6e6b' : '#7dcec6'} strokeWidth="2" />
        <path d="M6 22h20" stroke={light ? '#10233a' : '#f4f1ea'} strokeWidth="1.6" />
      </svg>
      <span className={`font-serif text-lg ${light ? 'text-white' : 'text-navy-900'}`}>PracticeBridge</span>
    </Link>
  );
}
