'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Deal,
  Lead,
  TaskItem,
  PIPELINE_STAGES,
  INITIAL_DEALS,
  INITIAL_LEADS,
  INITIAL_TASKS,
} from '../lib/mockData';
import {
  Kanban,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Building,
  FileCheck,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  MessageSquare,
  X,
} from 'lucide-react';
import { DealWorkspaceModal } from './DealWorkspaceModal';
import { PageHeader, Tabs, KpiCard, Toast, Pill } from './ui';
import { PawPrint, HeartPulse, Stethoscope } from 'lucide-react';

function SectorBadge({ sector }: { sector: Deal['sector'] }) {
  if (sector === 'veterinary')
    return (
      <Pill tone="amber">
        <PawPrint className="w-3 h-3" /> Veterinary
      </Pill>
    );
  if (sector === 'specialist_medical')
    return (
      <Pill tone="violet">
        <HeartPulse className="w-3 h-3" /> Medical
      </Pill>
    );
  return (
    <Pill tone="teal">
      <Stethoscope className="w-3 h-3" /> Dental
    </Pill>
  );
}

type Sector = 'all' | Deal['sector'];

const SECTORS: { id: Sector; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dental', label: 'Dental' },
  { id: 'veterinary', label: 'Veterinary' },
  { id: 'specialist_medical', label: 'Specialist Medical' },
];

// Convert a MongoDB practice document into the Deal shape the UI uses.
function practiceToDeal(p: any): Deal {
  const checklist = p.checklistProgress ?? { completed: 0, total: 8 };
  return {
    id: p._id,
    code: p.code,
    sector: p.sector,
    title: p.title,
    specialty: p.specialty,
    city: p.city,
    zone: p.zone,
    chairs: parseInt(p.operatoriesOrBeds, 10) || 0,
    operatoriesLabel: p.operatoriesOrBeds,
    revenueBand: p.revenueBand,
    exactRevenue: p.exactRevenue,
    ebitda: p.ebitda,
    askingPrice: p.askingPrice,
    transitionType: p.transitionType,
    stageId: p.stageId,
    sellerName: p.sellerName,
    brokerName: p.brokerName,
    daysInStage: p.daysInStage ?? 0,
    checklistProgress: checklist,
    verifiedDocuments: p.verifiedDocuments ?? 0,
    totalDocuments: p.totalDocuments ?? 0,
    notesCount: 0,
    nextTaskDue: '',
    hasHardGateWarning: p.stageId === 'due_diligence' && checklist.completed < checklist.total,
  };
}

// "₹1.15 Cr" / "₹98 Lakh" → rupees
function parseInr(v?: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return 0;
  if (/cr/i.test(v)) return n * 1e7;
  if (/l(akh|ac)?/i.test(v)) return n * 1e5;
  return n;
}

function formatCr(rupees: number) {
  return `₹${(rupees / 1e7).toFixed(2)} Cr`;
}

export function BrokerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dataSource, setDataSource] = useState<'loading' | 'mongodb' | 'mock'>('loading');
  const [dbError, setDbError] = useState<string | null>(null);
  const [sector, setSector] = useState<Sector>('all');
  const [hideEmptyStages, setHideEmptyStages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leads] = useState<Lead[]>(INITIAL_LEADS);

  const loadDeals = useCallback(async () => {
    try {
      const res = await fetch('/api/practices', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'API error');
      setDeals(json.data.map(practiceToDeal));
      setDataSource('mongodb');
      setDbError(null);
    } catch (e: any) {
      setDeals(INITIAL_DEALS);
      setDataSource('mock');
      setDbError(e.message);
    }
  }, []);

  useEffect(() => {
    loadDeals();
    window.addEventListener('practices:changed', loadDeals);
    return () => window.removeEventListener('practices:changed', loadDeals);
  }, [loadDeals]);

  const visibleDeals = sector === 'all' ? deals : deals.filter((d) => d.sector === sector);
  const pipelineValue = visibleDeals.reduce((sum, d) => sum + parseInr(d.askingPrice), 0);
  const stagesToShow = hideEmptyStages
    ? PIPELINE_STAGES.filter((s) => visibleDeals.some((d) => d.stageId === s.id))
    : PIPELINE_STAGES;
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'leads' | 'tasks'>('pipeline');
  const [workspaceDeal, setWorkspaceDeal] = useState<Deal | null>(null);
  const [stageModalDeal, setStageModalDeal] = useState<Deal | null>(null);
  const [targetStage, setTargetStage] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const openStageModal = (deal: Deal) => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === deal.stageId);
    setTargetStage(idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1].id : deal.stageId);
    setOverrideReason('');
    setGateError(null);
    setStageModalDeal(deal);
  };

  const [gateError, setGateError] = useState<string | null>(null);

  const confirmStageTransition = async () => {
    if (!stageModalDeal || saving) return;
    if (
      stageModalDeal.stageId === 'due_diligence' &&
      targetStage === 'initial_offer' &&
      stageModalDeal.checklistProgress.completed < stageModalDeal.checklistProgress.total &&
      !overrideReason.trim()
    ) {
      setGateError('Hard gate: checklist incomplete. Enter a manager override reason to continue.');
      return;
    }
    const stageName = PIPELINE_STAGES.find((s) => s.id === targetStage)?.name;

    if (dataSource !== 'mongodb') {
      setDeals((prev) =>
        prev.map((d) => (d.id === stageModalDeal.id ? { ...d, stageId: targetStage, daysInStage: 0, hasHardGateWarning: false } : d))
      );
      setStageModalDeal(null);
      showToast(`${stageModalDeal.code} → ${stageName} (demo data only, NOT saved — DB unreachable)`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/practices/${stageModalDeal.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: targetStage, overrideReason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error?.message || `HTTP ${res.status}`);
      setDeals((prev) => prev.map((d) => (d.id === stageModalDeal.id ? practiceToDeal(json.data) : d)));
      setStageModalDeal(null);
      showToast(`Saved to MongoDB ✓ ${stageModalDeal.code} → ${stageName}`);
      window.dispatchEvent(new Event('practices:changed'));
    } catch (e: any) {
      setGateError(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
    );
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const overdueTasks = tasks.filter((t) => t.isOverdue && t.status === 'pending').length;

  return (
    <div className="space-y-7">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Deal Pipeline"
        badge={
          dataSource === 'mongodb' ? (
            <Pill tone="green">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
            </Pill>
          ) : dataSource === 'mock' ? (
            <span title={dbError ?? ''}>
              <Pill tone="red">DB offline · demo data</Pill>
            </span>
          ) : (
            <Pill tone="neutral">Syncing…</Pill>
          )
        }
        subtitle={<>Good to see you, Anand. {dataSource === 'loading' ? 'Loading your pipeline…' : <>You have <strong className="text-ink font-semibold">{deals.length} active transitions</strong> across 3 sectors.</>}</>}
        actions={
          <>
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className="h-9 px-3.5 rounded-lg border border-border bg-white text-[13px] font-medium text-ink hover:bg-surface-subtle flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-ink-muted" /> {pendingTasks} open tasks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className="h-9 px-3.5 rounded-lg bg-primary text-white text-[13px] font-medium hover:bg-primary-hover shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New lead
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Active deals"
          value={dataSource === 'loading' ? '—' : visibleDeals.length.toString()}
          sub={sector === 'all' ? 'Across all sectors' : SECTORS.find((s) => s.id === sector)!.label}
          icon={Building}
          tone="teal"
        />
        <KpiCard
          label="Pipeline value"
          value={dataSource === 'loading' ? '—' : formatCr(pipelineValue)}
          sub={`Projected fee ${formatCr(pipelineValue * 0.04)} at 4%`}
          icon={TrendingUp}
          tone="blue"
        />
        <KpiCard
          label="Pending tasks"
          value={pendingTasks.toString()}
          sub={overdueTasks > 0 ? `${overdueTasks} overdue — needs attention` : 'Everything on track'}
          icon={Clock}
          tone={overdueTasks > 0 ? 'red' : 'amber'}
          trend={overdueTasks > 0 ? { text: `${overdueTasks} overdue`, positive: false } : undefined}
        />
        <KpiCard label="Buyer vetting rate" value="92%" sub="DCI registration verified" icon={FileCheck} tone="green" />
      </div>

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'pipeline', label: 'Pipeline', icon: Kanban, count: visibleDeals.length },
          { id: 'leads', label: 'Leads', icon: Users, count: leads.length },
          { id: 'tasks', label: 'Tasks', icon: Clock, count: pendingTasks },
        ]}
      />

      {/* ── PIPELINE TAB ── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center p-1 rounded-lg bg-surface-subtle border border-border">
              {SECTORS.map((s) => {
                const count = s.id === 'all' ? deals.length : deals.filter((d) => d.sector === s.id).length;
                const active = sector === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSector(s.id)}
                    className={`px-3 h-7 rounded-md text-[12px] font-medium flex items-center gap-1.5 ${
                      active ? 'bg-white text-ink shadow-subtle ring-1 ring-border' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {s.label}
                    <span className={`text-[11px] ${active ? 'text-primary font-semibold' : 'text-ink-light'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-[12px] text-ink-muted cursor-pointer select-none">
              <span>Hide empty stages</span>
              <button
                type="button"
                role="switch"
                aria-checked={hideEmptyStages}
                onClick={() => setHideEmptyStages((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${hideEmptyStages ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    hideEmptyStages ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </label>
          </div>

          {stagesToShow.length === 0 && (
            <div className="card border-dashed p-12 text-center">
              <Kanban className="w-8 h-8 text-ink-light mx-auto" />
              <p className="mt-3 text-sm font-medium text-ink">{dataSource === 'loading' ? 'Loading deals…' : 'No deals in this sector yet'}</p>
              <p className="text-[13px] text-ink-muted mt-1">New seller submissions will appear here automatically.</p>
            </div>
          )}

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
            {stagesToShow.map((stage) => {
              const stageDeals = visibleDeals.filter((d) => d.stageId === stage.id);
              const idx = PIPELINE_STAGES.findIndex((s) => s.id === stage.id);
              const phase = idx < 4 ? 'bg-blue-500' : idx < 8 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <section key={stage.id} className="w-[296px] flex-shrink-0 flex flex-col rounded-2xl bg-surface-subtle/80 border border-border-subtle">
                  <header className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${phase}`} />
                      <h3 className="text-[13px] font-semibold text-ink truncate">{stage.name}</h3>
                      <span className="ml-auto text-[11px] font-semibold text-ink-muted bg-white rounded-full px-2 py-0.5 ring-1 ring-border">
                        {stageDeals.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-light mt-1 truncate pl-4" title={stage.gate}>
                      Gate · {stage.gate}
                    </p>
                  </header>

                  <div className="px-2.5 pb-2.5 space-y-2.5 flex-1">
                    {stageDeals.map((deal) => {
                      const pct = Math.round((deal.checklistProgress.completed / Math.max(deal.checklistProgress.total, 1)) * 100);
                      return (
                        <article
                          key={deal.id}
                          className="group bg-white rounded-xl border border-border p-4 shadow-subtle hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <SectorBadge sector={deal.sector} />
                            <span className="text-[11px] text-ink-light font-mono">{deal.code}</span>
                          </div>

                          <h4 className="mt-2.5 text-[13.5px] font-semibold text-ink leading-snug line-clamp-2">{deal.title}</h4>
                          <p className="mt-1 text-[12px] text-ink-muted truncate">{deal.transitionType}</p>

                          <div className="mt-3.5 flex items-end justify-between">
                            <div>
                              <p className="text-[11px] text-ink-light">Asking</p>
                              <p className="text-[17px] font-semibold text-ink tracking-tight tabular">{deal.askingPrice}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] text-ink-light">Revenue</p>
                              <p className="text-[12px] font-medium text-ink-muted">{deal.revenueBand}</p>
                            </div>
                          </div>

                          <div className="mt-3.5">
                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                              <span className="text-ink-muted">Diligence gates</span>
                              <span className="font-semibold text-ink tabular">
                                {deal.checklistProgress.completed}/{deal.checklistProgress.total}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {deal.hasHardGateWarning && (
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-600/15 rounded-lg px-2.5 py-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              Override needed to pass hard gate
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-2">
                            <span className="text-[11px] text-ink-light flex items-center gap-1 mr-auto whitespace-nowrap" title="Days in current stage">
                              <Clock className="w-3 h-3" /> {deal.daysInStage}d
                            </span>
                            <button
                              type="button"
                              onClick={() => setWorkspaceDeal(deal)}
                              title="Open deal workspace"
                              className="h-7 px-2.5 rounded-md text-[12px] font-medium text-ink-muted hover:text-ink hover:bg-surface-subtle flex items-center gap-1"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" /> Open
                            </button>
                            <button
                              type="button"
                              onClick={() => openStageModal(deal)}
                              className="h-7 px-2.5 rounded-md text-[12px] font-medium bg-primary text-white hover:bg-primary-hover flex items-center gap-0.5"
                            >
                              Advance <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </article>
                      );
                    })}

                    {stageDeals.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-[12px] text-ink-light">
                        No deals here
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LEADS TAB ── */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink">Intake Leads & Enquiries</h3>
              <p className="text-xs text-ink-muted mt-0.5">Buyer registrations, seller enquiries, and valuation requests</p>
            </div>
            <button
              onClick={() => showToast('New Lead intake form opened.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Lead
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-ink-muted font-semibold border-b border-border">
                <tr>
                  {['Name & Contact', 'Type', 'City', 'Specialty', 'Est. Value', 'Broker', 'Status', ''].map((h) => (
                    <th key={h} className="py-2.5 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{lead.name}</div>
                      <div className="text-[10px] text-ink-muted">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lead.type === 'seller' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {lead.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-muted">{lead.city}</td>
                    <td className="py-3 px-4 font-medium text-ink">{lead.specialty}</td>
                    <td className="py-3 px-4 font-bold text-primary">{lead.budgetOrRevenue}</td>
                    <td className="py-3 px-4 text-ink-muted">{lead.assignedTo}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold capitalize border ${
                        lead.status === 'qualified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : lead.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-surface-subtle text-ink-muted border-border'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => showToast(`Opening lead details for ${lead.name}`)}
                        className="text-primary hover:text-primary-hover font-semibold text-xs hover:underline"
                      >
                        Qualify →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TASKS TAB ── */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-card border border-border shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-sm text-ink">Broker Tasks & SLA Reminders</h3>
            <p className="text-xs text-ink-muted mt-0.5">Auto SLA timers for diligence, credentials, and NDA follow-ups</p>
          </div>
          <div className="p-4 space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  task.status === 'completed'
                    ? 'bg-surface-subtle border-border opacity-60'
                    : task.isOverdue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      task.status === 'completed'
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-ink-muted hover:border-primary'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary">{task.dealCode}</span>
                      <span className={`text-xs ${task.status === 'completed' ? 'line-through text-ink-muted' : 'font-medium text-ink'}`}>
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-0.5">
                      <span>{task.assignedTo}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.dueAt}
                      </span>
                      {task.isOverdue && task.status !== 'completed' && (
                        <span className="text-red-600 font-semibold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleTask(task.id)}
                  className="text-xs font-semibold px-3 py-1 rounded-md bg-surface-subtle border border-border hover:bg-white hover:border-primary/30 text-ink transition-colors whitespace-nowrap"
                >
                  {task.status === 'completed' ? 'Reopen' : 'Complete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STAGE TRANSITION MODAL ── */}
      {stageModalDeal && (
        <div className="modal-overlay fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setStageModalDeal(null)}>
          <div
            className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{stageModalDeal.code}</span>
                <h3 className="font-bold text-base text-ink mt-0.5">Advance Deal Stage</h3>
              </div>
              <button onClick={() => setStageModalDeal(null)} className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-surface-subtle">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Target Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="w-full p-2.5 bg-surface-subtle border border-border rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-primary"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — Gate: {s.gate}</option>
                  ))}
                </select>
              </div>

              <div className="bg-surface-subtle rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-ink">Due Diligence Checklist</span>
                  <span className="font-bold text-primary">
                    {stageModalDeal.checklistProgress.completed}/{stageModalDeal.checklistProgress.total} complete
                  </span>
                </div>
                <div className="w-full bg-surface-subtle rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(stageModalDeal.checklistProgress.completed / stageModalDeal.checklistProgress.total) * 100}%` }}
                  />
                </div>
              </div>

              {stageModalDeal.checklistProgress.completed < stageModalDeal.checklistProgress.total && (
                <div>
                  <label className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Manager Override Reason (required)
                  </label>
                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter audit justification for advancing before all items are verified..."
                    className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              )}

              {gateError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5">{gateError}</div>
              )}
            </div>

            <div className="p-5 pt-0 flex gap-3 justify-end">
              <button
                onClick={() => setStageModalDeal(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-subtle rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStageTransition}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {saving ? 'Saving…' : 'Confirm Advance'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Workspace Modal */}
      {workspaceDeal && (
        <DealWorkspaceModal
          deal={workspaceDeal}
          onClose={() => setWorkspaceDeal(null)}
          onToast={showToast}
        />
      )}
    </div>
  );
}
