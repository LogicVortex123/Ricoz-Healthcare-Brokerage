'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { Journey } from '@/components/ui/journey';
import { DealRoom } from '@/features/deals/deal-room';
import { api, ApiError } from '@/lib/api';
import { labelFor } from '@/lib/constants';
import { formatDate, formatMoney, locationOf } from '@/lib/format';
import type { Practice } from '@/types/api';

const tabs = [
  { id: 'ALL', label: 'All' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'PENDING_REVIEW', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
];

export function PracticeList() {
  const [status, setStatus] = useState('ALL');
  const [practices, setPractices] = useState<Practice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const query = status === 'ALL' ? '' : `?status=${status}`;
    api<{ data: Practice[] }>(`/api/practices/mine${query}`)
      .then((result) => {
        setPractices(result.data);
        setError('');
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Practices could not be loaded.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="space-y-5">
      <Tabs tabs={tabs} value={status} onChange={setStatus} label="Practice status" />
      {loading ? <Skeleton className="h-40" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && practices.length === 0 ? (
        <EmptyState
          title="No practices in this view"
          description="A saved draft stays private. Buyers only see a practice after an administrator approves it."
          action={<Button href="/dashboard/seller/practices/new">Create listing</Button>}
        />
      ) : null}
      <div className="space-y-3">
        {!loading && !error
          ? practices.map((practice) => (
              <Card key={practice.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-xl text-navy-900">{practice.name}</h2>
                    <Badge tone={statusTone(practice.status)}>{labelFor(practice.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {labelFor(practice.category)} · {locationOf(practice.city, practice.state)} · {formatMoney(practice.askingPrice, practice.priceVisibility)}
                  </p>
                  <p className="mt-1 text-xs text-muted">Updated {formatDate(practice.updatedAt)}</p>
                </div>
                <Button href={`/dashboard/seller/practices/${practice.id}`} variant="secondary" size="sm">
                  {practice.status === 'DRAFT' || practice.status === 'REJECTED' ? 'Continue' : 'Open'}
                </Button>
              </Card>
            ))
          : null}
      </div>
    </div>
  );
}

export function PracticeDetail({ id }: { id: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [practice, setPractice] = useState<Practice | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  function load() {
    setLoading(true);
    api<{ data: { practice: Practice } }>(`/api/practices/${id}`)
      .then((result) => {
        setPractice(result.data.practice);
        setError('');
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'This practice could not be loaded.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(path: string, success: string) {
    setWorking(true);
    try {
      const result = await api<{ data: { practice: Practice } }>(path, { method: 'POST', json: {} });
      setPractice(result.data.practice);
      push(success);
      router.refresh();
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'The action could not be completed.', 'error');
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <Skeleton className="h-64" />;
  if (error || !practice) return <ErrorState message={error || 'Practice not found.'} onRetry={load} />;

  const editable = practice.status === 'DRAFT' || practice.status === 'REJECTED' || practice.status === 'WITHDRAWN';
  const canWithdraw = practice.status === 'PENDING_REVIEW' || practice.status === 'APPROVED';

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-4xl text-navy-900">{practice.name}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(practice.status)}>{labelFor(practice.status)}</Badge>
        <Badge>{labelFor(practice.category)}</Badge>
        <Badge>{labelFor(practice.transactionType)}</Badge>
      </div>
      <Journey label="Listing progress" steps={sellerSteps(practice.status)} />
      {practice.status === 'REJECTED' && practice.rejectionReason ? (
        <div className="rounded-xl border border-danger-100 bg-danger-100/40 p-4 text-sm text-danger-700">
          <p className="font-semibold">Changes requested</p>
          <p className="mt-1">{practice.rejectionReason}</p>
        </div>
      ) : null}
      <Card className="grid gap-4 sm:grid-cols-2">
        <Detail label="Location" value={locationOf(practice.city, practice.state)} />
        <Detail label="Specialty" value={practice.specialty || '—'} />
        <Detail label="Price" value={formatMoney(practice.askingPrice, practice.priceVisibility)} />
        <Detail label="Ownership" value={practice.ownershipPercentage ? `${labelFor(practice.ownershipType)} · ${practice.ownershipPercentage}% proposed` : labelFor(practice.ownershipType)} />
        <Detail label="Years in operation" value={practice.yearsInOperation?.toString() ?? '—'} />
        <Detail label="Practitioners" value={practice.practitionerCount?.toString() ?? '—'} />
      </Card>
      <Card>
        <h2 className="font-serif text-2xl">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{practice.description || 'No description yet.'}</p>
        <h3 className="mt-6 font-serif text-xl">Facility</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{practice.facilityInfo || 'No facility notes yet.'}</p>
        <h3 className="mt-6 font-serif text-xl">Transition reason</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{practice.transitionReason || 'No reason recorded yet.'}</p>
      </Card>
      <Card>
        <h2 className="font-serif text-2xl">History</h2>
        <ol className="mt-4 space-y-3">
          {(practice.statusHistory ?? []).map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="text-sm">
              <span className="font-semibold">{labelFor(entry.status)}</span>
              <span className="text-muted"> · {formatDate(entry.at)}</span>
              {entry.note ? <p className="text-muted">{entry.note}</p> : null}
            </li>
          ))}
        </ol>
      </Card>
      <DealRoom practiceId={practice.id} />
      <div className="flex flex-wrap gap-2">
        {editable ? <Button href={`/dashboard/seller/practices/${practice.id}/edit`}>Edit</Button> : null}
        {editable ? (
          <Button type="button" variant="secondary" loading={working} onClick={() => void act(`/api/practices/${practice.id}/submit`, 'Submitted for review.')}>
            Submit for review
          </Button>
        ) : null}
        {canWithdraw ? (
          <Button type="button" variant="secondary" loading={working} onClick={() => void act(`/api/practices/${practice.id}/withdraw`, 'Listing withdrawn.')}>
            Withdraw
          </Button>
        ) : null}
        {practice.status === 'APPROVED' ? (
          <Button href={`/practices/${practice.id}`} variant="ghost">
            View public listing
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function sellerSteps(status: Practice['status']) {
  const stage = status === 'PENDING_REVIEW' ? 1 : status === 'APPROVED' ? 3 : 0;
  const details = [
    status === 'REJECTED'
      ? 'The reviewer sent a reason. Edit the listing, then submit it again.'
      : status === 'WITHDRAWN'
        ? 'This listing is withdrawn. Edit it and submit again when you are ready.'
        : 'Only you can see a draft. Submit it when the required fields are complete.',
    'An administrator checks the listing. Buyers cannot see it yet.',
    'After approval, buyers can search the city and region. The street address stays off the page.',
    'Notes, the worksheet, and the closing list stay with the people allowed to see this practice.',
  ];
  const labels = ['Draft', 'Review', 'Marketplace', 'Deal room'];
  return labels.map((label, index) => ({
    label,
    detail: details[index],
    state: index < stage ? 'done' as const : index === stage ? 'current' as const : 'upcoming' as const,
  }));
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}
