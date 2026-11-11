'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/features/auth/auth-provider';
import { homeFor } from '@/lib/constants';

export function SiteFooter() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-line bg-navy-950 text-sand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-base leading-7 text-sand-200">
            PracticeBridge is a provisional product name for the Healthcare Practice Transition Brokerage internship project at BookMyWarehouse / Ricoz Innovation.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Explore</h2>
          <ul className="mt-3 space-y-2 text-base">
            <li><Link className="transition hover:text-teal-100" href="/practices">Approved practices</Link></li>
            <li><Link className="transition hover:text-teal-100" href="/sign-up?role=SELLER">List a practice</Link></li>
            <li><Link className="transition hover:text-teal-100" href="/sign-up?role=BUYER">Create a buyer account</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Account</h2>
          <ul className="mt-3 space-y-2 text-base">
            {user ? <li><Link className="transition hover:text-teal-100" href={homeFor(user.role)}>Your dashboard</Link></li> : <li><Link className="transition hover:text-teal-100" href="/sign-in">Sign in</Link></li>}
            <li><Link className="transition hover:text-teal-100" href="/#confidentiality">Confidentiality</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-xs text-sand-200 sm:px-6">
        An acknowledgement, a worksheet, and an accepted offer stay inside PracticeBridge. None of them transfers ownership or replaces legal and financial advice.
      </div>
    </footer>
  );
}
