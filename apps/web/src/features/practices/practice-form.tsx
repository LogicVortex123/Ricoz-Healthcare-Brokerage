'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGrid } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { ApiError, api } from '@/lib/api';
import { categories, ownershipTypes, transactionTypes } from '@/lib/constants';
import type { Practice } from '@/types/api';
import { draftPayloadSchema, emptyPracticeForm, submitPayloadSchema, toPracticePayload, type PracticeFormValues } from './schema';

function fromPractice(practice: Practice): PracticeFormValues {
  return {
    name: practice.name,
    category: practice.category,
    specialty: practice.specialty ?? '',
    city: practice.city ?? '',
    state: practice.state ?? '',
    description: practice.description ?? '',
    yearsInOperation: practice.yearsInOperation?.toString() ?? '',
    practitionerCount: practice.practitionerCount?.toString() ?? '',
    facilityInfo: practice.facilityInfo ?? '',
    ownershipType: practice.ownershipType ?? '',
    transactionType: practice.transactionType ?? '',
    ownershipPercentage: practice.ownershipPercentage?.toString() ?? '',
    askingPrice: practice.askingPrice?.toString() ?? '',
    priceVisibility: practice.priceVisibility ?? 'ON_REQUEST',
    transitionReason: practice.transitionReason ?? '',
  };
}

function showIssues(error: { issues: { path: PropertyKey[]; message: string }[] }, setError: UseFormSetError<PracticeFormValues>) {
  error.issues.forEach((issue) => {
    const path = String(issue.path[0] ?? '');
    if (path in emptyPracticeForm) setError(path as keyof PracticeFormValues, { message: issue.message });
  });
}

export function PracticeForm({ practice }: { practice?: Practice }) {
  const router = useRouter();
  const { push } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const form = useForm<PracticeFormValues>({ defaultValues: practice ? fromPractice(practice) : emptyPracticeForm });
  const transactionType = form.watch('transactionType');
  const priceVisibility = form.watch('priceVisibility');
  const showShare = transactionType === 'PARTIAL_BUYOUT' || transactionType === 'PARTNER_RETIREMENT' || transactionType === 'OWNERSHIP_TRANSITION';
  const shareRequired = transactionType === 'PARTIAL_BUYOUT' || transactionType === 'PARTNER_RETIREMENT';

  async function persist(values: PracticeFormValues) {
    const payload = toPracticePayload(values);
    if (practice) {
      const result = await api<{ data: { practice: Practice } }>(`/api/practices/${practice.id}`, { method: 'PATCH', json: payload });
      return result.data.practice;
    }
    const result = await api<{ data: { practice: Practice } }>('/api/practices', { method: 'POST', json: payload });
    return result.data.practice;
  }

  async function saveDraft(values: PracticeFormValues) {
    const parsed = draftPayloadSchema.safeParse(toPracticePayload(values));
    if (!parsed.success) {
      showIssues(parsed.error, form.setError);
      return;
    }
    setSaving(true);
    try {
      const saved = await persist(values);
      push('Draft saved.');
      router.push(`/dashboard/seller/practices/${saved.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'The draft could not be saved.';
      push(message, 'error');
      if (error instanceof ApiError) showIssues({ issues: (error.details ?? []).map((detail) => ({ path: [detail.path], message: detail.message })) }, form.setError);
    } finally {
      setSaving(false);
    }
  }

  function requestSubmit() {
    const parsed = submitPayloadSchema.safeParse(toPracticePayload(form.getValues()));
    if (!parsed.success) {
      showIssues(parsed.error, form.setError);
      push('Complete the required fields before submitting.', 'error');
      return;
    }
    setConfirming(true);
  }

  async function confirmSubmit() {
    setSaving(true);
    try {
      const saved = await persist(form.getValues());
      const result = await api<{ data: { practice: Practice } }>(`/api/practices/${saved.id}/submit`, { method: 'POST', json: {} });
      push('Listing submitted for review.');
      setConfirming(false);
      router.push(`/dashboard/seller/practices/${result.data.practice.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'The listing could not be submitted.';
      push(message, 'error');
      if (error instanceof ApiError) showIssues({ issues: (error.details ?? []).map((detail) => ({ path: [detail.path], message: detail.message })) }, form.setError);
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(saveDraft)} noValidate>
      <Card className="space-y-5">
        <h2 className="font-serif text-2xl text-navy-900">Practice</h2>
        <FieldGrid>
          <Field label="Practice name" htmlFor="name" required error={form.formState.errors.name?.message}>
            <Input {...form.register('name')} />
          </Field>
          <Field label="Category" htmlFor="category" required error={form.formState.errors.category?.message}>
            <Select {...form.register('category')}>
              <option value="">Choose a category</option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Specialty" htmlFor="specialty" error={form.formState.errors.specialty?.message} hint="For example, orthodontics, small animal, or cardiology.">
            <Input {...form.register('specialty')} />
          </Field>
          <Field label="Years in operation" htmlFor="yearsInOperation" error={form.formState.errors.yearsInOperation?.message}>
            <Input type="number" min={0} {...form.register('yearsInOperation')} />
          </Field>
        </FieldGrid>
        <Field label="Description" htmlFor="description" error={form.formState.errors.description?.message} hint="Describe the practice in plain language. Do not include patient names or records.">
          <Textarea {...form.register('description')} />
        </Field>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-serif text-2xl text-navy-900">Location and facility</h2>
        <FieldGrid>
          <Field label="City" htmlFor="city" error={form.formState.errors.city?.message} hint="Buyers see the city and region, not a street address.">
            <Input {...form.register('city')} />
          </Field>
          <Field label="State or region" htmlFor="state" error={form.formState.errors.state?.message}>
            <Input {...form.register('state')} />
          </Field>
          <Field label="Practitioners" htmlFor="practitionerCount" error={form.formState.errors.practitionerCount?.message}>
            <Input type="number" min={1} {...form.register('practitionerCount')} />
          </Field>
          <Field label="Ownership type" htmlFor="ownershipType" error={form.formState.errors.ownershipType?.message}>
            <Select {...form.register('ownershipType')}>
              <option value="">Choose ownership</option>
              {ownershipTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>
        </FieldGrid>
        <Field label="Facility information" htmlFor="facilityInfo" error={form.formState.errors.facilityInfo?.message} hint="Operatories, exam rooms, or equipment you are comfortable sharing.">
          <Textarea {...form.register('facilityInfo')} />
        </Field>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-serif text-2xl text-navy-900">Transition</h2>
        <FieldGrid>
          <Field label="Transaction type" htmlFor="transactionType" error={form.formState.errors.transactionType?.message}>
            <Select {...form.register('transactionType')}>
              <option value="">Choose a transaction</option>
              {transactionTypes.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>
          {showShare ? (
            <Field label="Ownership percentage to transfer" htmlFor="ownershipPercentage" required={shareRequired} error={form.formState.errors.ownershipPercentage?.message} hint="This records the proposed share. It does not transfer ownership.">
              <Input type="number" min={1} max={99} {...form.register('ownershipPercentage')} />
            </Field>
          ) : null}
          <Field label="Asking price" htmlFor="priceVisibility" error={form.formState.errors.priceVisibility?.message}>
            <Select {...form.register('priceVisibility')}>
              <option value="ON_REQUEST">Price on request</option>
              <option value="PUBLIC">Show asking price</option>
            </Select>
          </Field>
          {priceVisibility === 'PUBLIC' ? (
            <Field label="Asking price in dollars" htmlFor="askingPrice" required error={form.formState.errors.askingPrice?.message}>
              <Input type="number" min={0} step={1} {...form.register('askingPrice')} />
            </Field>
          ) : null}
        </FieldGrid>
        <Field label="Reason for the transition" htmlFor="transitionReason" error={form.formState.errors.transitionReason?.message} hint="For example, retirement, relocation, or a partner leaving.">
          <Textarea {...form.register('transitionReason')} />
        </Field>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" variant="secondary" loading={saving && !confirming}>
          Save draft
        </Button>
        <Button type="button" onClick={requestSubmit}>
          Submit for review
        </Button>
      </div>

      <Modal open={confirming} title="Submit this listing?" onClose={() => setConfirming(false)}>
        <p className="text-sm leading-6 text-muted">
          An administrator will review it before buyers can see it. You can withdraw it later if you need to make changes.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
            Keep editing
          </Button>
          <Button type="button" loading={saving} onClick={() => void confirmSubmit()}>
            Submit listing
          </Button>
        </div>
      </Modal>
    </form>
  );
}
