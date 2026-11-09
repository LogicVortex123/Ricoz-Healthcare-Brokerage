import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignInForm } from '@/features/auth/sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading sign in…</p>}>
      <h1 className="font-serif text-4xl text-navy-900">Sign in</h1>
      <p className="mt-2 mb-6 text-base leading-7 text-muted">Use the email and password for your PracticeBridge account.</p>
      <SignInForm />
    </Suspense>
  );
}
