'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  ChevronRight,
  Command,
  Database,
  HelpCircle,
  LayoutGrid,
  Menu,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';

export type Role = 'broker' | 'seller' | 'buyer' | 'admin';
export type DbState = 'checking' | 'connected' | 'error';

export const WORKSPACES: {
  id: Role;
  label: string;
  description: string;
  user: string;
  userRole: string;
  icon: React.ElementType;
}[] = [
  { id: 'broker', label: 'Broker CRM', description: 'Pipeline, leads & tasks', user: 'Anand Kumar', userRole: 'Sr. Healthcare Broker', icon: LayoutGrid },
  { id: 'seller', label: 'Seller Portal', description: 'Listing, financials & DD', user: 'Dr. Ramesh Rao', userRole: 'Practice Owner', icon: Stethoscope },
  { id: 'buyer', label: 'Buyer Discovery', description: 'Confidential marketplace', user: 'Dr. Priya Sharma', userRole: 'Verified Buyer', icon: Search },
  { id: 'admin', label: 'Compliance', description: 'Moderation & audit trail', user: 'Anushka', userRole: 'Super Admin', icon: ShieldCheck },
];

function initials(name: string) {
  return name.replace('Dr. ', '').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

/* ─────────────────────────── Sidebar ─────────────────────────── */

function Sidebar({
  role,
  onRoleChange,
  dbState,
  onOpenDb,
  onOpenNotifications,
  unread,
  onNavigate,
}: {
  role: Role;
  onRoleChange: (r: Role) => void;
  dbState: DbState;
  onOpenDb: () => void;
  onOpenNotifications: () => void;
  unread: number;
  onNavigate?: () => void;
}) {
  const ws = WORKSPACES.find((w) => w.id === role)!;
  const dbMeta = {
    checking: { dot: 'bg-slate-400', label: 'Checking…', sub: 'Pinging cluster' },
    connected: { dot: 'bg-emerald-400', label: 'Connected', sub: 'ricoz_healthcare' },
    error: { dot: 'bg-red-400', label: 'Unreachable', sub: 'Showing demo data' },
  }[dbState];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-sidebar to-sidebar-deep text-white">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/20">
          <span className="font-bold text-[15px] tracking-tight">R</span>
          <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-sidebar" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-[15px] tracking-tight">Ricoz</p>
          <p className="text-[11px] text-white/45">Practice Transitions</p>
        </div>
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-5 space-y-7">
        {/* Workspaces */}
        <div>
          <p className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/35">Workspaces</p>
          <ul className="space-y-1">
            {WORKSPACES.map((w) => {
              const Icon = w.icon;
              const active = w.id === role;
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onRoleChange(w.id);
                      onNavigate?.();
                    }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      active ? 'bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? 'bg-accent text-sidebar-deep' : 'bg-white/[0.06] text-white/60 group-hover:text-white/90'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[13px] font-medium ${active ? 'text-white' : 'text-white/75'}`}>{w.label}</span>
                      <span className="block text-[11px] text-white/40 truncate">{w.description}</span>
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tools */}
        <div>
          <p className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/35">Tools</p>
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => {
                  onOpenDb();
                  onNavigate?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.05]"
              >
                <Database className="w-4 h-4" /> Database Inspector
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  onOpenNotifications();
                  onNavigate?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.05]"
              >
                <Bell className="w-4 h-4" /> Notifications
                {unread > 0 && (
                  <span className="ml-auto text-[10px] font-semibold bg-accent text-sidebar-deep rounded-full px-1.5 py-0.5">{unread}</span>
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* Upsell / trust card */}
        <div className="mx-1 rounded-xl p-4 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.07]">
          <div className="flex items-center gap-2 text-[12px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Confidential by design
          </div>
          <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">
            4-tier disclosure, clickwrap NDAs and an immutable audit trail on every deal.
          </p>
        </div>
      </div>

      {/* DB status + user */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        <button
          type="button"
          onClick={onOpenDb}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] text-left"
        >
          <span className="relative flex w-2 h-2">
            {dbState === 'connected' && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
            <span className={`relative inline-flex rounded-full w-2 h-2 ${dbMeta.dot}`} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[12px] font-medium">MongoDB · {dbMeta.label}</span>
            <span className="block text-[11px] text-white/40 font-mono truncate">{dbMeta.sub}</span>
          </span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/80 to-primary-200/60 text-sidebar-deep flex items-center justify-center text-[11px] font-bold">
            {initials(ws.user)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[13px] font-medium truncate">{ws.user}</p>
            <p className="text-[11px] text-white/45 truncate">{ws.userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Command palette ─────────────────────────── */

type PaletteItem = { id: string; label: string; hint: string; icon: React.ElementType; run: () => void };

function CommandPalette({ items, onClose }: { items: PaletteItem[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => items.filter((i) => (i.label + ' ' + i.hint).toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => setIdx(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[idx]) {
      filtered[idx].run();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-[300] bg-ink/40 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-elevation border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Search className="w-4 h-4 text-ink-light" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to a workspace or tool…"
            className="bare flex-1 bg-transparent text-sm outline-none border-0 placeholder:text-ink-light"
          />
          <kbd className="text-[10px] font-medium text-ink-muted border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-[420px] overflow-y-auto p-2">
          {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-muted">No results for “{q}”</li>}
          {filtered.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${i === idx ? 'bg-primary-50' : ''}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === idx ? 'bg-primary text-white' : 'bg-surface-subtle text-ink-muted'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink">{item.label}</span>
                    <span className="block text-xs text-ink-muted truncate">{item.hint}</span>
                  </span>
                  {i === idx && <CornerDownLeft className="w-3.5 h-3.5 text-ink-light" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────── Shell ─────────────────────────── */

export function AppShell({
  role,
  onRoleChange,
  dbState,
  onOpenDb,
  onOpenNotifications,
  unread,
  children,
}: {
  role: Role;
  onRoleChange: (r: Role) => void;
  dbState: DbState;
  onOpenDb: () => void;
  onOpenNotifications: () => void;
  unread: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const ws = WORKSPACES.find((w) => w.id === role)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const paletteItems: PaletteItem[] = [
    ...WORKSPACES.map((w) => ({ id: w.id, label: w.label, hint: w.description, icon: w.icon, run: () => onRoleChange(w.id) })),
    { id: 'db', label: 'Database Inspector', hint: 'See what is stored in MongoDB', icon: Database, run: onOpenDb },
    { id: 'notif', label: 'Notifications', hint: `${unread} unread`, icon: Bell, run: onOpenNotifications },
  ];

  const sidebarProps = { role, onRoleChange, dbState, onOpenDb, onOpenNotifications, unread };

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[264px] z-40">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[120] bg-ink/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)}>
          <aside className="w-[264px] h-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <Sidebar {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-border">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-ink-muted hover:bg-surface-subtle"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
              <span className="text-ink-muted hidden sm:inline">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-ink-light hidden sm:inline" />
              <span className="font-semibold text-ink truncate">{ws.label}</span>
            </nav>

            {/* Search trigger */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="ml-auto hidden md:flex items-center gap-2 w-72 h-9 px-3 rounded-lg bg-surface-subtle border border-border text-[13px] text-ink-light hover:border-primary/30 hover:bg-white"
            >
              <Search className="w-4 h-4" />
              <span>Search or jump to…</span>
              <kbd className="ml-auto flex items-center gap-0.5 text-[10px] font-medium text-ink-muted bg-white border border-border rounded px-1.5 py-0.5">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>

            <div className="flex items-center gap-1.5 ml-auto md:ml-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="md:hidden p-2 rounded-lg text-ink-muted hover:bg-surface-subtle"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenDb}
                title="Database Inspector"
                className={`hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border text-[12px] font-medium ${
                  dbState === 'connected'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
                    : dbState === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-border bg-white text-ink-muted'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dbState === 'connected' ? 'bg-emerald-500' : dbState === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
                <Database className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{dbState === 'connected' ? 'Live data' : dbState === 'error' ? 'DB offline' : 'Checking'}</span>
              </button>
              <button
                type="button"
                title="Help"
                onClick={() => setPaletteOpen(true)}
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-subtle hover:text-ink"
              >
                <HelpCircle className="w-[18px] h-[18px]" />
              </button>
              <button
                type="button"
                onClick={onOpenNotifications}
                title="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:bg-surface-subtle hover:text-ink"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger ring-2 ring-white" />}
              </button>
              <div className="w-px h-6 bg-border mx-1.5 hidden sm:block" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-[11px] font-bold">
                  {initials(ws.user)}
                </div>
                <div className="hidden xl:block leading-tight">
                  <p className="text-[13px] font-medium text-ink">{ws.user}</p>
                  <p className="text-[11px] text-ink-muted">{ws.userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main key={role} className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in">
          {children}
        </main>

        <footer className="px-4 sm:px-6 lg:px-8 py-5 border-t border-border">
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-light">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> © 2026 Ricoz Healthcare Brokerage
            </span>
            <span>DPDP Act 2025 · AES-256 at rest · Immutable audit log</span>
          </div>
        </footer>
      </div>

      {paletteOpen && <CommandPalette items={paletteItems} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
