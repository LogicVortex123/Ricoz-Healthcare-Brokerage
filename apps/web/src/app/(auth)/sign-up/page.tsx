import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignUpForm } from '@/features/auth/sign-up-form';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <>
      <h1 className="font-serif text-4xl text-navy-900">Create an account</h1>
      <p className="mt-2 mb-6 text-base leading-7 text-muted">Choose buyer or seller. Administrator and broker access is issued separately, so those roles do not appear here.</p>
      <Suspense fallback={<p className="text-sm text-muted">Loading registration…</p>}>
        <SignUpForm />
      </Suspense>
    </>
  );
}
