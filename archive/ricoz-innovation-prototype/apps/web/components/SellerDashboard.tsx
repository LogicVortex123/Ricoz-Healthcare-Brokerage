'use client';

import React, { useState } from 'react';
import {
  SELLER_PRACTICE_SAMPLE,
  INITIAL_ACCESS_REQUESTS,
  AccessRequest,
} from '../lib/mockData';
import {
  Shield,
  Eye,
  Lock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  Building,
  DollarSign,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { PracticeSaleRequestModal } from './PracticeSaleRequestModal';
import { PageHeader, Tabs, Toast, Pill } from './ui';

export function SellerDashboard() {
  const [practice, setPractice] = useState(SELLER_PRACTICE_SAMPLE);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(INITIAL_ACCESS_REQUESTS);
  const [previewTier, setPreviewTier] = useState<0 | 1 | 2>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'documents' | 'requests'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saleRequestModalOpen, setSaleRequestModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleVetoBuyer = (requestId: string, buyerName: string) => {
    setAccessRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'vetoed' } : r))
    );
    showToast(`Seller Veto recorded for ${buyerName}. They can never view your clinic name or data room.`);
  };

  const handleApproveTier2 = (requestId: string, buyerName: string) => {
    setAccessRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved', tier: 2 } : r))
    );
    showToast(`Access grant approved for ${buyerName}. 60s signed access issued.`);
  };

  return (
    <div className="space-y-7">
      {/* Toast Alert */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <PageHeader
        title="My Practice Sale"
        badge={<Pill tone="green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Listed</Pill>}
        subtitle={
          <>
            {practice.name} · Ref <span className="font-mono text-ink">{practice.code}</span> · Broker Anand Kumar
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => setSaleRequestModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary-hover shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New sale request
          </button>
        }
      />

      {/* Sale status stepper */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[13px] font-semibold text-ink">Sale progress</p>
            <p className="text-[12px] text-ink-muted mt-0.5">Step 5 of 7 — your listing is live to verified buyers</p>
          </div>
          <span className="text-[12px] font-semibold text-primary bg-primary-50 rounded-full px-2.5 py-1">71% complete</span>
        </div>
        <ol className="grid grid-cols-7 gap-0">
          {['Draft', 'Submitted', 'In review', 'Approved', 'Listed', 'Under offer', 'Sold'].map((label, i) => {
            const current = 4;
            const done = i < current;
            const isCurrent = i === current;
            return (
              <li key={label} className="relative flex flex-col items-center text-center">
                {i > 0 && (
                  <span className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-0 ${i <= current ? 'bg-primary' : 'bg-border'}`} />
                )}
                <span
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ring-4 ring-white ${
                    done ? 'bg-primary text-white' : isCurrent ? 'bg-white text-primary border-2 border-primary shadow-glow' : 'bg-surface-subtle text-ink-light border border-border'
                  }`}
                >
                  {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </span>
                <span className={`mt-2 text-[11px] sm:text-[12px] ${isCurrent ? 'font-semibold text-ink' : done ? 'text-ink-muted' : 'text-ink-light'}`}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'financials', label: 'Financials', icon: DollarSign },
          { id: 'documents', label: 'Due diligence', icon: FileText, count: practice.documents.length },
          { id: 'requests', label: 'Buyer requests', icon: Lock, count: accessRequests.length },
        ]}
      />

      {/* Tab 1: Overview & 3-Tier Confidentiality Preview (PRD S14 & Section 10D) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Tier Simulator */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-card border border-border shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-primary" />
                    Confidentiality Preview Simulator
                  </h3>
                  <p className="text-xs text-ink-muted">
                    See exactly how your clinic is presented at each disclosure level.
                  </p>
                </div>
                <div className="flex bg-surface rounded-md p-1 border border-border">
                  {[
                    { tier: 0, label: 'Tier 0: Teaser (Public)' },
                    { tier: 1, label: 'Tier 1: Verified Buyer' },
                    { tier: 2, label: 'Tier 2: NDA Cleared' },
                  ].map((t) => (
                    <button
                      key={t.tier}
                      onClick={() => setPreviewTier(t.tier as any)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${
                        previewTier === t.tier
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* The Rendered Preview Card */}
              <div className="mt-4 p-5 rounded-lg border-2 border-primary/20 bg-surface/50">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-primary-50 text-primary px-2 py-0.5 rounded font-bold">
                      {previewTier === 0 ? 'Public Teaser' : previewTier === 1 ? 'Verified Doctor View' : 'NDA-Cleared View'}
                    </span>
                    <h2 className="text-base font-bold text-ink mt-1">
                      {previewTier < 2 ? 'General Dental Practice, South Bengaluru' : practice.name}
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {previewTier < 2
                        ? 'Jayanagar / JP Nagar Zone, Bengaluru, Karnataka'
                        : `${practice.addressLine}, ${practice.zone}, ${practice.city} - PIN ${practice.pincode}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-ink-muted block">Asking Valuation</span>
                    <span className="text-base font-bold text-primary">
                      {previewTier < 2 ? 'Disclosed after NDA' : '₹1.15 Crore'}
                    </span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  <div className="bg-white p-2.5 rounded border border-border">
                    <span className="text-[10px] text-ink-muted block">Dental Chairs</span>
                    <span className="text-xs font-bold text-ink">{practice.chairs} Operatories</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-border">
                    <span className="text-[10px] text-ink-muted block">Annual Revenue</span>
                    <span className="text-xs font-bold text-ink">
                      {previewTier < 2 ? '₹50L - ₹1Cr (Band)' : '₹84,50,000 (Audited)'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-border">
                    <span className="text-[10px] text-ink-muted block">Years in Operation</span>
                    <span className="text-xs font-bold text-ink">
                      {previewTier === 0 ? 'Established (10+ yrs)' : `${practice.yearsInOperation} Years`}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-border">
                    <span className="text-[10px] text-ink-muted block">Staff Size</span>
                    <span className="text-xs font-bold text-ink">
                      {previewTier === 0 ? 'Confidential' : '3 Dentists, 7 Total Staff'}
                    </span>
                  </div>
                </div>

                {/* Equipment & Verification */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-semibold text-ink text-xs">Primary Equipment & Capital Setup:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-ink-muted">
                    {practice.equipmentList.slice(0, previewTier === 0 ? 3 : 6).map((eq, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px]">{eq}</span>
                      </li>
                    ))}
                  </ul>
                  {previewTier === 0 && (
                    <p className="text-[11px] text-ink-muted italic pt-1">
                      + 3 additional high-value asset schedules masked for privacy
                    </p>
                  )}
                </div>

                {/* Masking explanation note */}
                <div className="mt-4 bg-primary-50 p-2.5 rounded-md border border-primary/20 flex items-start gap-2 text-xs text-primary">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Confidentiality Promise:</strong> Your patients, local associates, and staff cannot identify your clinic from the teaser. Street address and doctor registration are only unlocked after verified DCI vetting, signed NDA, and your explicit non-veto.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Quick Summary & Inquiries */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-card border border-border shadow-card space-y-3">
              <h3 className="font-bold text-sm text-ink">Confidentiality Settings</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border">
                  <span>Show asking price on teaser</span>
                  <span className="font-bold text-danger text-[11px]">Hidden (Default)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border">
                  <span>Locality masking</span>
                  <span className="font-bold text-emerald-700 text-[11px]">Zone-only (Active)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border">
                  <span>Seller Veto rights</span>
                  <span className="font-bold text-primary text-[11px]">Always Enabled</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-card border border-border shadow-card space-y-3">
              <h3 className="font-bold text-sm text-ink">Assigned Transition Broker</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                  AK
                </div>
                <div className="text-xs">
                  <p className="font-bold text-ink">Anand Kumar</p>
                  <p className="text-ink-muted">Sr. Healthcare M&A Broker</p>
                  <p className="text-[11px] text-primary mt-0.5">+91 98450 99182</p>
                </div>
              </div>
              <p className="text-[11px] text-ink-muted">
                Anand has screened 3 prospective buyers for your practice this week.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 3-Year Financial Intake (PRD S12 & Section 10B) */}
      {activeTab === 'financials' && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">Three-Year Financial Intake & EBITDA Schedule</h3>
              <p className="text-xs text-ink-muted">
                Mandatory for due diligence disclosure. All numbers are encrypted with AES-256-GCM.
              </p>
            </div>
            <button
              onClick={() => showToast('Financial figures saved successfully.')}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-hover self-start"
            >
              Save Financial Draft
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-ink-muted font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Fiscal Year</th>
                  <th className="py-2.5 px-3">Annual Collections / Revenue</th>
                  <th className="py-2.5 px-3">Operating Expenses</th>
                  <th className="py-2.5 px-3">Adjusted EBITDA</th>
                  <th className="py-2.5 px-3">EBITDA Margin</th>
                  <th className="py-2.5 px-3">Verification Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {practice.financials.map((fin) => (
                  <tr key={fin.year} className="hover:bg-surface/50">
                    <td className="py-3 px-3 font-bold text-ink">{fin.year}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-primary">
                      ₹{(fin.revenue / 100000).toFixed(2)} Lakh
                    </td>
                    <td className="py-3 px-3 font-mono text-ink-muted">
                      ₹{(fin.expenses / 100000).toFixed(2)} Lakh
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      ₹{(fin.ebitda / 100000).toFixed(2)} Lakh
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        {fin.margin}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-ink-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Audited P&L / ITR-V</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-surface rounded-lg border border-border text-xs text-ink-muted flex items-center justify-between">
            <span>Asking Price Multiplier: <strong>1.36x Revenue / 3.68x EBITDA</strong></span>
            <span className="text-primary font-semibold">Preliminary Valuation: ₹1.15 Cr</span>
          </div>
        </div>
      )}

      {/* Tab 3: Due Diligence Document Checklist (PRD S13 & Section 10I) */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">Due Diligence Document Vault & Statutory Checklist</h3>
              <p className="text-xs text-ink-muted">
                Categorized documents required by Indian law and practice transition standards.
              </p>
            </div>
            <button
              onClick={() => showToast('Upload modal triggered: Only PDF, DOCX, XLSX up to 25MB permitted')}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-hover flex items-center gap-1.5 self-start"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload New Document
            </button>
          </div>

          <div className="divide-y divide-border">
            {practice.documents.map((doc, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between hover:bg-surface/40 px-2 rounded">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-ink">{doc.name}</p>
                    <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-0.5">
                      <span className="font-medium text-ink">{doc.category}</span>
                      <span>{doc.size}</span>
                      <span>Uploaded {doc.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      doc.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : doc.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <button
                    onClick={() => showToast(`Generating 60-second secure signed URL for ${doc.name}...`)}
                    className="text-xs text-primary hover:text-primary-hover font-semibold"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Access Requests & Seller Veto (PRD S15, Section 10H, AC-08) */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-ink">Prospective Buyer Confidential Information Requests</h3>
            <p className="text-xs text-ink-muted">
              Buyers must complete profile qualification and sign the NDA before requesting Tier 2 access. You possess absolute veto authority.
            </p>
          </div>

          <div className="space-y-3">
            {accessRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-lg border border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-ink">{req.buyerName}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-ink-muted">
                      {req.buyerRegNo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : req.status === 'vetoed'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Requested on: {req.requestedAt} {req.ndaSignedAt ? `• NDA Accepted: ${req.ndaSignedAt}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {req.status !== 'vetoed' && (
                    <button
                      onClick={() => handleVetoBuyer(req.id, req.buyerName)}
                      className="px-3 py-1.5 text-xs font-semibold text-danger bg-danger-light hover:bg-danger hover:text-white rounded flex items-center gap-1 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Veto Buyer</span>
                    </button>
                  )}
                  {req.status === 'nda_signed' && (
                    <button
                      onClick={() => handleApproveTier2(req.id, req.buyerName)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Tier 2</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Sale Request Modal (PRD S11 & AC-04) */}
      <PracticeSaleRequestModal
        isOpen={saleRequestModalOpen}
        onClose={() => setSaleRequestModalOpen(false)}
        onSubmitSuccess={() => {}}
        onToast={showToast}
      />
    </div>
  );
}

