'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

/* Page header: title, subtitle, badges and actions — no card chrome. */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="page-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* Underline tabs */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: React.ElementType; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`group flex items-center gap-2 pb-3 pt-1 border-b-2 text-[13px] font-medium whitespace-nowrap ${
                isActive ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-ink-light group-hover:text-ink-muted'}`} />}
              {label}
              {count !== undefined && (
                <span
                  className={`text-[11px] font-semibold rounded-full px-1.5 min-w-[20px] text-center ${
                    isActive ? 'bg-primary-50 text-primary' : 'bg-surface-subtle text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const TONES = {
  teal: 'bg-primary-50 text-primary',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  green: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
} as const;

export type Tone = keyof typeof TONES;

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'teal',
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone?: Tone;
  trend?: { text: string; positive?: boolean };
}) {
  return (
    <div className="card p-5 hover:shadow-lift transition-shadow">
      <div className="flex items-start justify-between">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${TONES[tone]}`}>
          <Icon className="w-5 h-5" />
        </span>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              trend.positive === false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>
      <p className="mt-4 text-[13px] text-ink-muted">{label}</p>
      <p className="mt-1 text-[26px] leading-8 font-semibold tracking-tight text-ink tabular">{value}</p>
      {sub && <p className="mt-1 text-[12px] text-ink-light">{sub}</p>}
    </div>
  );
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  const isError = /fail|error/i.test(message);
  return (
    <div className="fixed bottom-6 right-6 z-[250] max-w-sm animate-slide-up">
      <div className="flex items-start gap-3 bg-ink text-white text-[13px] pl-4 pr-3 py-3 rounded-xl shadow-elevation">
        <CheckCircle2 className={`w-[18px] h-[18px] flex-shrink-0 mt-px ${isError ? 'text-red-400' : 'text-accent'}`} />
        <span className="leading-snug">{message}</span>
        <button type="button" onClick={onClose} className="ml-1 p-0.5 rounded text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Pill({ children, tone = 'teal' }: { children: React.ReactNode; tone?: Tone | 'neutral' }) {
  const cls =
    tone === 'neutral'
      ? 'bg-surface-subtle text-ink-muted ring-border'
      : {
          teal: 'bg-primary-50 text-primary ring-primary/15',
          blue: 'bg-blue-50 text-blue-700 ring-blue-600/15',
          amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
          red: 'bg-red-50 text-red-700 ring-red-600/15',
          green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
          violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
        }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}
