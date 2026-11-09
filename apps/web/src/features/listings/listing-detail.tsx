'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/auth-provider';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import { formatDate, formatMoney, locationOf } from '@/lib/format';
import type { Inquiry, Practice } from '@/types/api';

export function ListingDetail({ id }: { id: string }) {
  const { user, status } = useAuth();
  const { push } = useToast();
  const [listing, setListing] = useState<Practice | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  function load() {
    setLoading(true);
    api<{ data: { listing: Practice } }>(`/api/listings/${id}`)
      .then(async (result) => {
        setListing(result.data.listing);
        setError('');
        if (user?.role === 'BUYER') {
          const existing = await api<{ data: Inquiry[] }>(`/api/inquiries?practiceId=${id}`);
          setInquiry(existing.data.find((item) => item.status !== 'CLOSED') ?? existing.data[0] ?? null);
        }
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'This listing could not be loaded.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // The listing id and buyer session determine what can be loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  async function submitInquiry(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      const result = await api<{ data: { inquiry: Inquiry } }>('/api/inquiries', { method: 'POST', json: { practiceId: id, message } });
      setInquiry(result.data.inquiry);
      setMessage('');
      push('Inquiry sent to the seller.');
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'The inquiry could not be sent.', 'error');
    } finally {
      setSending(false);
    }
  }

  if (loading || status === 'loading') return <Skeleton className="h-80" />;
  if (error || !listing) return <ErrorState title="Listing unavailable" message={error || 'This listing is not public.'} />;

  return (
    <div className="motion-slide mx-auto max-w-5xl space-y-6">
      <Breadcrumbs items={[{ label: 'Practices', href: '/practices' }, { label: listing.name }]} />
      <div className="reveal rounded-3xl bg-gradient-to-br from-navy-900 via-coral-700 to-sky-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">{labelFor(listing.category)}</Badge>
          <Badge>{labelFor(listing.transactionType)}</Badge>
        </div>
        <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{listing.name}</h1>
        <p className="mt-3 text-lg text-sand-100">{listing.specialty || 'Specialty not specified'} · {locationOf(listing.city, listing.state)}</p>
        <p className="mt-5 font-serif text-4xl text-gold-100">{formatMoney(listing.askingPrice, listing.priceVisibility)}</p>
        {listing.listedAt ? <p className="mt-2 text-sm text-sand-100">Approved {formatDate(listing.listedAt)}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Fact label="Years operating" value={listing.yearsInOperation?.toString() ?? '—'} tone="teal" />
        <Fact label="Practitioners" value={listing.practitionerCount?.toString() ?? '—'} tone="gold" />
        <Fact label="Ownership offered" value={listing.ownershipPercentage ? `${listing.ownershipPercentage}%` : labelFor(listing.ownershipType)} tone="coral" />
      </div>
      <section className="reveal rounded-2xl border border-teal-700/25 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="font-serif text-3xl text-navy-900">About the practice</h2>
        <p className="mt-3 whitespace-pre-wrap text-base leading-8">{listing.description}</p>
      </section>
      <section className="reveal rounded-2xl border border-sky-700/25 bg-sky-100/50 p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="font-serif text-3xl text-navy-900">Facility</h2>
        <p className="mt-3 whitespace-pre-wrap text-base leading-8">{listing.facilityInfo}</p>
      </section>
      <section className="reveal rounded-2xl border border-coral-700/25 bg-coral-100/60 p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="font-serif text-3xl text-navy-900">Transition</h2>
        <p className="mt-3 whitespace-pre-wrap text-base leading-8">{listing.transitionReason}</p>
        <p className="mt-4 text-base leading-7 text-muted">The owner’s direct contact details and street address are not published. Use an inquiry to introduce yourself.</p>
      </section>
      <Card className="border-teal-700/30 bg-teal-100">
        <h2 className="font-serif text-3xl text-navy-900">Express interest</h2>
        {user?.role === 'BUYER' && inquiry ? (
          <p className="mt-3 text-sm leading-6">Your inquiry is {labelFor(inquiry.status).toLowerCase()}. The seller can see your name and email.</p>
        ) : null}
        {user?.role === 'BUYER' && !inquiry ? (
          <form className="mt-4 space-y-4" onSubmit={submitInquiry}>
            <Field label="Message" htmlFor="message" required hint="Your name and email will be shared with the seller. Do not include patient information.">
              <Textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} minLength={20} required />
            </Field>
            <Button type="submit" loading={sending}>Send inquiry</Button>
          </form>
        ) : null}
        {!user ? (
          <div className="mt-4">
            <p className="text-sm text-muted">Sign in with a buyer account to send an inquiry.</p>
            <Button className="mt-3" href={`/sign-in?next=${encodeURIComponent(`/practices/${id}`)}`}>Sign in</Button>
          </div>
        ) : null}
        {user && user.role !== 'BUYER' && !inquiry ? <p className="mt-3 text-sm text-muted">Inquiries can be sent from a buyer account.</p> : null}
      </Card>
    </div>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone: 'teal' | 'gold' | 'coral' }) {
  const tones = {
    teal: 'bg-teal-100',
    gold: 'bg-gold-100',
    coral: 'bg-coral-100',
  };
  return (
    <div className={`reveal rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-md ${tones[tone]}`}>
      <p className="text-xs font-bold tracking-wide text-navy-800 uppercase">{label}</p>
      <p className="mt-2 font-serif text-3xl text-navy-900">{value}</p>
    </div>
  );
}
