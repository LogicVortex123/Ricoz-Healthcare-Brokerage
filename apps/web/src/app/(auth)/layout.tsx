import { Logo } from '@/components/brand/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-sand-50 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="aurora" aria-hidden="true" />
      <aside className="relative hidden flex-col justify-between bg-navy-950 p-12 text-white lg:flex">
        <Logo light />
        <div className="max-w-lg">
          <p className="text-sm font-semibold tracking-wide text-gold-100 uppercase">Dental · Veterinary · Specialist medical</p>
          <p className="mt-4 font-serif text-5xl leading-tight">Your account keeps the listing private until it is reviewed.</p>
          <ul className="mt-8 space-y-4 text-lg leading-8 text-sand-100">
            <li>Sellers save a draft, then submit it for review.</li>
            <li>Administrators approve or send a reason back.</li>
            <li>Buyers search only approved practices and send one inquiry.</li>
          </ul>
        </div>
        <p className="max-w-md text-sm leading-6 text-sand-100">Owner email, phone, and street address stay off the public listing.</p>
      </aside>
      <div className="relative flex min-h-screen flex-col">
        <header className="mx-auto flex h-16 w-full max-w-lg items-center px-4 sm:px-6 lg:hidden">
          <Logo />
        </header>
        <main id="main" className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-10 sm:px-6">
          <div className="reveal from-right w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
