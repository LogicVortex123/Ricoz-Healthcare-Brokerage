'use client';

import { useEffect, useState } from 'react';
import { Bookmark, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/auth-provider';
import { api, ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';

type Note = { id: string; title: string; kind: string; body: string };
type Task = { id: string; label: string; done: boolean };
type Worksheet = {
  revenue: number;
  operatingExpenses: number;
  ownerAddBack: number;
  earnings: number;
  multipleLow: number;
  multipleHigh: number;
  rangeLow: number;
  rangeHigh: number;
  formula: string;
  disclaimer: string;
};
type Commission = { amount: number; note: string; chargesCard: false; notice: string };
type Bundle = {
  access: 'nda_required' | 'open' | 'none';
  saved: boolean;
  statement: string;
  notes?: Note[];
  worksheet?: Worksheet | null;
  tasks?: Task[];
  broker?: { id: string; name: string } | null;
  commission?: Commission | null;
};

const kinds = [
  ['FINANCIAL', 'Financial'],
  ['LEASE', 'Lease'],
  ['STAFFING', 'Staffing'],
  ['OTHER', 'Other'],
] as const;

export function DealRoom({ practiceId }: { practiceId: string }) {
  const { user, status } = useAuth();
  const { push } = useToast();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<(typeof kinds)[number][0]>('FINANCIAL');
  const [body, setBody] = useState('');
  const [task, setTask] = useState('');
  const [figures, setFigures] = useState({ revenue: '', operatingExpenses: '', ownerAddBack: '', multipleLow: '2', multipleHigh: '3' });
  const [brokers, setBrokers] = useState<Array<{ id: string; name: string }>>([]);
  const [brokerId, setBrokerId] = useState('');
  const [commission, setCommission] = useState({ amount: '', note: '' });

  function load() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<{ data: Bundle }>(`/api/deals/practices/${practiceId}`)
      .then((result) => {
        setBundle(result.data);
        setError('');
        const sheet = result.data.worksheet;
        if (sheet) {
          setFigures({
            revenue: String(sheet.revenue),
            operatingExpenses: String(sheet.operatingExpenses),
            ownerAddBack: String(sheet.ownerAddBack),
            multipleLow: String(sheet.multipleLow),
            multipleHigh: String(sheet.multipleHigh),
          });
        }
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'The deal room could not be loaded.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status !== 'ready') return;
    load();
    // The practice id and signed-in role decide the room. load is recreated each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId, status, user?.id, user?.role]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    api<{ data: Array<{ id: string; name: string }> }>('/api/deals/brokers')
      .then((result) => setBrokers(result.data))
      .catch(() => setBrokers([]));
  }, [user?.role]);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      push(success);
      load();
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'That action could not be completed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (status !== 'ready' || loading) return <Skeleton className="h-48" />;
  if (!user) return null;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!bundle || bundle.access === 'none') return null;

  const ownerTools = user.role === 'SELLER' || user.role === 'ADMIN';
  const staffTools = user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'BROKER';

  return (
    <section className="space-y-4">
      <div className="border-b border-line pb-4">
        <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Deal room</p>
        <h2 className="mt-1 font-serif text-2xl text-navy-900">Confidential transition work</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Notes, a figure worksheet, and a closing list stay with the people allowed to see this practice. Nothing here transfers ownership.</p>
      </div>

      {user.role === 'BUYER' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
          <p className="text-sm text-ink">{bundle.saved ? 'Saved to your list.' : 'Save this practice to return to it later.'}</p>
          <Button
            type="button"
            variant="secondary"
            loading={busy}
            onClick={() => void run(async () => {
              await api(`/api/deals/practices/${practiceId}/save`, { method: bundle.saved ? 'DELETE' : 'POST' });
            }, bundle.saved ? 'Removed from saved practices.' : 'Practice saved.')}
          >
            <Bookmark className="h-4 w-4" /> {bundle.saved ? 'Unsave' : 'Save practice'}
          </Button>
        </div>
      ) : null}

      {bundle.access === 'nda_required' ? (
        <Card className="border-coral-700">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-1 h-5 w-5 text-coral-700" />
            <div>
              <h3 className="font-serif text-2xl text-navy-900">Confidentiality acknowledgement</h3>
              <p className="mt-3 text-sm leading-6 text-ink">{bundle.statement}</p>
              <Button className="mt-4" type="button" loading={busy} onClick={() => void run(async () => {
                await api('/api/deals/ndas', { method: 'POST', json: { practiceId } });
              }, 'Acknowledgement recorded.')}>
                <ShieldCheck className="h-4 w-4" /> I acknowledge
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="font-serif text-2xl text-navy-900">Document notes</h3>
            <p className="mt-1 text-sm text-muted">{ownerTools ? 'Write the confidential summary here. Do not paste patient information.' : 'These notes opened after your acknowledgement. Do not share them, and do not add patient information.'}</p>
            <div className="mt-4 space-y-3">
              {(bundle.notes ?? []).length === 0 ? <p className="text-sm text-muted">No notes yet.</p> : null}
              {(bundle.notes ?? []).map((note) => (
                <article key={note.id} className="rounded-xl bg-sand-50 p-4">
                  <p className="text-xs font-bold tracking-wide text-teal-800 uppercase">{note.kind}</p>
                  <h4 className="mt-1 font-semibold text-navy-900">{note.title}</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{note.body}</p>
                </article>
              ))}
            </div>
            {ownerTools ? (
              <form className="mt-4 grid gap-3" onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await api(`/api/deals/practices/${practiceId}/notes`, { method: 'POST', json: { title, kind, body } });
                  setTitle('');
                  setBody('');
                }, 'Note added.');
              }}>
                <Field label="Title" htmlFor="note-title" required>
                  <Input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
                </Field>
                <Field label="Kind" htmlFor="note-kind">
                  <Select id="note-kind" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
                    {kinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                </Field>
                <Field label="Note" htmlFor="note-body" required>
                  <Textarea id="note-body" value={body} onChange={(event) => setBody(event.target.value)} required minLength={10} />
                </Field>
                <Button type="submit" loading={busy}>Add note</Button>
              </form>
            ) : null}
          </Card>

          <Card>
            <h3 className="font-serif text-2xl text-navy-900">Figure worksheet</h3>
            {bundle.worksheet ? (
              <div className="mt-3">
                <p className="font-serif text-3xl text-navy-900">{formatMoney(bundle.worksheet.rangeLow, 'PUBLIC')} – {formatMoney(bundle.worksheet.rangeHigh, 'PUBLIC')}</p>
                <p className="mt-2 text-sm leading-6">{bundle.worksheet.formula}</p>
                <p className="mt-2 text-sm leading-6 text-navy-800">{bundle.worksheet.disclaimer}</p>
              </div>
            ) : <p className="mt-2 text-sm text-muted">No worksheet yet.</p>}
            {user.role === 'SELLER' ? (
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await api(`/api/deals/practices/${practiceId}/worksheet`, {
                    method: 'PUT',
                    json: {
                      revenue: Number(figures.revenue),
                      operatingExpenses: Number(figures.operatingExpenses),
                      ownerAddBack: Number(figures.ownerAddBack),
                      multipleLow: Number(figures.multipleLow),
                      multipleHigh: Number(figures.multipleHigh),
                    },
                  });
                }, 'Worksheet saved.');
              }}>
                {([
                  ['revenue', 'Annual revenue'],
                  ['operatingExpenses', 'Operating expenses'],
                  ['ownerAddBack', 'Owner add-back'],
                  ['multipleLow', 'Low multiple'],
                  ['multipleHigh', 'High multiple'],
                ] as const).map(([key, label]) => (
                  <Field key={key} label={label} htmlFor={key} required>
                    <Input id={key} inputMode="decimal" value={figures[key]} onChange={(event) => setFigures((current) => ({ ...current, [key]: event.target.value }))} required />
                  </Field>
                ))}
                <div className="sm:col-span-2">
                  <Button type="submit" loading={busy}>Save worksheet</Button>
                </div>
              </form>
            ) : null}
          </Card>

          <Card>
            <h3 className="font-serif text-2xl text-navy-900">Closing list</h3>
            <ul className="mt-3 space-y-2">
              {(bundle.tasks ?? []).length === 0 ? <li className="text-sm text-muted">No closing tasks yet.</li> : null}
              {(bundle.tasks ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-sand-50 px-3 py-2 text-sm">
                  <span className={item.done ? 'text-muted line-through' : ''}>{item.label}</span>
                  {staffTools ? (
                    <button type="button" className="font-semibold text-teal-800" onClick={() => void run(async () => {
                      await api(`/api/deals/tasks/${item.id}`, { method: 'PATCH', json: { done: !item.done } });
                    }, item.done ? 'Task reopened.' : 'Task marked done.')}>{item.done ? 'Reopen' : 'Done'}</button>
                  ) : null}
                </li>
              ))}
            </ul>
            {staffTools ? (
              <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await api(`/api/deals/practices/${practiceId}/tasks`, { method: 'POST', json: { label: task } });
                  setTask('');
                }, 'Task added.');
              }}>
                <Input value={task} onChange={(event) => setTask(event.target.value)} placeholder="Add a closing task" aria-label="Closing task" className="max-w-md" required minLength={2} />
                <Button type="submit" variant="secondary" loading={busy}>Add</Button>
              </form>
            ) : null}
          </Card>

          {bundle.broker ? <p className="text-sm text-muted">Assigned broker: <span className="font-semibold text-ink">{bundle.broker.name}</span></p> : null}

          {user.role === 'ADMIN' ? (
            <Card>
              <h3 className="font-serif text-2xl text-navy-900">Broker and recorded figure</h3>
              <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await api(`/api/deals/practices/${practiceId}/assign`, { method: 'POST', json: { brokerId } });
                }, 'Broker assigned.');
              }}>
                <Field label="Broker" htmlFor="broker">
                  <Select id="broker" value={brokerId} onChange={(event) => setBrokerId(event.target.value)} required>
                    <option value="">Choose a broker</option>
                    {brokers.map((broker) => <option key={broker.id} value={broker.id}>{broker.name}</option>)}
                  </Select>
                </Field>
                <Button type="submit" variant="secondary" loading={busy}>Assign</Button>
              </form>
              {brokers.length === 0 ? <p className="mt-2 text-sm text-muted">No broker account exists yet. Create one with the privileged-user script.</p> : null}
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await api(`/api/deals/practices/${practiceId}/commission`, { method: 'POST', json: { amount: Number(commission.amount), note: commission.note } });
                }, 'Figure recorded. No card was charged.');
              }}>
                <Field label="Agreed figure" htmlFor="commission" required hint="This records a number. It does not charge a card.">
                  <Input id="commission" inputMode="decimal" value={commission.amount} onChange={(event) => setCommission((current) => ({ ...current, amount: event.target.value }))} required />
                </Field>
                <Field label="Note" htmlFor="commission-note">
                  <Input id="commission-note" value={commission.note} onChange={(event) => setCommission((current) => ({ ...current, note: event.target.value }))} />
                </Field>
                <div className="sm:col-span-2"><Button type="submit" loading={busy}>Record figure</Button></div>
              </form>
              {bundle.commission ? <p className="mt-3 text-sm">{formatMoney(bundle.commission.amount, 'PUBLIC')}. {bundle.commission.notice}</p> : null}
            </Card>
          ) : null}

          {user.role !== 'ADMIN' && bundle.commission ? (
            <p className="text-sm text-muted">Recorded figure {formatMoney(bundle.commission.amount, 'PUBLIC')}. {bundle.commission.notice}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
