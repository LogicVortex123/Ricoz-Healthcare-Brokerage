'use client';

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  DollarSign,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';

interface PracticeSaleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newPractice: any) => void;
  onToast: (msg: string) => void;
}

export function PracticeSaleRequestModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  onToast,
}: PracticeSaleRequestModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [sector, setSector] = useState<'dental' | 'veterinary' | 'specialist_medical'>('dental');
  const [specialty, setSpecialty] = useState('general');
  const [clinicName, setClinicName] = useState('');
  const [chairs, setChairs] = useState('3');
  const [yearsInOperation, setYearsInOperation] = useState('12');
  const [transitionType, setTransitionType] = useState('Buyout (100% Acquisition)');

  // Address (Confidential)
  const [city, setCity] = useState('Bengaluru');
  const [zone, setZone] = useState('Indiranagar');
  const [streetAddress, setStreetAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [showAskingPrice, setShowAskingPrice] = useState(false);
  const [askingPrice, setAskingPrice] = useState('12000000'); // 1.2 Cr

  // Financials
  const [revFY24, setRevFY24] = useState('8000000');
  const [expFY24, setExpFY24] = useState('5000000');
  const [revFY23, setRevFY23] = useState('7200000');
  const [expFY23, setExpFY23] = useState('4700000');

  // Equipment
  const [equipmentSummary, setEquipmentSummary] = useState(
    '3 Dental treatment units, digital RVG sensor, Class B autoclave, compressor, optical loupes'
  );

  if (!isOpen) return null;

  const handleValidateAndSubmit = async () => {
    if (submitting) return;
    const errors: string[] = [];
    if (!clinicName.trim()) errors.push('Practice Name is strictly required (held encrypted).');
    if (!streetAddress.trim()) errors.push('Street address is required for broker verification.');
    if (!pincode.trim() || !/^\d{6}$/.test(pincode)) errors.push('Valid 6-digit Indian PIN code required.');
    if (!chairs || parseInt(chairs) < 1) errors.push('Number of dental chairs must be at least 1.');
    if (!revFY24 || parseInt(revFY24) <= 0) errors.push('Annual collections for latest fiscal year required.');

    if (errors.length > 0) {
      setValidationErrors(errors);
      onToast('Please complete the required fields.');
      return;
    }

    setValidationErrors([]);
    const submittedPractice = {
      sector,
      code: `HPT-${city.slice(0, 3).toUpperCase()}-${Math.floor(20 + Math.random() * 70)}`,
      title: `${specialty.replace('_', ' ')} ${sector === 'dental' ? 'practice' : sector === 'veterinary' ? 'hospital' : 'clinic'}, ${zone} ${city}`,
      confidentialName: clinicName,
      specialty,
      city,
      zone,
      addressLine: streetAddress,
      pincode,
      state: 'Karnataka',
      operatoriesOrBeds: `${chairs} ${sector === 'dental' ? 'Dental Chairs' : sector === 'veterinary' ? 'Vet Consult Rooms & OT' : 'Procedure Rooms & Beds'}`,
      yearsInOperation: parseInt(yearsInOperation),
      transitionType,
      revenueBand: parseInt(revFY24) >= 10000000 ? '₹1Cr - ₹2Cr' : '₹50L - ₹1Cr',
      exactRevenue: `₹${(parseInt(revFY24) / 100000).toFixed(2)} Lakh / yr`,
      ebitda: `₹${((parseInt(revFY24) - parseInt(expFY24)) / 100000).toFixed(2)} Lakh (${(((parseInt(revFY24) - parseInt(expFY24)) / parseInt(revFY24)) * 100).toFixed(0)}%)`,
      askingPrice: `₹${(parseInt(askingPrice) / 10000000).toFixed(2)} Cr`,
      sellerName: 'Dr. Ramesh Rao',
      brokerName: 'Anand Kumar (Sr. Healthcare Broker)',
      equipmentSummary: equipmentSummary.split(',').map(s => s.trim()),
      statutoryLicences: ['Clinical Establishment Reg.', 'Biomedical Waste Authorization', 'Local Trade License']
    };

    // Save to MongoDB and only report success once the DB confirms it.
    setSubmitting(true);
    try {
      const res = await fetch('/api/practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submittedPractice),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || `HTTP ${res.status}`);
      }
      onSubmitSuccess(json.data);
      onToast(`Saved to MongoDB ✓ ${json.data.code} (_id ${json.data._id})`);
      window.dispatchEvent(new Event('practices:changed'));
      onClose();
    } catch (e: any) {
      setValidationErrors([`Database save failed: ${e.message}`]);
      onToast(`Save FAILED: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-card max-w-2xl w-full border border-border shadow-elevation max-h-[92vh] flex flex-col justify-between my-auto">
        {/* Header */}
        <div className="p-5 border-b border-border bg-surface/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-50 px-2 py-0.5 rounded">
                Seller Practice Intake Wizard
              </span>
              <h2 className="text-base font-bold text-ink mt-1">Submit Dental Practice for Confidential Transition</h2>
            </div>
            <button onClick={onClose} className="p-1 text-ink-muted hover:text-ink text-sm font-bold">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
            {[
              { num: 1, label: 'Clinical Setup' },
              { num: 2, label: 'Address & Privacy' },
              { num: 3, label: '3-Year Financials' },
              { num: 4, label: 'Equipment & Submit' },
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

        {/* Validation Errors Banner (AC-04) */}
        {validationErrors.length > 0 && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-danger" />
              <span>422 Business Validation Errors ({validationErrors.length}):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-700">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 overflow-y-auto max-h-[55vh] space-y-4 text-xs">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-ink-muted font-medium mb-1">Healthcare Sector</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dental', label: '🩺 Dental Practice' },
                    { id: 'veterinary', label: '🐾 Veterinary Clinic' },
                    { id: 'specialist_medical', label: '🏥 Specialist Medical' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSector(s.id as any)}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        sector === s.id
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-white text-ink hover:bg-surface'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-ink-muted font-medium mb-1">Practice / Clinic Name (Private & Encrypted)</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Apex Multispeciality Clinic & Hospital"
                  className="w-full p-2 bg-surface border border-border rounded-input text-xs font-semibold text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-muted font-medium mb-1">Clinical Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Orthodontics, Small Animal Surgery, Dermatology..."
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted font-medium mb-1">Transition Strategy</label>
                  <select
                    value={transitionType}
                    onChange={(e) => setTransitionType(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs font-medium"
                  >
                    <option value="Buyout (100% Acquisition)">Buyout (100% Acquisition)</option>
                    <option value="Partner Retirement & Succession">Partner Retirement & Succession</option>
                    <option value="Partnership Transition (Partial Equity)">Partnership Transition (Partial Equity)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-muted font-medium mb-1">
                    {sector === 'dental' ? 'Dental Chairs (Operatories)' : sector === 'veterinary' ? 'Vet Consult Rooms & OTs' : 'Procedure Rooms & Beds'}
                  </label>
                  <input
                    type="number"
                    value={chairs}
                    onChange={(e) => setChairs(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted font-medium mb-1">Years in Operation</label>
                  <input
                    type="number"
                    value={yearsInOperation}
                    onChange={(e) => setYearsInOperation(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="p-2.5 bg-primary-50 rounded border border-primary/20 text-primary flex items-start gap-2">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Address Security:</strong> Only City and Zone are rendered in public teasers. Street address and PIN code are stored in AES-256 encrypted fields.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-muted font-medium mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink-muted font-medium mb-1">Locality Zone (Public)</label>
                  <input
                    type="text"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="e.g. South Bengaluru / Indiranagar"
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-muted font-medium mb-1">Exact Street Address (Confidential)</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="#104, 12th Main Road, Opposite BDA Complex"
                  className="w-full p-2 bg-surface border border-border rounded-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-muted font-medium mb-1">6-Digit PIN Code</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560038"
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-ink-muted font-medium mb-1">Target Asking Valuation (INR)</label>
                  <input
                    type="number"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-input text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-ink-muted">
                Enter historical collections and operating expenses. Adjusted EBITDA will calculate automatically.
              </p>

              <div className="p-3 bg-surface rounded-lg border border-border space-y-2">
                <span className="font-bold text-ink">FY 2024-25 (Latest Audited Year)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-ink-muted text-[11px] mb-0.5">Gross Collections (₹)</label>
                    <input
                      type="number"
                      value={revFY24}
                      onChange={(e) => setRevFY24(e.target.value)}
                      className="w-full p-2 bg-white border border-border rounded-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-muted text-[11px] mb-0.5">Operating Expenses (₹)</label>
                    <input
                      type="number"
                      value={expFY24}
                      onChange={(e) => setExpFY24(e.target.value)}
                      className="w-full p-2 bg-white border border-border rounded-input text-xs font-semibold"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded flex justify-between">
                  <span>Calculated EBITDA: ₹{((parseInt(revFY24 || '0') - parseInt(expFY24 || '0')) / 100000).toFixed(2)} Lakh</span>
                  <span>Margin: {(((parseInt(revFY24 || '0') - parseInt(expFY24 || '0')) / parseInt(revFY24 || '1')) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-border space-y-2">
                <span className="font-bold text-ink">FY 2023-24 (Prior Year)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-ink-muted text-[11px] mb-0.5">Gross Collections (₹)</label>
                    <input
                      type="number"
                      value={revFY23}
                      onChange={(e) => setRevFY23(e.target.value)}
                      className="w-full p-2 bg-white border border-border rounded-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-muted text-[11px] mb-0.5">Operating Expenses (₹)</label>
                    <input
                      type="number"
                      value={expFY23}
                      onChange={(e) => setExpFY23(e.target.value)}
                      className="w-full p-2 bg-white border border-border rounded-input text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div>
                <label className="block text-ink-muted font-medium mb-1">Equipment & Infrastructure Summary</label>
                <textarea
                  rows={3}
                  value={equipmentSummary}
                  onChange={(e) => setEquipmentSummary(e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-input text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-surface rounded-lg border border-border space-y-2 text-[11px]">
                <span className="font-semibold text-ink">Statutory Document Readiness</span>
                <div className="grid grid-cols-2 gap-1.5 text-ink-muted">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    KPME License ready
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Biomedical Waste NOC
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    AERB X-Ray Registration
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ITR-V Tax Records
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900">
                Upon submitting, a new CRM transition record is created. Anonymised Tier 0/1 teasers will be reviewed by the brokerage moderation queue before public listing.
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

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-hover flex items-center gap-1"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleValidateAndSubmit}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded hover:bg-emerald-800 flex items-center gap-1.5 shadow-sm disabled:opacity-60 disabled:cursor-wait"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving to MongoDB…' : 'Submit Practice for Broker Review'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

