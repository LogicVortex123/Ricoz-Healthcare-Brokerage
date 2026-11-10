'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Database, RefreshCw, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DbStatus {
  connected: boolean;
  latencyMs: number;
  host: string;
  database: string;
  collections: { name: string; count: number }[];
  latestPractices: {
    _id: string;
    code: string;
    title: string;
    sector: string;
    stageId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
  checkedAt: string;
}

function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function DbInspector({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<DbStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db-status', { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Unknown error');
      setData(json.data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener('practices:changed', refresh);
    return () => window.removeEventListener('practices:changed', refresh);
  }, [load]);

  return (
    <div className="drawer-overlay fixed inset-0 z-[150] flex justify-end bg-ink/30 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-ink">Database Inspector</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={load}
              className="p-1.5 rounded-md hover:bg-surface-subtle text-ink-muted"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-subtle text-ink-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-semibold">Cannot reach MongoDB</p>
                <p className="mt-0.5 break-words">{error}</p>
              </div>
            </div>
          )}

          {data && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" /> Connected · ping {data.latencyMs} ms
                </p>
                <dl className="mt-2 grid grid-cols-[80px_1fr] gap-y-1 text-ink">
                  <dt className="text-ink-muted">Database</dt>
                  <dd className="font-mono">{data.database}</dd>
                  <dt className="text-ink-muted">Host</dt>
                  <dd className="font-mono break-all">{data.host}</dd>
                  <dt className="text-ink-muted">Checked</dt>
                  <dd>{new Date(data.checkedAt).toLocaleTimeString()}</dd>
                </dl>
              </div>

              <section>
                <h3 className="font-semibold text-ink mb-2">Collections</h3>
                {data.collections.length === 0 ? (
                  <p className="text-ink-muted">No collections yet.</p>
                ) : (
                  <ul className="border border-border rounded-lg divide-y divide-border">
                    {data.collections.map((c) => (
                      <li key={c.name} className="flex justify-between px-3 py-2">
                        <span className="font-mono">{c.name}</span>
                        <span className="font-semibold">{c.count} docs</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="font-semibold text-ink mb-2">Recently written practices</h3>
                <ul className="space-y-2">
                  {data.latestPractices.map((p) => (
                    <li key={p._id} className="border border-border rounded-lg p-2.5">
                      <div className="flex justify-between gap-2">
                        <span className="font-mono font-bold text-primary">{p.code}</span>
                        <span className="text-ink-muted whitespace-nowrap">updated {timeAgo(p.updatedAt)}</span>
                      </div>
                      <p className="text-ink mt-0.5 truncate">{p.title}</p>
                      <p className="text-[10px] text-ink-muted mt-0.5 font-mono truncate">
                        _id {p._id} · stage {p.stageId} · {p.status}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <p className="text-[11px] text-ink-muted leading-relaxed">
                This panel reads live from MongoDB via <code className="font-mono">/api/db-status</code>. Submit a sale
                request (Seller) or advance a deal (Broker) and it appears here at the top. You can cross-check in
                MongoDB Atlas → Browse Collections → <code className="font-mono">{data.database}.practices</code>.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
