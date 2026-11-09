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
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs items={[{ label: 'Practices', href: '/practices' }, { label: listing.name }]} />
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">{labelFor(listing.category)}</Badge>
          <Badge>{labelFor(listing.transactionType)}</Badge>
        </div>
        <h1 className="mt-3 font-serif text-4xl text-navy-900">{listing.name}</h1>
        <p className="mt-2 text-muted">{listing.specialty || 'Specialty not specified'} · {locationOf(listing.city, listing.state)}</p>
        <p className="mt-4 font-serif text-3xl text-navy-900">{formatMoney(listing.askingPrice, listing.priceVisibility)}</p>
        {listing.listedAt ? <p className="mt-1 text-xs text-muted">Approved {formatDate(listing.listedAt)}</p> : null}
      </div>
      <Card className="grid gap-4 sm:grid-cols-3">
        <Fact label="Years operating" value={listing.yearsInOperation?.toString() ?? '—'} />
        <Fact label="Practitioners" value={listing.practitionerCount?.toString() ?? '—'} />
        <Fact label="Ownership offered" value={listing.ownershipPercentage ? `${listing.ownershipPercentage}%` : labelFor(listing.ownershipType)} />
      </Card>
      <section>
        <h2 className="font-serif text-2xl">About the practice</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{listing.description}</p>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Facility</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{listing.facilityInfo}</p>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Transition</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{listing.transitionReason}</p>
        <p className="mt-3 text-sm text-muted">The owner’s direct contact details and street address are not published. Use an inquiry to introduce yourself.</p>
      </section>
      <Card>
        <h2 className="font-serif text-2xl">Express interest</h2>
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
