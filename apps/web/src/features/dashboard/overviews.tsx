'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import type { AdminDashboard, BuyerDashboard, SellerDashboard } from '@/types/api';

function Metrics({ items }: { items: { label: string; value: number; hint?: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <Card key={item.label} className={['h-full border-teal-700/25 bg-teal-100', 'h-full border-coral-700/25 bg-coral-100', 'h-full border-gold-700/30 bg-gold-100', 'h-full border-sky-700/25 bg-sky-100'][index % 4]} style={{ transitionDelay: `${index * 80}ms` }}>
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-2 font-serif text-4xl text-navy-900">{item.value}</p>
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
          { label: 'Inquiries sent', value: data.inquiries },
          { label: 'Open', value: data.openInquiries },
          { label: 'Acknowledged', value: data.acknowledgedInquiries },
        ]}
      />
      <Card>
        <h2 className="font-serif text-2xl">Recent inquiries</h2>
        {data.recentInquiries.length === 0 ? <p className="mt-3 text-sm text-muted">You have not contacted a seller yet.</p> : (
          <ul className="mt-4 divide-y divide-line">
            {data.recentInquiries.map((inquiry) => (
              <li key={inquiry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <a className="font-semibold text-teal-800" href={`/practices/${inquiry.practice.id}`}>{inquiry.practice.name}</a>
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
