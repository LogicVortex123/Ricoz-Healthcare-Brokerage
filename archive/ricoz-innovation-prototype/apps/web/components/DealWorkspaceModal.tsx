'use client';

import React, { useState } from 'react';
import { Deal } from '../lib/mockData';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Building,
  DollarSign,
  Send,
  Lock,
  Download,
  Eye,
  X
} from 'lucide-react';

interface DealWorkspaceProps {
  deal: Deal;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function DealWorkspaceModal({ deal, onClose, onToast }: DealWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'offers' | 'dataroom' | 'notes'>('checklist');
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [downloadCountdown, setDownloadCountdown] = useState<number>(0);
  
  const [checklist, setChecklist] = useState([
    { id: 'c1', task: 'DCI State Council Registration verified for both parties', done: true, mandatory: true },
    { id: 'c2', task: '3-Year Audited Balance Sheet & P&L validated against ITR-V', done: true, mandatory: true },
    { id: 'c3', task: 'KPME (Karnataka Private Medical Establishments) License current', done: true, mandatory: true },
    { id: 'c4', task: 'AERB Radiation & X-Ray Equipment Safety Certification', done: true, mandatory: true },
    { id: 'c5', task: 'KSPCB Biomedical Waste Management authorization clean', done: true, mandatory: true },
    { id: 'c6', task: 'Commercial Lease Agreement audited (5-yr lock-in verified)', done: false, mandatory: true, warning: 'Pending landlord review' },
    { id: 'c7', task: 'Capital Equipment & Chair Asset Schedule cross-checked', done: true, mandatory: false },
    { id: 'c8', task: 'Staff Employment Agreements & Associate MoUs reviewed', done: false, mandatory: false },
  ]);

  const [offers, setOffers] = useState([
    {
      id: 'off-1',
      round: 'Initial Offer',
      amount: '₹95 Lakh',
      structure: 'Asset Sale (100% Equity & Goodwill)',
      earnestDeposit: '₹10 Lakh',
      status: 'Countered',
      by: 'Dr. Priya V. Sharma',
      date: '05 Nov 2026',
      notes: 'Initial opening valuation based on 3.0x EBITDA',
    },
    {
      id: 'off-2',
      round: 'Seller Counter-Offer',
      amount: '₹1.15 Cr',
      structure: 'Asset Sale with 6-month clinical mentorship handover',
      earnestDeposit: '₹15 Lakh',
      status: 'Active Review',
      by: 'Dr. Ramesh Rao (Seller)',
      date: '07 Nov 2026',
      notes: 'Includes all 4 Intego chairs, OPG 3D unit and 14-year patient retention goodwill',
    },
  ]);

  const [internalNotes, setInternalNotes] = useState([
    {
      id: 'n1',
      author: 'Anand Kumar (Broker)',
      date: '07 Nov 2026, 16:30 IST',
      text: 'Seller Dr. Rao prefers a closing by January 2027 to align with his retirement plans. Buyer Dr. Sharma has pre-approved SBI Doctor Loan financing for ₹90 Lakh.',
    },
    {
      id: 'n2',
      author: 'Neha Mehta (Manager)',
      date: '06 Nov 2026, 11:15 IST',
      text: 'Lease landlord confirmed willingness to transfer commercial lease with standard 5% escalation. Deed draft in progress.',
    },
  ]);

  const [newNote, setNewNote] = useState('');

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
    onToast('Checklist gate status updated.');
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: `n-${Date.now()}`,
      author: 'Anand Kumar (Broker)',
      date: 'Just now',
      text: newNote.trim(),
    };
    setInternalNotes((prev) => [note, ...prev]);
    setNewNote('');
    onToast('Internal note saved. Strictly invisible to buyers and sellers.');
  };

  const handleSimulateSignedUrl = (docName: string, docId: string) => {
    setDownloadingDocId(docId);
    setDownloadCountdown(60);
    onToast(`60-second single-use signed URL generated for ${docName}. Download logged to append-only audit trail.`);

    const interval = setInterval(() => {
      setDownloadCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDownloadingDocId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-card max-w-4xl w-full border border-border shadow-elevation max-h-[92vh] flex flex-col justify-between my-auto">
        {/* Workspace Header */}
        <div className="p-5 border-b border-border bg-surface/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary text-white">
                  {deal.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-border text-ink-muted">
                  Stage: <strong className="text-primary">{deal.stageId.replace('_', ' ').toUpperCase()}</strong>
                </span>
                {deal.hasHardGateWarning && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Hard Gate Incomplete
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-ink mt-1.5">{deal.title}</h2>
              <p className="text-xs text-ink-muted">
                Seller: <strong>{deal.sellerName}</strong> • Buyer: <strong>{deal.buyerName || 'Unassigned'}</strong> • Assigned Broker: <strong>{deal.brokerName}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-ink-muted hover:text-ink rounded-lg text-sm font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation (PRD S28) */}
          <div className="flex gap-2 mt-4 border-b border-border">
            {[
              { id: 'checklist', label: `Stage Checklist (${checklist.filter((c) => c.done).length}/${checklist.length})` },
              { id: 'offers', label: `Offer History (${offers.length})` },
              { id: 'dataroom', label: 'Virtual Data Room (8 Files)' },
              { id: 'notes', label: `Internal Broker Notes (${internalNotes.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Stage Checklist & Hard Gates (Section 10K, AC-11) */}
        {activeTab === 'checklist' && (
          <div className="p-5 overflow-y-auto space-y-4 max-h-[55vh]">
            <div className="bg-primary-50/50 p-3 rounded-lg border border-primary/20 text-xs text-primary flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Statutory Due Diligence Requirements Checklist</p>
                <p className="text-[11px] text-primary/80 mt-0.5">
                  The deal cannot advance into <strong>Initial Offer</strong> or <strong>Letter of Intent</strong> until all mandatory hard gates are verified, or a manager override reason is supplied and audited.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    item.done
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : item.mandatory
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        item.done ? 'bg-success text-white border-success' : 'border-ink-muted bg-white'
                      }`}
                    >
                      {item.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className={`text-xs ${item.done ? 'font-medium text-ink' : 'font-semibold text-ink'}`}>
                        {item.task}
                      </p>
                      {item.warning && !item.done && (
                        <p className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {item.warning}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.mandatory
                        ? 'bg-danger-light text-danger border border-danger/20'
                        : 'bg-surface text-ink-muted border border-border'
                    }`}
                  >
                    {item.mandatory ? 'Hard Gate' : 'Advisory'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Offers & Counter-Offers (Section 10J, F36, F51) */}
        {activeTab === 'offers' && (
          <div className="p-5 overflow-y-auto space-y-4 max-h-[55vh]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted font-medium">Immutable Offer History (Parent-Linked Revisions)</span>
              <button
                onClick={() => onToast('Record Counter-Offer dialogue opened.')}
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-hover"
              >
                Record Revised Offer
              </button>
            </div>

            <div className="space-y-3">
              {offers.map((off, idx) => (
                <div key={off.id} className="p-4 rounded-lg border border-border bg-white shadow-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-ink">{off.round}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary-50 text-primary font-bold">
                        {off.amount}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-border text-ink">
                      {off.status}
                    </span>
                  </div>

                  <p className="text-xs text-ink">{off.structure}</p>
                  <p className="text-[11px] text-ink-muted italic">"{off.notes}"</p>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-ink-muted">
                    <span>Submitted by: <strong>{off.by}</strong></span>
                    <span>{off.date} • Earnest Deposit: {off.earnestDeposit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Virtual Data Room & 60s Signed URLs (Section 10I, AC-10) */}
        {activeTab === 'dataroom' && (
          <div className="p-5 overflow-y-auto space-y-3 max-h-[55vh]">
            <div className="flex items-center justify-between bg-surface p-2.5 rounded-lg border border-border text-xs">
              <span className="text-ink-muted">Storage: Private S3 Bucket (ap-south-1 Mumbai)</span>
              <span className="text-primary font-semibold">Security: Short-lived 60-Second Signed URLs</span>
            </div>

            {[
              { id: 'd-1', name: 'FY 2024-25 Audited P&L and Balance Sheet.pdf', category: 'Financials', size: '2.4 MB' },
              { id: 'd-2', name: 'ITR-V Acknowledgement Certificates (3 Years).pdf', category: 'Tax Records', size: '3.1 MB' },
              { id: 'd-3', name: 'KPME Registration Certificate (Valid till 2029).pdf', category: 'Licences & Regs', size: '1.2 MB' },
              { id: 'd-4', name: 'Biomedical Waste Authorisation (KSPCB).pdf', category: 'Licences & Regs', size: '980 KB' },
              { id: 'd-5', name: 'AERB X-Ray Equipment Registration.pdf', category: 'Licences & Regs', size: '1.4 MB' },
              { id: 'd-6', name: 'Commercial Lease Agreement (10 Yr, 4 Yrs left).pdf', category: 'Property Lease', size: '4.8 MB' },
            ].map((file) => {
              const isDownloading = downloadingDocId === file.id;

              return (
                <div key={file.id} className="p-3 rounded-lg border border-border bg-white flex items-center justify-between hover:bg-surface/30">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-ink">{file.name}</p>
                      <p className="text-[11px] text-ink-muted">
                        Category: {file.category} • Size: {file.size} • Malware Scan: Clean
                      </p>
                    </div>
                  </div>

                  <div>
                    {isDownloading ? (
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 animate-pulse">
                        URL Expires in {downloadCountdown}s
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSimulateSignedUrl(file.name, file.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover rounded flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Get Signed URL</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Internal Notes (Section 10G) */}
        {activeTab === 'notes' && (
          <div className="p-5 overflow-y-auto space-y-4 max-h-[55vh]">
            <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <span>
                <strong>Confidential Internal Notes:</strong> Visible exclusively to assigned brokers and managers. Never returned by seller or buyer API endpoints.
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log internal negotiation intelligence, banker notes, or diligence observations..."
                className="flex-1 p-2 bg-surface border border-border rounded-input text-xs font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-hover flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>

            <div className="space-y-3">
              {internalNotes.map((n) => (
                <div key={n.id} className="p-3 bg-surface rounded-lg border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between text-ink-muted text-[11px]">
                    <span className="font-bold text-ink">{n.author}</span>
                    <span>{n.date}</span>
                  </div>
                  <p className="text-ink leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
          <span className="text-[11px] text-ink-muted">
            All actions logged to immutable DPDP audit trail with client IP.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-white border border-border text-ink hover:bg-surface rounded"
          >
            Close Deal Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

