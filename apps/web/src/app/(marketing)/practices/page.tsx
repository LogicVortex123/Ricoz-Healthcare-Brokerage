import type { Metadata } from 'next';
import { Marketplace } from '@/features/listings/marketplace';

export const metadata: Metadata = { title: 'Practices' };

const notes = [
  { tone: 'bg-teal-100 text-navy-900', text: 'Only reviewed listings appear here.' },
  { tone: 'bg-sand-100 text-navy-900', text: 'You see the city and region, not a street address.' },
  { tone: 'bg-sky-100 text-navy-900', text: 'One active inquiry is enough to introduce yourself.' },
];

export default function PracticesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <header className="overflow-hidden rounded-2xl bg-navy-900 text-white shadow-sm">
        <div className="px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-teal-100 uppercase">Marketplace</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-white sm:text-4xl">Practices open for transition</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-sand-50">Every listing on this page has been approved. Drafts and pending submissions are not included.</p>
        </div>
      </header>
      <ul className="grid gap-3 sm:grid-cols-3">
        {notes.map((note) => (
          <li key={note.text} className={`rounded-xl px-4 py-3 text-sm font-medium leading-6 ${note.tone}`}>{note.text}</li>
        ))}
      </ul>
      <Marketplace />
    </div>
  );
}
