'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { SearchField } from '@/components/ui/search-field';
import { Skeleton } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import { formatDate, formatMoney, locationOf } from '@/lib/format';
import type { PageMeta, Practice, User } from '@/types/api';

export function AdminListings() {
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Practice[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) query.set('status', status);
    api<{ data: Practice[]; meta: PageMeta }>(`/api/admin/listings?${query.toString()}`)
      .then((result) => {
        if (!active) return;
        setRows(result.data);
        setMeta(result.meta);
        setError('');
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Listings could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, page]);

  if (loading) return <Skeleton className="h-64" />;
  if (error) return <ErrorState message={error} onRetry={() => setPage(page)} />;
  if (rows.length === 0) return <EmptyState title="No listings" description="Listings appear here after a seller saves or submits a practice." />;

  return (
    <div className="space-y-4">
      <Table
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { key: 'name', header: 'Practice', render: (row) => <a className="font-semibold text-teal-800" href={`/dashboard/admin/listings/${row.id}`}>{row.name}</a> },
          { key: 'category', header: 'Category', render: (row) => labelFor(row.category) },
          { key: 'location', header: 'Location', render: (row) => locationOf(row.city, row.state) },
          { key: 'status', header: 'Status', render: (row) => <Badge tone={statusTone(row.status)}>{labelFor(row.status)}</Badge> },
          { key: 'seller', header: 'Seller', render: (row) => row.owner?.name || '—' },
          { key: 'submitted', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
        ]}
      />
      {meta ? <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} /> : null}
    </div>
  );
}

export function AdminListingReview({ id }: { id: string }) {
  const { push } = useToast();
  const [listing, setListing] = useState<Practice | null>(null);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ data: { listing: Practice } }>(`/api/admin/listings/${id}`)
      .then((result) => {
        if (active) setListing(result.data.listing);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Listing could not be loaded.');
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  async function approve() {
    setWorking(true);
    try {
      const result = await api<{ data: { listing: Practice } }>(`/api/admin/listings/${id}/approve`, { method: 'POST', json: {} });
      setListing(result.data.listing);
      push('Listing approved.');
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'Approval failed.', 'error');
    } finally {
      setWorking(false);
    }
  }

  async function reject() {
    setWorking(true);
    try {
      const result = await api<{ data: { listing: Practice } }>(`/api/admin/listings/${id}/reject`, { method: 'POST', json: { reason } });
      setListing(result.data.listing);
      setOpen(false);
      push('Listing rejected.');
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'Rejection failed.', 'error');
    } finally {
      setWorking(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => { setError(''); setAttempt((value) => value + 1); }} />;
  if (!listing) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-4xl text-navy-900">{listing.name}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(listing.status)}>{labelFor(listing.status)}</Badge>
        <Badge>{labelFor(listing.category)}</Badge>
      </div>
      <Card className="grid gap-3 sm:grid-cols-2 text-sm">
        <p><span className="text-muted">Seller: </span>{listing.owner?.name} · {listing.owner?.email}</p>
        <p><span className="text-muted">Location: </span>{locationOf(listing.city, listing.state)}</p>
        <p><span className="text-muted">Transaction: </span>{labelFor(listing.transactionType)}{listing.ownershipPercentage ? ` · ${listing.ownershipPercentage}%` : ''}</p>
        <p><span className="text-muted">Price: </span>{formatMoney(listing.askingPrice, listing.priceVisibility)}</p>
      </Card>
      <Card className="space-y-4 text-sm leading-6">
        <p>{listing.description}</p>
        <p>{listing.facilityInfo}</p>
        <p>{listing.transitionReason}</p>
      </Card>
      {listing.status === 'PENDING_REVIEW' ? (
        <div className="flex gap-2">
          <Button type="button" loading={working} onClick={() => void approve()}>Approve</Button>
          <Button type="button" variant="danger" onClick={() => setOpen(true)}>Reject</Button>
        </div>
      ) : null}
      <Modal open={open} title="Reject this listing" onClose={() => setOpen(false)}>
        <Field label="Reason" htmlFor="reason" required hint="The seller will see this and can correct the listing.">
          <Textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" variant="danger" loading={working} onClick={() => void reject()}>Reject listing</Button>
        </div>
      </Modal>
    </div>
  );
}

export function AdminUsers() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (applied) params.set('q', applied);
    api<{ data: User[] }>(`/api/admin/users?${params.toString()}`)
      .then((result) => {
        if (!active) return;
        setUsers(result.data);
        setError('');
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Users could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applied]);

  return (
    <div className="space-y-4">
      <form className="flex max-w-md gap-2" onSubmit={(event) => { event.preventDefault(); setApplied(query); }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search name or email" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      {loading ? <Skeleton className="h-48" /> : null}
      {error ? <ErrorState message={error} onRetry={() => setApplied(applied)} /> : null}
      {!loading && !error && users.length === 0 ? <EmptyState title="No users" description="Registered accounts will appear here." /> : null}
      {!loading && !error && users.length > 0 ? (
        <Table
          rows={users}
          rowKey={(row) => row.id}
          columns={[
            { key: 'name', header: 'Name', render: (row) => row.name },
            { key: 'email', header: 'Email', render: (row) => row.email },
            { key: 'role', header: 'Role', render: (row) => row.role },
            { key: 'joined', header: 'Joined', render: (row) => formatDate(row.createdAt) },
          ]}
        />
      ) : null}
    </div>
  );
}
