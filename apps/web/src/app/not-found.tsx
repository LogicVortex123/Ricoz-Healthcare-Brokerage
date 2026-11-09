import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-sm font-semibold text-teal-800">404</p>
      <h1 className="mt-2 font-serif text-4xl text-navy-900">That page is not available</h1>
      <p className="mt-3 text-sm leading-6 text-muted">The link may be out of date, or the listing may not be public.</p>
      <Link href="/" className="mt-6 text-sm font-semibold text-teal-800">Return home</Link>
    </main>
  );
}
