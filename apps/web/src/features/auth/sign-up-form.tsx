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

export function SignUpForm() {
  const params = useSearchParams();
  const initialRole = params.get('role') === 'SELLER' ? 'SELLER' : 'BUYER';
  const [role, setRole] = useState<'SELLER' | 'BUYER'>(initialRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ data: { user: User } }>('/api/auth/register', {
        method: 'POST',
        json: {
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
          role,
        },
      });
      setUser(result.data.user);
      push('Account created.');
      router.push(safeNext(params.get('next'), result.data.user.role));
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : 'Registration failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold text-ink">I am here to</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            ['SELLER', 'Sell or transition a practice'],
            ['BUYER', 'Buy or invest in a practice'],
          ].map(([value, text]) => (
            <label key={value} className={`cursor-pointer rounded-lg border px-3 py-3 text-sm ${role === value ? 'border-teal-700 bg-teal-100' : 'border-line bg-white'}`}>
              <input className="sr-only" type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value as 'SELLER' | 'BUYER')} />
              {text}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Full name" htmlFor="name" required>
        <Input name="name" autoComplete="name" required minLength={2} maxLength={80} />
      </Field>
      <Field label="Email" htmlFor="email" required>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" required hint="At least 10 characters, with one letter and one number.">
        <Input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} />
      </Field>
      {error ? <p role="alert" className="text-sm text-danger-700">{error}</p> : null}
      <Button type="submit" loading={loading} className="w-full">
        Create account
      </Button>
      <p className="text-sm text-muted">
        Already registered? <Link className="font-semibold text-teal-800" href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
