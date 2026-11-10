'use client';

import React, { useState } from 'react';
import {
  INITIAL_AUDIT_LOGS,
  AuditLogItem,
} from '../lib/mockData';
import { PageHeader, Tabs, Toast, Pill, KpiCard } from './ui';
import { Users, KeyRound } from 'lucide-react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileSearch,
  Search,
  History,
  AlertTriangle,
  UserCheck,
  Building,
  Key,
  Database,
  Lock
} from 'lucide-react';

export function AdminDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [activeTab, setActiveTab] = useState<'moderation' | 'verification' | 'audit'>('moderation');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [pendingListings, setPendingListings] = useState([
    {
      id: 'lst-mod-01',
      practiceId: 'pr-blr-22',
      sellerName: 'Dr. Sudhir Pai',
      title: 'Orthodontic Studio, Indiranagar',
      chairs: 3,
      revenueBand: '₹50L - ₹1Cr',
      submittedAt: 'Today, 11:20 AM',
      anonymizationCheck: 'Passed (No street address or signage found in teaser)',
    },
    {
      id: 'lst-mod-02',
      practiceId: 'pr-mum-81',
      sellerName: 'Dr. Alok Verma',
      title: 'Cosmetic Dental Hub, Powai',
      chairs: 5,
      revenueBand: '₹1Cr - ₹2Cr',
      submittedAt: 'Yesterday',
      anonymizationCheck: 'Passed',
    },
  ]);

  const [doctorVerifications, setDoctorVerifications] = useState([
    {
      id: 'vr-101',
      name: 'Dr. Priya V. Sharma',
      sector: 'Dental',
      council: 'Karnataka State Dental Council',
      regNo: 'DCI-KA-19842',
      degree: 'BDS, MDS (Orthodontics)',
      certificateDoc: 'KDC_Registration_Cert_2024.pdf',
      status: 'pending',
    },
    {
      id: 'vr-102',
      name: 'Dr. Cyrus Bharucha',
      sector: 'Veterinary',
      council: 'Maharashtra State Veterinary Council',
      regNo: 'MSVC-07721',
      degree: 'BVSc & AH, MVSc (Small Animal Surgery)',
      certificateDoc: 'MSVC_Practicing_Licence.pdf',
      status: 'pending',
    },
    {
      id: 'vr-103',
      name: 'Dr. Sanjana Malhotra',
      sector: 'Specialist Medical',
      council: 'Delhi Medical Council',
      regNo: 'DMC-44102',
      degree: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      certificateDoc: 'DMC_Registration_Certificate.pdf',
      status: 'pending',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApproveListing = (id: string, title: string) => {
    setPendingListings((prev) => prev.filter((item) => item.id !== id));
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      actor: 'Admin Anushka',
      role: 'SA',
      action: 'LISTING_APPROVED_TO_DISCOVERY',
      entity: 'Practice Listing',
      entityId: title,
      timestamp: 'Just now',
      ip: '14.139.241.2',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(`Approved "${title}"! Tier 0/1 public cards published.`);
  };

  const handleRejectListing = (id: string, title: string) => {
    setPendingListings((prev) => prev.filter((item) => item.id !== id));
    showToast(`Changes requested for "${title}". Seller notified.`);
  };

  const handleVerifyDoctor = (id: string, name: string) => {
    setDoctorVerifications((prev) => prev.filter((d) => d.id !== id));
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      actor: 'Admin Anushka',
      role: 'SA',
      action: 'DOCTOR_CREDENTIAL_VERIFIED',
      entity: 'DCI Registration',
      entityId: name,
      timestamp: 'Just now',
      ip: '14.139.241.2',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(`Verified ${name}! Verified Buyer badge active.`);
  };

  return (
    <div className="space-y-7">
      {/* Toast Alert */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <PageHeader
        title="Compliance Console"
        badge={<Pill tone="red"><ShieldAlert className="w-3 h-3" /> Break-glass governed</Pill>}
        subtitle="Least-privilege by default — admins hold zero standing access to raw medical or financial data."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Registered users" value="84" sub="Dentists, brokers & group acquirers" icon={Users} tone="teal" />
        <KpiCard label="Pending moderation" value={pendingListings.length.toString()} sub="SLA under 24 hours" icon={FileSearch} tone="amber" />
        <KpiCard label="Audit records" value="849" sub="Append-only, tamper-evident" icon={History} tone="blue" />
        <KpiCard label="Key management" value="Active" sub="AES-256 envelope encryption" icon={KeyRound} tone="green" />
      </div>

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'moderation', label: 'Listing moderation', icon: FileSearch, count: pendingListings.length },
          { id: 'verification', label: 'Doctor verification', icon: UserCheck, count: doctorVerifications.length },
          { id: 'audit', label: 'Audit trail', icon: History, count: auditLogs.length },
        ]}
      />

      {/* Tab 1: Listing Moderation Queue (PRD S34 & AC-05) */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-ink">Practice Listing Moderation Queue</h3>
            <p className="text-xs text-ink-muted">
              Confirm that public titles and teaser fields contain zero identifying signage, doctor names, or street addresses prior to publishing.
            </p>
          </div>

          <div className="space-y-3">
            {pendingListings.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-border bg-surface/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-ink">{item.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      {item.anonymizationCheck}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Submitted by: <strong>{item.sellerName}</strong> • {item.chairs} Chairs • {item.revenueBand} • {item.submittedAt}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRejectListing(item.id, item.title)}
                    className="px-3 py-1.5 text-xs font-semibold text-danger bg-danger-light hover:bg-danger hover:text-white rounded transition-colors"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleApproveListing(item.id, item.title)}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 rounded transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve to Discovery
                  </button>
                </div>
              </div>
            ))}

            {pendingListings.length === 0 && (
              <div className="py-8 text-center text-xs text-ink-muted border border-dashed border-border rounded-lg">
                Moderation Queue Clear! All submissions reviewed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Doctor Verification Queue (PRD S35 & AC-01) */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-ink">State Dental Council (DCI) Verification Queue</h3>
            <p className="text-xs text-ink-muted">
              Verify dental practitioners against state council registers to ensure only licensed doctors unlock confidential dental listings.
            </p>
          </div>

          <div className="space-y-3">
            {doctorVerifications.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-lg border border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-ink">{doc.name}</h4>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary-50 text-primary border border-primary/20 font-bold">
                      {doc.regNo}
                    </span>
                    <span className="text-[10px] text-ink-muted">({doc.council})</span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Qualifications: {doc.degree} • Uploaded Certificate: <strong className="text-ink">{doc.certificateDoc}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Previewing certificate ${doc.certificateDoc}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-primary bg-surface border border-border hover:bg-white rounded"
                  >
                    View Document
                  </button>
                  <button
                    onClick={() => handleVerifyDoctor(doc.id, doc.name)}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover rounded flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm & Grant Badge
                  </button>
                </div>
              </div>
            ))}

            {doctorVerifications.length === 0 && (
              <div className="py-8 text-center text-xs text-ink-muted border border-dashed border-border rounded-lg">
                All doctor verification requests resolved!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Append-Only Tamper-Proof Audit Log (PRD S39 & AC-14) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-card p-5 border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Database className="w-4 h-4 text-primary" />
                Tamper-Proof Audit Trail
              </h3>
              <p className="text-xs text-ink-muted">
                Written by insert-only database user. No user or administrator can alter or delete logged actions.
              </p>
            </div>
            <span className="text-xs text-ink-muted bg-surface px-2.5 py-1 rounded border border-border font-mono">
              Retention: 7 Years
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-ink-muted font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (IST)</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target Entity & Identifier</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface/50 font-mono text-[11px]">
                    <td className="py-2.5 px-3 text-ink-muted whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-3 text-ink font-semibold">
                      {log.actor} <span className="text-[10px] text-primary">[{log.role}]</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border font-bold text-[10px] text-ink">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-ink truncate max-w-[220px]" title={log.entityId}>
                      {log.entity}: {log.entityId}
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

