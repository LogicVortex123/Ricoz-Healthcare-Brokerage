'use client';

import { useEffect, useState } from 'react';
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

type Author = { name: string; role: string };
type Thread = {
  ownershipNotice: string;
  messages: Array<{ id: string; body: string; createdAt: string; author: Author }>;
  offers: Array<{ id: string; amount: number; kind: string; note: string; createdAt: string; author: Author }>;
};

export function InquiryThread({ inquiryId }: { inquiryId: string }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('OFFER');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api<{ data: Thread }>(`/api/deals/inquiries/${inquiryId}`)
      .then((result) => {
        setThread(result.data);
        setError('');
      })
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'The thread could not be loaded.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId]);

  async function send(path: string, json: unknown, success: string, clear: () => void) {
    setBusy(true);
    try {
      await api(path, { method: 'POST', json });
      clear();
      push(success);
      load();
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'That message could not be sent.', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Skeleton className="h-48" />;
  if (error || !thread) return <ErrorState message={error || 'The thread could not be loaded.'} onRetry={load} />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <Card>
        <h2 className="font-serif text-3xl text-navy-900">Messages</h2>
        <div className="mt-4 space-y-3">
          {thread.messages.length === 0 ? <p className="text-sm text-muted">No messages yet. The original inquiry stays on the list.</p> : null}
          {thread.messages.map((message) => (
            <article key={message.id} className="rounded-2xl bg-sand-50 px-4 py-3">
              <p className="text-xs font-bold tracking-wide text-teal-800 uppercase">{message.author.name} · {message.author.role.toLowerCase()}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
            </article>
          ))}
        </div>
        <form className="mt-4 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          void send(`/api/deals/inquiries/${inquiryId}/messages`, { body }, 'Message sent.', () => setBody(''));
        }}>
          <Field label="Message" htmlFor="thread-body" required>
            <Textarea id="thread-body" value={body} onChange={(event) => setBody(event.target.value)} required />
          </Field>
          <Button type="submit" loading={busy}>Send</Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-serif text-3xl text-navy-900">Offers</h2>
        <p className="mt-2 rounded-xl bg-navy-950 px-3 py-3 text-sm leading-6 text-sand-100">{thread.ownershipNotice}</p>
        <ol className="mt-4 space-y-3">
          {thread.offers.length === 0 ? <li className="text-sm text-sand-100">No offer has been recorded.</li> : null}
          {thread.offers.map((offer) => (
            <li key={offer.id} className="rounded-xl border border-line bg-sand-50 px-3 py-3">
              <p className="text-xs font-bold tracking-wide text-teal-800 uppercase">{offer.kind}</p>
              <p className="font-serif text-2xl text-navy-900">{formatMoney(offer.amount, 'PUBLIC')}</p>
              <p className="text-xs text-muted">{offer.author.name}</p>
              {offer.note ? <p className="mt-1 text-sm">{offer.note}</p> : null}
            </li>
          ))}
        </ol>
        {user?.role !== 'ADMIN' ? (
          <form className="mt-4 space-y-3" onSubmit={(event) => {
            event.preventDefault();
            void send(`/api/deals/inquiries/${inquiryId}/offers`, { amount: Number(amount), kind, note }, 'Offer recorded.', () => {
              setAmount('');
              setNote('');
            });
          }}>
            <Field label="Amount" htmlFor="offer-amount" required>
              <Input id="offer-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </Field>
            <Field label="Kind" htmlFor="offer-kind">
              <Select id="offer-kind" value={kind} onChange={(event) => setKind(event.target.value)}>
                <option value="OFFER">Offer</option>
                <option value="COUNTER">Counter</option>
                <option value="ACCEPTED">Accepted proposal</option>
                <option value="DECLINED">Declined</option>
              </Select>
            </Field>
            <Field label="Note" htmlFor="offer-note">
              <Input id="offer-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
            <Button type="submit" loading={busy}>Record offer</Button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
