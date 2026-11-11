'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import { locationOf } from '@/lib/format';

type Row = { id: string; name: string; category: string; city: string; state: string; status: string; openInquiries: number };

export function BrokerDesk() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<{ data: Row[] }>('/api/deals/broker')
      .then((result) => {
        setRows(result.data);
        setError('');
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Assignments could not be loaded.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (rows.length === 0) {
    return <EmptyState title="No assignments yet" description="An administrator assigns a practice to you. Until then, this desk stays empty." />;
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <Card key={row.id} interactive>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-navy-900">{row.name}</h2>
              <p className="text-sm text-muted">{labelFor(row.category)} · {locationOf(row.city, row.state)} · {labelFor(row.status)}</p>
              <p className="mt-1 text-sm">{row.openInquiries} open {row.openInquiries === 1 ? 'inquiry' : 'inquiries'}</p>
            </div>
            <Button href={`/dashboard/broker/practices/${row.id}`} variant="secondary">Open deal room</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
