'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import { formatMoney, locationOf } from '@/lib/format';

type Row = { id: string; name: string; category: string; city: string; state: string; askingPrice: number | null; priceVisibility: string };

export function SavedList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<{ data: Row[] }>('/api/deals/saved')
      .then((result) => {
        setRows(result.data);
        setError('');
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Saved practices could not be loaded.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (rows.length === 0) return <EmptyState title="Nothing saved yet" description="Save an approved practice from its listing to keep it here." action={<Button href="/dashboard/buyer/explore">Explore practices</Button>} />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.id} className="flex h-full flex-col">
          <p className="text-xs font-bold tracking-[0.14em] text-teal-800 uppercase">{labelFor(row.category)}</p>
          <h2 className="mt-2 font-serif text-2xl text-navy-900">{row.name}</h2>
          <p className="mt-1 text-sm text-muted">{locationOf(row.city, row.state)}</p>
          <p className="mt-4 font-serif text-2xl text-navy-900">{formatMoney(row.askingPrice, row.priceVisibility)}</p>
          <Button className="mt-auto pt-4" href={`/practices/${row.id}`} variant="secondary">Open listing</Button>
        </Card>
      ))}
    </div>
  );
}
