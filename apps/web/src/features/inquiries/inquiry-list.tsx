'use client';

import { useEffect, useState } from 'react';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import { formatDate, locationOf } from '@/lib/format';
import type { Inquiry } from '@/types/api';

export function InquiryList({ audience }: { audience: 'buyer' | 'seller' | 'admin' }) {
  const { push } = useToast();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const path = audience === 'admin' ? '/api/admin/inquiries' : '/api/inquiries';
    api<{ data: Inquiry[] }>(path)
      .then((result) => {
        if (!active) return;
        setItems(result.data);
        setError('');
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof ApiError ? caught.message : 'Inquiries could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [audience, reloadKey]);

  async function update(id: string, status: 'ACKNOWLEDGED' | 'CLOSED') {
    try {
      const result = await api<{ data: { inquiry: Inquiry } }>(`/api/inquiries/${id}`, { method: 'PATCH', json: { status } });
      setItems((current) => current.map((item) => (item.id === id ? { ...item, ...result.data.inquiry } : item)));
      push(status === 'CLOSED' ? 'Inquiry closed.' : 'Inquiry acknowledged.');
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'The inquiry could not be updated.', 'error');
    }
  }

  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />;
  if (items.length === 0) {
    return (
      <EmptyState
        title="No inquiries yet"
        description={audience === 'buyer' ? 'When you contact a seller, the inquiry and its status will appear here.' : 'Inquiries from buyers will appear here after a listing is approved and someone expresses interest.'}
        action={audience === 'buyer' ? <Button href="/dashboard/buyer/explore">Explore practices</Button> : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <a className="font-serif text-2xl text-navy-900" href={`/practices/${item.practice.id}`}>{item.practice.name}</a>
              <p className="text-sm text-muted">{labelFor(item.practice.category)} · {locationOf(item.practice.city, item.practice.state)} · {formatDate(item.createdAt)}</p>
            </div>
            <Badge tone={statusTone(item.status)}>{labelFor(item.status)}</Badge>
          </div>
          <blockquote className="mt-4 rounded-xl bg-sand-50 px-4 py-3 text-sm leading-6 text-ink">“{item.message}”</blockquote>
          {item.buyer ? (
            <p className="mt-3 text-sm text-muted">
              {item.buyer.name} · {item.buyer.email}
              {item.buyer.organization ? ` · ${item.buyer.organization}` : ''}
              {item.buyer.city ? ` · ${locationOf(item.buyer.city, item.buyer.state)}` : ''}
            </p>
          ) : null}
          {item.seller ? <p className="mt-2 text-sm text-muted">Seller: {item.seller.name} · {item.seller.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href={`${audience === 'admin' ? '/dashboard/admin/inquiries' : audience === 'seller' ? '/dashboard/seller/inquiries' : '/dashboard/buyer/inquiries'}/${item.id}`} size="sm">Open thread</Button>
            {audience === 'seller' && item.status !== 'CLOSED' ? (
              <>
                {item.status === 'OPEN' ? <Button type="button" size="sm" onClick={() => void update(item.id, 'ACKNOWLEDGED')}>Acknowledge</Button> : null}
                <Button type="button" size="sm" variant="ghost" onClick={() => void update(item.id, 'CLOSED')}>Close</Button>
              </>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
