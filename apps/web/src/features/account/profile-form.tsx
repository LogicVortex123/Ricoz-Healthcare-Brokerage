'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/auth-provider';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/types/api';

export function ProfileForm() {
  const { user, setUser } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const result = await api<{ data: { user: User } }>('/api/users/me', {
        method: 'PATCH',
        json: {
          name: form.get('name'),
          phone: form.get('phone'),
          organization: form.get('organization'),
          city: form.get('city'),
          state: form.get('state'),
          bio: form.get('bio'),
        },
      });
      setUser(result.data.user);
      push('Profile saved.');
      router.refresh();
    } catch (error) {
      push(error instanceof ApiError ? error.message : 'Profile could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4" noValidate>
      <Field label="Name" htmlFor="name" required>
        <Input name="name" defaultValue={user.name} required minLength={2} maxLength={80} />
      </Field>
      <Field label="Email" htmlFor="email" hint="Email changes are not available in this release.">
        <Input name="email" defaultValue={user.email} readOnly />
      </Field>
      <Field label="Phone" htmlFor="phone" hint="Optional. Sellers only see this if you send an inquiry.">
        <Input name="phone" defaultValue={user.phone} maxLength={30} />
      </Field>
      <Field label="Organization" htmlFor="organization">
        <Input name="organization" defaultValue={user.organization} maxLength={120} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="city">
          <Input name="city" defaultValue={user.city} maxLength={80} />
        </Field>
        <Field label="State or region" htmlFor="state">
          <Input name="state" defaultValue={user.state} maxLength={80} />
        </Field>
      </div>
      <Field label="Short introduction" htmlFor="bio">
        <Textarea name="bio" defaultValue={user.bio} maxLength={1000} />
      </Field>
      <Button type="submit" loading={saving}>Save profile</Button>
    </form>
  );
}
