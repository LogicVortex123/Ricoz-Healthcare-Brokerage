'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Building,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  CreditCard,
  MapPin,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface BuyerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (profile: any) => void;
  onToast: (msg: string) => void;
}

export function BuyerOnboardingModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  onToast,
}: BuyerOnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [buyerType, setBuyerType] = useState<'associate' | 'expanding_owner' | 'acquisition_group'>('associate');
  const [fullName, setFullName] = useState('Dr. Priya V. Sharma');
  const [specialty, setSpecialty] = useState('Orthodontics');
  const [dciNumber, setDciNumber] = useState('DCI-KA-19842');
  const [stateCouncil, setStateCouncil] = useState('Karnataka State Dental Council');

  // Preferences
  const [preferredCities, setPreferredCities] = useState<string[]>(['Bengaluru']);
  const [budgetRange, setBudgetRange] = useState('50L-1Cr');
  const [preferredChairs, setPreferredChairs] = useState('3-5 Chairs');
  const [financingStatus, setFinancingStatus] = useState('pre_approved');

  // Verification Upload
  const [uploadedProof, setUploadedProof] = useState<string | null>('SBI_Healthcare_PreApproval_Letter.pdf');

  if (!isOpen) return null;

  const toggleCity = (city: string) => {
    setPreferredCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const handleComplete = () => {
    if (!fullName.trim() || !dciNumber.trim()) {
      onToast('DCI registration number and legal name required.');
      return;
    }

    const profile = {
      fullName,
      buyerType,
      specialty,
      dciNumber,
      stateCouncil,
      preferredCities,
      budgetRange,
      preferredChairs,
      financingStatus,
      status: 'qualified',
    };

    onSubmitSuccess(profile);
    onToast('Buyer profile submitted and qualified! Verification badge activated.');
    onClose();
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-card max-w-xl w-full border border-border shadow-elevation max-h-[92vh] flex flex-col justify-between my-auto">
        {/* Header */}
        <div className="p-5 border-b border-border bg-surface/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-50 px-2 py-0.5 rounded">
                Buyer Onboarding & Qualification
              </span>
              <h2 className="text-base font-bold text-ink mt-1">Acquisition Profile & Financial Readiness</h2>
            </div>
            <button onClick={onClose} className="p-1 text-ink-muted hover:text-ink text-sm font-bold">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
            {[
              { num: 1, label: 'Identity & DCI' },
              { num: 2, label: 'Target Criteria' },
              { num: 3, label: 'Proof of Funds' },
            ].map((s) => (
              <div
                key={s.num}
                className={`p-2 rounded border font-semibold flex items-center justify-center gap-1.5 ${
                  step === s.num
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : step > s.num
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-surface text-ink-muted border-border'
                }`}
              >
                <span>{step > s.num ? '✓' : s.num}.</span>
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto max-h-[55vh] space-y-4 text-xs">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-ink-muted font-medium mb-1">Buyer Persona / Acquisition Entity</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'associate', label: 'Associate Dentist', sub: 'First practice buyout' },
                    { id: 'expanding_owner', label: 'Existing Owner', sub: 'Adding clinic location' },
                    { id: 'acquisition_group', label: 'Dental Group / DSO', sub: 'Institutional buyer' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBuyerType(t.id as any)}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between ${
                        buyerType === t.id
                          ? 'border-primary bg-primary-50/50 text-primary'
                          : 'border-border bg-white text-ink hover:bg-surface'
                      }`}
                    >
                      <span className="font-bold text-xs">{t.label}</span>
                      <span className="text-[10px] text-ink-muted mt-1">{t.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-ink-muted font-medium mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-input text-xs font-semibold text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-muted font-medium mb-1">DCI Registration Number</label>
                  <input
                    type="text"
                    value={dciNumber}
                    onChange={(e) => setDciNumber(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs font-mono font-bold text-primary"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted font-medium mb-1">State Dental Council</label>
                  <input
                    type="text"
                    value={stateCouncil}
                    onChange={(e) => setStateCouncil(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs text-ink"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-ink-muted font-medium mb-1">Target Metro Cities (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCity(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        preferredCities.includes(c)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink-muted border-border hover:bg-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-muted font-medium mb-1">Acquisition Budget Range</label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs"
                  >
                    <option value="<50L">Under ₹50 Lakh</option>
                    <option value="50L-1Cr">₹50 Lakh - ₹1 Crore</option>
                    <option value="1Cr-2.5Cr">₹1 Crore - ₹2.5 Crore</option>
                    <option value=">2.5Cr">Above ₹2.5 Crore</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink-muted font-medium mb-1">Practice Scale</label>
                  <select
                    value={preferredChairs}
                    onChange={(e) => setPreferredChairs(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs"
                  >
                    <option value="1-2 Chairs">1-2 Operatories (Solo)</option>
                    <option value="3-5 Chairs">3-5 Operatories (Medium)</option>
                    <option value="6+ Chairs">6+ Operatories (Multi-chair Center)</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-surface rounded border border-border text-[11px] text-ink-muted">
                Note: Your specific budget and financial limits are visible strictly to assigned brokers, never to selling clinic owners.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="block text-ink-muted font-medium mb-1">Financing Readiness Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'self_funded', label: '100% Cash / Self-Funded' },
                    { id: 'pre_approved', label: 'Pre-Approved Bank Loan' },
                    { id: 'in_process', label: 'Loan In Process' },
                    { id: 'seeking_lender', label: 'Requires Lender Connection' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFinancingStatus(f.id)}
                      className={`p-2 rounded border text-left text-xs ${
                        financingStatus === f.id
                          ? 'border-primary bg-primary-50/50 text-primary font-bold'
                          : 'border-border bg-white text-ink hover:bg-surface'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-ink-muted font-medium mb-1">Upload Proof of Funds / Sanction Letter (Optional)</label>
                <div className="p-4 border-2 border-dashed border-border rounded-lg text-center bg-surface/50">
                  <Upload className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold text-ink">Upload bank statement, FD, or sanction letter</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">Encrypted with AES-256 (PDF, DOCX up to 25MB)</p>
                  {uploadedProof && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-1 rounded border border-emerald-200">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{uploadedProof}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-3 py-1.5 text-xs font-semibold text-ink bg-white border border-border rounded hover:bg-surface flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-hover flex items-center gap-1"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-hover flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Verify Buyer Profile (F09)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

