import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-navy-950 text-sand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="reveal from-left">
          <Logo light />
          <p className="mt-4 max-w-sm text-base leading-7 text-sand-200">
            PracticeBridge is a provisional product name for the Healthcare Practice Transition Brokerage internship project at BookMyWarehouse / Ricoz Innovation.
          </p>
        </div>
        <div className="reveal" style={{ transitionDelay: '90ms' }}>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Explore</h2>
          <ul className="mt-3 space-y-2 text-base">
            <li><Link className="transition hover:text-teal-100" href="/practices">Approved practices</Link></li>
            <li><Link className="transition hover:text-teal-100" href="/sign-up?role=SELLER">List a practice</Link></li>
            <li><Link className="transition hover:text-teal-100" href="/sign-up?role=BUYER">Create a buyer account</Link></li>
          </ul>
        </div>
        <div className="reveal from-right" style={{ transitionDelay: '160ms' }}>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Account</h2>
          <ul className="mt-3 space-y-2 text-base">
            <li><Link className="transition hover:text-teal-100" href="/sign-in">Sign in</Link></li>
            <li><Link className="transition hover:text-teal-100" href="/#confidentiality">Confidentiality</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-xs text-sand-200 sm:px-6">
        This release does not transfer ownership, collect patient information, or replace legal and financial advice.
      </div>
    </footer>
  );
}
