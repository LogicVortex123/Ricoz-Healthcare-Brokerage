import { Logo } from '@/components/brand/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-lg flex-1 items-start px-4 py-8 sm:px-6">
        <div className="w-full rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </main>
    </div>
  );
}
