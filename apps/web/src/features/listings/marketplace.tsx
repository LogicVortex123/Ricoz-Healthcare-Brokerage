'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { FilterPanel } from '@/components/ui/filter-panel';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { SearchField } from '@/components/ui/search-field';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import { categories, labelFor } from '@/lib/constants';
import { formatMoney, locationOf } from '@/lib/format';
import type { PageMeta, Practice } from '@/types/api';

type Filters = {
  q: string;
  category: string;
  specialty: string;
  state: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  page: number;
};

const initial: Filters = { q: '', category: '', specialty: '', state: '', city: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 };

const categoryAccent: Record<string, string> = {
  DENTAL: 'border-t-teal-700',
  VETERINARY: 'border-t-coral-700',
  SPECIALIST_MEDICAL: 'border-t-sky-700',
};

export function Marketplace() {
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>(initial);
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Practice[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setFilters((current) => ({ ...current, q: query, page: current.q === query ? current.page : 1 })), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== 1 || key === 'page' || key === 'sort') {
        if (value !== '') params.set(key, String(value));
      }
    });
    if (filters.page > 1) params.set('page', String(filters.page));
    setLoading(true);
    api<{ data: Practice[]; meta: PageMeta }>(`/api/listings?${params.toString()}`, { signal: controller.signal })
      .then((result) => {
        setListings(result.data);
        setMeta(result.meta);
        setError('');
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof ApiError ? caught.message : 'Listings could not be loaded.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  function update(partial: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...partial, page: partial.page ?? 1 }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <FilterPanel className={pathname.startsWith('/dashboard') ? 'lg:top-4' : 'lg:top-20'}>
        <SearchField value={query} onChange={setQuery} placeholder="Search name, specialty, or city" label="Search practices" />
        <Field label="Category" htmlFor="category">
          <Select id="category" value={filters.category} onChange={(event) => update({ category: event.target.value })}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Specialty" htmlFor="specialty">
          <Input id="specialty" value={filters.specialty} onChange={(event) => update({ specialty: event.target.value })} />
        </Field>
        <Field label="City" htmlFor="city">
          <Input id="city" value={filters.city} onChange={(event) => update({ city: event.target.value })} />
        </Field>
        <Field label="State or region" htmlFor="state">
          <Input id="state" value={filters.state} onChange={(event) => update({ state: event.target.value })} />
        </Field>
        <Field label="Minimum price" htmlFor="minPrice">
          <Input id="minPrice" type="number" min={0} value={filters.minPrice} onChange={(event) => update({ minPrice: event.target.value })} />
        </Field>
        <Field label="Maximum price" htmlFor="maxPrice">
          <Input id="maxPrice" type="number" min={0} value={filters.maxPrice} onChange={(event) => update({ maxPrice: event.target.value })} />
        </Field>
        <button type="button" className="text-sm font-semibold text-teal-800" onClick={() => { setQuery(''); setFilters(initial); }}>
          Clear filters
        </button>
      </FilterPanel>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-navy-900">{meta ? `${meta.total} approved ${meta.total === 1 ? 'practice' : 'practices'}` : 'Approved practices'}</p>
          <label className="text-sm text-muted">
            <span className="sr-only">Sort</span>
            <Select value={filters.sort} onChange={(event) => update({ sort: event.target.value })} className="w-44">
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="price_asc">Price, low to high</option>
              <option value="price_desc">Price, high to low</option>
            </Select>
          </label>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
        ) : null}
        {!loading && error ? <ErrorState message={error} onRetry={() => setFilters({ ...filters })} /> : null}
        {!loading && !error && listings.length === 0 ? (
          <EmptyState title="No matching practices" description="Approved listings will appear here. Try a broader search, or check back after a seller’s listing is reviewed." />
        ) : null}
        {!loading && !error ? (
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/practices/${listing.id}`} className="group block rounded-xl focus-visible:outline-none">
                <Card interactive className={`h-full border-t-4 bg-white ${categoryAccent[listing.category] ?? 'border-t-teal-700'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="info">{labelFor(listing.category)}</Badge>
                      <Badge>{labelFor(listing.transactionType)}</Badge>
                    </div>
                    <p className="text-right font-serif text-2xl text-navy-950">{formatMoney(listing.askingPrice, listing.priceVisibility)}</p>
                  </div>
                  <h2 className="mt-4 font-serif text-2xl text-navy-950 group-hover:text-teal-800">{listing.name}</h2>
                  <p className="mt-1 text-sm font-medium text-navy-800">{listing.specialty || 'Specialty not specified'} · {locationOf(listing.city, listing.state)}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-navy-900">{listing.description}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-navy-700 uppercase">Years</dt>
                      <dd className="font-semibold text-navy-950">{listing.yearsInOperation ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-navy-700 uppercase">Practitioners</dt>
                      <dd className="font-semibold text-navy-950">{listing.practitionerCount ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-navy-700 uppercase">Share</dt>
                      <dd className="font-semibold text-navy-950">{listing.ownershipPercentage ? `${listing.ownershipPercentage}%` : '—'}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm font-semibold text-teal-800">View practice</p>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}
        {meta ? <Pagination page={meta.page} totalPages={meta.totalPages} onPage={(page) => update({ page })} /> : null}
      </div>
    </div>
  );
}
