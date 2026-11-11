'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import type { AdminDashboard, BuyerDashboard, SellerDashboard } from '@/types/api';

function NextAction({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line border-l-4 border-l-teal-700 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Next step</p>
        <h2 className="mt-1 font-serif text-2xl text-navy-900">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{body}</p>
      </div>
      <Button href={href}>{action}</Button>
    </div>
  );
}

function sellerNext(data: SellerDashboard) {
  if (data.totalPractices === 0) return { title: 'Start with one practice', body: 'Save a draft first. Buyers cannot see it until an administrator approves the listing.', href: '/dashboard/seller/practices/new', action: 'Create a listing' };
  if (data.drafts > 0) return { title: 'A draft is still private', body: 'Finish the required fields, then submit it for review.', href: '/dashboard/seller/practices', action: 'Open your practices' };
  if (data.pending > 0) return { title: 'Waiting for review', body: 'An administrator has to approve the listing before it appears in the marketplace.', href: '/dashboard/seller/practices', action: 'Check status' };
  if (data.inquiries > 0) return { title: 'A buyer has written', body: 'Acknowledge the inquiry, then continue in the thread. An offer there is a proposal, not a sale.', href: '/dashboard/seller/inquiries', action: 'Read inquiries' };
  return { title: 'Your approved listings are live', body: 'Buyers can search them. Inquiries will show up here when someone introduces themselves.', href: '/dashboard/seller/practices', action: 'See your practices' };
}

function buyerNext(data: BuyerDashboard) {
  if (data.openInquiries > 0) return { title: 'Continue an open inquiry', body: 'Open the thread to message the seller or record a proposal. Document notes stay behind the confidentiality acknowledgement.', href: '/dashboard/buyer/inquiries', action: 'Open inquiries' };
  if (data.savedPractices > 0) return { title: 'Return to a saved practice', body: 'Saved listings stay here only while they remain approved.', href: '/dashboard/buyer/saved', action: 'Saved practices' };
  return { title: 'Find a practice', body: `${data.availableListings} approved ${data.availableListings === 1 ? 'listing is' : 'listings are'} open. Street addresses and owner phone numbers stay off the page.`, href: '/dashboard/buyer/explore', action: 'Explore practices' };
}

function Metrics({ items }: { items: { label: string; value: number; hint?: string }[] }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${items.length > 4 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
      {items.map((item) => (
        <Card key={item.label} className="h-full">
          <p className="text-sm text-muted">{item.label}</p>
          <p className="mt-1 font-serif text-3xl text-navy-900">{item.value}</p>
          {item.hint ? <p className="mt-2 text-sm text-muted">{item.hint}</p> : null}
        </Card>
      ))}
    </div>
  );
}

export function SellerOverview() {
  const [data, setData] = useState<SellerDashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ data: SellerDashboard }>('/api/dashboard').then((result) => setData(result.data)).catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Dashboard could not be loaded.'));
  }, []);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-6">
      <Metrics
        items={[
          { label: 'Practices', value: data.totalPractices, hint: data.totalPractices === 0 ? 'Create your first practice to begin.' : undefined },
          { label: 'Drafts', value: data.drafts },
          { label: 'Pending review', value: data.pending },
          { label: 'Approved', value: data.approved },
          { label: 'Inquiries', value: data.inquiries },
        ]}
      />
      <NextAction title={sellerNext(data).title} body={sellerNext(data).body} href={sellerNext(data).href} action={sellerNext(data).action} />
      <Card>
        <h2 className="font-serif text-2xl">Recent practices</h2>
        {data.recentPractices.length === 0 ? <p className="mt-3 text-sm text-muted">No practices yet.</p> : (
          <ul className="mt-4 divide-y divide-line">
            {data.recentPractices.map((practice) => (
              <li key={practice.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <a className="font-semibold text-teal-800" href={`/dashboard/seller/practices/${practice.id}`}>{practice.name}</a>
                <span className="text-muted">{labelFor(practice.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function BuyerOverview() {
  const [data, setData] = useState<BuyerDashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ data: BuyerDashboard }>('/api/dashboard').then((result) => setData(result.data)).catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Dashboard could not be loaded.'));
  }, []);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-6">
      <Metrics
        items={[
          { label: 'Available listings', value: data.availableListings },
          { label: 'Saved practices', value: data.savedPractices },
          { label: 'Inquiries sent', value: data.inquiries },
          { label: 'Open', value: data.openInquiries },
        ]}
      />
      <NextAction title={buyerNext(data).title} body={buyerNext(data).body} href={buyerNext(data).href} action={buyerNext(data).action} />
      <Card>
        <h2 className="font-serif text-2xl">Recent inquiries</h2>
        {data.recentInquiries.length === 0 ? <p className="mt-3 text-sm text-muted">You have not contacted a seller yet. Open a practice, then send one inquiry.</p> : (
          <ul className="mt-4 divide-y divide-line">
            {data.recentInquiries.map((inquiry) => (
              <li key={inquiry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <a className="font-semibold text-teal-800" href={`/dashboard/buyer/inquiries/${inquiry.id}`}>{inquiry.practice.name}</a>
                <span className="text-muted">{labelFor(inquiry.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function AdminOverview() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ data: AdminDashboard }>('/api/dashboard').then((result) => setData(result.data)).catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Dashboard could not be loaded.'));
  }, []);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-6">
      <Metrics
        items={[
          { label: 'Users', value: data.users },
          { label: 'Listings', value: data.listings },
          { label: 'Pending review', value: data.pending },
          { label: 'Approved', value: data.approved },
          { label: 'Inquiries', value: data.inquiries },
        ]}
      />
      {data.pending > 0 ? <NextAction title="Listings are waiting" body={`${data.pending} ${data.pending === 1 ? 'practice is' : 'practices are'} in review. Approve a listing before buyers can see it.`} href="/dashboard/admin/listings?status=PENDING_REVIEW" action="Review pending" /> : <NextAction title="The review queue is clear" body="New submissions will appear here. Approved practices are the only ones on the public marketplace." href="/dashboard/admin/listings" action="See all listings" />}
      <Card>
        <h2 className="font-serif text-2xl">Waiting for review</h2>
        {data.recentPending.length === 0 ? <p className="mt-3 text-sm text-muted">No listings are waiting for review.</p> : (
          <ul className="mt-4 divide-y divide-line">
            {data.recentPending.map((practice) => (
              <li key={practice.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <a className="font-semibold text-teal-800" href={`/dashboard/admin/listings/${practice.id}`}>{practice.name}</a>
                <span className="text-muted">{practice.owner?.name}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
