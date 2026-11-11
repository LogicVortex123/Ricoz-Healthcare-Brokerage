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
import { Journey } from '@/components/ui/journey';
import { DealRoom } from '@/features/deals/deal-room';
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
    <div className="motion-slide mx-auto max-w-5xl space-y-5">
      <Breadcrumbs items={[{ label: 'Practices', href: '/practices' }, { label: listing.name }]} />
      <div className="rounded-xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{labelFor(listing.category)}</Badge>
              <Badge>{labelFor(listing.transactionType)}</Badge>
            </div>
            <h1 className="mt-3 font-serif text-3xl text-navy-900 sm:text-4xl">{listing.name}</h1>
            <p className="mt-2 text-sm text-muted">{listing.specialty || 'Specialty not specified'} · {locationOf(listing.city, listing.state)}</p>
            {listing.listedAt ? <p className="mt-1 text-sm text-muted">Approved {formatDate(listing.listedAt)}</p> : null}
          </div>
          <p className="font-serif text-3xl text-navy-900">{formatMoney(listing.askingPrice, listing.priceVisibility)}</p>
        </div>
      </div>
      <Journey
        label="How to proceed"
        steps={buyerSteps(Boolean(user), user?.role === 'BUYER', Boolean(inquiry))}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Fact label="Years operating" value={listing.yearsInOperation?.toString() ?? '—'} />
        <Fact label="Practitioners" value={listing.practitionerCount?.toString() ?? '—'} />
        <Fact label="Ownership offered" value={listing.ownershipPercentage ? `${listing.ownershipPercentage}%` : labelFor(listing.ownershipType)} />
      </div>
      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-serif text-2xl text-navy-900">About the practice</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{listing.description}</p>
      </section>
      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-serif text-2xl text-navy-900">Facility</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{listing.facilityInfo}</p>
      </section>
      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-serif text-2xl text-navy-900">Transition</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{listing.transitionReason}</p>
        <p className="mt-4 text-base leading-7 text-muted">The owner’s direct contact details and street address are not published. Use an inquiry to introduce yourself.</p>
      </section>
      {user ? <DealRoom practiceId={id} /> : null}
      <Card>
        <h2 className="font-serif text-2xl text-navy-900">Express interest</h2>
        {user?.role === 'BUYER' && inquiry ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6">Your inquiry is {labelFor(inquiry.status).toLowerCase()}. The seller can see your name and email. Messages and offers stay on the thread.</p>
            <Button href={`/dashboard/buyer/inquiries/${inquiry.id}`}>Continue in the thread</Button>
          </div>
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

function buyerSteps(signedIn: boolean, isBuyer: boolean, hasInquiry: boolean) {
  const inquire = !signedIn ? 'Sign in with a buyer account to introduce yourself.' : isBuyer ? (hasInquiry ? 'The seller has your name and email.' : 'One message is enough to start.') : 'Inquiries are sent from a buyer account.';
  return [
    { label: 'Read the listing', detail: 'You see the city and region, not a street address or the owner’s phone.', state: 'done' as const },
    { label: 'Send one inquiry', detail: inquire, state: hasInquiry ? 'done' as const : 'current' as const },
    { label: 'Use the deal room', detail: 'Notes, the worksheet, and the closing list open after the confidentiality acknowledgement.', state: hasInquiry ? 'current' as const : 'upcoming' as const },
    { label: 'Record a proposal', detail: 'Messages and offers stay on the inquiry thread. An accepted offer does not transfer ownership.', state: 'upcoming' as const },
  ];
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-serif text-2xl text-navy-900">{value}</p>
    </div>
  );
}
