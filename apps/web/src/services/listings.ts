import { api } from '@/lib/api';
import type { PageMeta, Practice } from '@/types/api';

export function fetchListings(params: string) {
  return api<{ data: Practice[]; meta: PageMeta }>(`/api/listings?${params}`);
}

export function fetchListing(id: string) {
  return api<{ data: { listing: Practice } }>(`/api/listings/${id}`);
}
