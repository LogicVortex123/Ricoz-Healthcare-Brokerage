'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import type { Practice } from '@/types/api';
import { PracticeForm } from './practice-form';

export function PracticeEditor({ id }: { id: string }) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api<{ data: { practice: Practice } }>(`/api/practices/${id}`)
      .then((result) => {
        if (active) setPractice(result.data.practice);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'This practice could not be loaded.');
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!practice) return <Skeleton className="h-80" />;
  const editable = practice.status === 'DRAFT' || practice.status === 'REJECTED' || practice.status === 'WITHDRAWN';
  if (!editable) {
    return (
      <div className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-serif text-2xl">This listing is locked</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Pending and approved listings cannot be edited. Withdraw the listing first if you need to change it.
        </p>
        <Button className="mt-4" href={`/dashboard/seller/practices/${practice.id}`} variant="secondary">
          Back to practice
        </Button>
      </div>
    );
  }
  return <PracticeForm practice={practice} />;
}
