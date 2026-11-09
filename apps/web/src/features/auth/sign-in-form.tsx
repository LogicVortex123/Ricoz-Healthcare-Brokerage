'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/auth-provider';
import { api, ApiError } from '@/lib/api';
import { safeNext } from '@/lib/constants';
import type { User } from '@/types/api';

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const { push } = useToast();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ data: { user: User } }>('/api/auth/login', {
        method: 'POST',
        json: { email: form.get('email'), password: form.get('password') },
      });
      setUser(result.data.user);
      router.push(safeNext(params.get('next'), result.data.user.role));
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : 'Sign-in failed.';
      setError(message);
      push(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error ? <p role="alert" className="text-sm text-danger-700">{error}</p> : null}
      <Button type="submit" loading={loading} className="w-full">
        Sign in
      </Button>
      <p className="text-sm text-muted">
        New to PracticeBridge? <Link className="font-semibold text-teal-800" href={`/sign-up${params.get('next') ? `?next=${encodeURIComponent(params.get('next') as string)}` : ''}`}>Create an account</Link>
      </p>
      <p className="text-xs leading-5 text-muted">Password recovery is not available in this release because no email service is connected.</p>
    </form>
  );
}
