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
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora" aria-hidden="true" />
        <div className="hero-grid relative">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div className="motion-rise">
              <p className="text-sm font-semibold tracking-wide text-teal-800 uppercase">Dental · Veterinary · Specialist medical</p>
              <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] text-navy-900 sm:text-6xl lg:text-7xl">A clear process for clinic ownership changes.</h1>
              <p className="mt-6 max-w-xl text-xl leading-8 text-navy-800">
                PracticeBridge helps owners and buyers manage complete acquisitions, partial buyouts, and partner retirements. Listings stay private until they are reviewed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/practices">Explore practices</Button>
                <Button href="/sign-up?role=SELLER" variant="secondary">List your practice</Button>
              </div>
              <p className="mt-4 text-sm text-muted">Owner contact details and street addresses are not published on listings.</p>
            </div>
            <div className="motion-float rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Sample layout</p>
                <Badge tone="warning">Example only</Badge>
              </div>
              <h2 className="mt-4 font-serif text-3xl text-navy-900">Northwind Family Dental</h2>
              <p className="mt-1 text-sm text-muted">General dentistry · Portland, Oregon</p>
              <p className="mt-4 text-sm leading-6">This card shows how an approved listing is presented. It is not a live practice and it is not a completed transaction.</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted">Transaction</dt><dd className="font-semibold">Complete acquisition</dd></div>
                <div><dt className="text-muted">Asking price</dt><dd className="font-semibold">Shown or on request</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id="categories">
        <h2 className="reveal font-serif text-4xl text-navy-900 sm:text-5xl">Three kinds of practice</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {categories.map((category, index) => {
            const tone = index === 0 ? 'border-teal-700 bg-teal-100' : index === 1 ? 'border-coral-700 bg-coral-100' : 'border-sky-700 bg-sky-100';
            const direction = index === 0 ? 'from-left' : index === 2 ? 'from-right' : '';
            return (
              <article key={category.value} className={`reveal ${direction} rounded-2xl border-t-4 p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl ${tone}`} style={{ transitionDelay: `${index * 90}ms` }}>
                <p className="text-sm font-bold tracking-wide uppercase">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 font-serif text-3xl">{category.label}</h3>
                <p className="mt-3 text-base leading-7 text-navy-800">{category.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-r from-navy-900 via-teal-800 to-sky-700 text-white" id="how-it-works">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="reveal font-serif text-4xl text-white sm:text-5xl">How a listing moves</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.number} className="reveal rounded-2xl bg-white/10 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15" style={{ transitionDelay: `${index * 110}ms` }}>
                <p className="font-serif text-4xl text-gold-100">{step.number}</p>
                <h3 className="mt-2 font-serif text-2xl text-white">{step.title}</h3>
                <p className="mt-2 text-base leading-7 text-sand-100">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
        <article id="buyers" className="reveal from-left rounded-2xl border border-sky-700/20 bg-sky-100 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="font-serif text-4xl text-sky-700">For buyers</h2>
          <ul className="mt-4 space-y-3 text-base leading-7 text-navy-800">
            <li>Browse only listings an administrator has approved.</li>
            <li>Filter by category, specialty, location, and asking price.</li>
            <li>Send an inquiry and follow whether it is open, acknowledged, or closed.</li>
          </ul>
          <Button className="mt-6" href="/sign-up?role=BUYER" variant="secondary">Create a buyer account</Button>
        </article>
        <article id="sellers" className="reveal from-right rounded-2xl border border-coral-700/20 bg-coral-100 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ transitionDelay: '120ms' }}>
          <h2 className="font-serif text-4xl text-coral-700">For sellers</h2>
          <ul className="mt-4 space-y-3 text-base leading-7 text-navy-800">
            <li>Save a draft before you are ready for review.</li>
            <li>Record a full sale, a partial buyout, or a partner retirement.</li>
            <li>See a rejection reason, correct the listing, and submit it again.</li>
          </ul>
          <Button className="mt-6" href="/sign-up?role=SELLER">List your practice</Button>
        </article>
      </section>

      <section className="bg-navy-950 text-sand-100" id="confidentiality">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="reveal font-serif text-4xl text-white">What stays private</h2>
          <div className="mt-6 grid gap-6 text-base leading-8 text-sand-100 md:grid-cols-2">
            <p className="reveal from-left rounded-2xl bg-white/5 p-5">Public listings show the city and region. They do not collect or display a street address, and they do not show the owner’s email or phone.</p>
            <p className="reveal from-right rounded-2xl bg-coral-700/20 p-5" style={{ transitionDelay: '120ms' }}>A buyer’s name and email are shared with the seller only after an inquiry. This release does not sign an NDA, move clinical records, or transfer legal ownership.</p>
          </div>
          <Link href="/practices" className="mt-8 inline-flex h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-navy-900">
            Explore practices
          </Link>
        </div>
      </section>
    </>
  );
}
