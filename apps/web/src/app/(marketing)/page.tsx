import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { categories } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Healthcare practice transitions',
  description: 'Prepare, review, and inquire about dental, veterinary, and specialist medical practice transitions.',
};

const steps = [
  { number: '01', title: 'Describe the transition', body: 'A seller records the practice, the type of transaction, and the ownership share being offered.' },
  { number: '02', title: 'Review before publication', body: 'An administrator checks the listing. Drafts and rejected listings stay out of the marketplace.' },
  { number: '03', title: 'Buyers inquire', body: 'Approved listings can be searched. A buyer sends one active inquiry, and the seller sees the permitted contact details.' },
  { number: '04', title: 'Work the deal in private', body: 'After a confidentiality acknowledgement, the buyer can read document notes, a figure worksheet, and a closing list. Offers stay on the inquiry.' },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="motion-rise">
            <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Dental · Veterinary · Specialist medical</p>
            <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight text-navy-900 sm:text-5xl">A clear process for clinic ownership changes.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-navy-800">
              PracticeBridge helps owners and buyers manage complete acquisitions, partial buyouts, and partner retirements. Listings stay private until they are reviewed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href="/practices">Explore practices</Button>
              <Button href="/sign-up?role=SELLER" variant="secondary">List your practice</Button>
            </div>
            <p className="mt-4 text-sm text-muted">Owner contact details and street addresses are not published on listings.</p>
          </div>
          <div className="motion-float rounded-xl border border-line bg-white/90 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Example layout</p>
                <h2 className="mt-2 font-serif text-2xl text-navy-900">Northwind Family Dental</h2>
                <p className="mt-1 text-sm text-muted">General dentistry · Portland, Oregon</p>
              </div>
              <Badge tone="warning">Not a live listing</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink">This is how an approved card is arranged. It is not a practice in the marketplace and it is not a completed transaction.</p>
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
              <div><dt className="text-xs text-muted">Transaction</dt><dd className="font-semibold">Full sale</dd></div>
              <div><dt className="text-xs text-muted">Location</dt><dd className="font-semibold">City only</dd></div>
              <div><dt className="text-xs text-muted">Price</dt><dd className="font-semibold">Shown or private</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" id="categories">
        <h2 className="reveal font-serif text-3xl text-navy-900">Three kinds of practice</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {categories.map((category, index) => (
            <article key={category.value} className={`reveal rounded-xl border border-line border-t-2 bg-white p-5 ${index === 0 ? 'from-left border-t-teal-700' : index === 1 ? 'border-t-coral-700' : 'from-right border-t-sky-700'}`} style={{ transitionDelay: `${index * 90}ms` }}>
              <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-serif text-2xl text-navy-900">{category.label}</h3>
              <p className="mt-2 text-sm leading-6 text-navy-800">{category.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white" id="how-it-works">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="reveal font-serif text-3xl text-navy-900">How a listing moves</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.number} className="reveal rounded-xl border border-line bg-white p-5" style={{ transitionDelay: `${index * 110}ms` }}>
                <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">{step.number}</p>
                <h3 className="mt-2 font-serif text-xl text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-navy-800">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-2">
        <article id="buyers" className="reveal from-left rounded-xl border border-line bg-white p-6">
          <h2 className="font-serif text-3xl text-navy-900">For buyers</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-navy-800">
            <li>Browse only listings an administrator has approved.</li>
            <li>Filter by category, specialty, location, and asking price.</li>
            <li>Send an inquiry and follow whether it is open, acknowledged, or closed.</li>
          </ul>
          <Button className="mt-5" href="/sign-up?role=BUYER" variant="secondary">Create a buyer account</Button>
        </article>
        <article id="sellers" className="reveal from-right rounded-xl border border-line bg-white p-6" style={{ transitionDelay: '120ms' }}>
          <h2 className="font-serif text-3xl text-navy-900">For sellers</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-navy-800">
            <li>Save a draft before you are ready for review.</li>
            <li>Record a full sale, a partial buyout, or a partner retirement.</li>
            <li>See a rejection reason, correct the listing, and submit it again.</li>
          </ul>
          <Button className="mt-5" href="/sign-up?role=SELLER">List your practice</Button>
        </article>
      </section>

      <section className="border-t border-line bg-navy-950 text-sand-100" id="confidentiality">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="reveal font-serif text-3xl text-white">What stays private</h2>
          <div className="mt-6 grid gap-4 text-sm leading-6 text-sand-100 md:grid-cols-2">
            <p className="reveal from-left rounded-xl border border-white/10 p-5">Public listings show the city and region. They do not collect or display a street address, and they do not show the owner’s email or phone.</p>
            <p className="reveal from-right rounded-xl border border-white/10 p-5" style={{ transitionDelay: '120ms' }}>A buyer’s name and email are shared with the seller only after an inquiry. Document notes stay closed until the buyer records a confidentiality acknowledgement. That record is not a lawyer-prepared contract, and it does not move clinical records or transfer ownership.</p>
          </div>
          <Link href="/practices" className="mt-6 inline-flex h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-navy-900">
            Explore practices
          </Link>
        </div>
      </section>
    </>
  );
}
