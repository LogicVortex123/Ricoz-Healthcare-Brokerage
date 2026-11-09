import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignUpForm } from '@/features/auth/sign-up-form';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading registration…</p>}>
      <h1 className="font-serif text-4xl text-navy-900">Create an account</h1>
      <p className="mt-2 mb-6 text-sm leading-6 text-muted">Buyer and seller accounts are open. Administrator access is issued separately.</p>
      <SignUpForm />
    </Suspense>
  );
}
