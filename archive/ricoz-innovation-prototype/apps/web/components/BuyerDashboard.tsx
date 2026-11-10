'use client';

import React, { useState } from 'react';
import { INITIAL_DEALS, Deal } from '../lib/mockData';
import { PageHeader, Toast, Pill } from './ui';
import {
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  MapPin,
  Heart,
  FileText,
  ShieldCheck,
  Eye,
  X,
  UserCheck,
  Stethoscope,
  PawPrint,
  HeartPulse,
} from 'lucide-react';

const SECTOR_THEME: Record<Deal['sector'], { label: string; icon: React.ElementType; cover: string }> = {
  dental: { label: 'Dental', icon: Stethoscope, cover: 'from-primary to-teal-500' },
  veterinary: { label: 'Veterinary', icon: PawPrint, cover: 'from-amber-500 to-orange-400' },
  specialist_medical: { label: 'Specialist Medical', icon: HeartPulse, cover: 'from-violet-600 to-fuchsia-500' },
};

export function BuyerDashboard() {
  const [deals] = useState<Deal[]>(INITIAL_DEALS);
  const [searchCity, setSearchCity] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchRevenue, setSearchRevenue] = useState('');
  const [selectedSector, setSelectedSector] = useState<'all' | Deal['sector']>('all');
  const [selectedTransition, setSelectedTransition] = useState('all');
  const [favorites, setFavorites] = useState<string[]>(['dl-101']);
  const [unlockedListings, setUnlockedListings] = useState<string[]>([]);
  const [ndaDeal, setNdaDeal] = useState<Deal | null>(null);
  const [typedName, setTypedName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredDeals = deals.filter((deal) => {
    if (selectedSector !== 'all' && deal.sector !== selectedSector) return false;
    if (selectedTransition !== 'all' && !deal.transitionType.toLowerCase().includes(selectedTransition.toLowerCase())) return false;
    if (searchCity && !deal.city.toLowerCase().includes(searchCity.toLowerCase())) return false;
    if (searchSpecialty && !deal.specialty.toLowerCase().includes(searchSpecialty.toLowerCase())) return false;
    if (searchRevenue && deal.revenueBand !== searchRevenue) return false;
    return true;
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const executeNDA = () => {
    if (!ndaDeal) return;
    if (!agreedToTerms) { showToast('Please accept the confidentiality terms first.'); return; }
    if (!typedName.trim()) { showToast('Please type your legal full name.'); return; }
    setUnlockedListings((prev) => [...prev, ndaDeal.id]);
    setNdaDeal(null);
    setTypedName('');
    setAgreedToTerms(false);
    showToast(`NDA recorded with tamper-proof hash. Tier 2 access unlocked for ${ndaDeal.code}.`);
  };

  const sectors: { id: string; label: string; icon?: React.ElementType }[] = [
    { id: 'all', label: 'All' },
    { id: 'dental', label: 'Dental', icon: Stethoscope },
    { id: 'veterinary', label: 'Veterinary', icon: PawPrint },
    { id: 'specialist_medical', label: 'Specialist Medical', icon: HeartPulse },
  ];

  return (
    <div className="space-y-7">
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Discover Practices"
        badge={<Pill tone="green"><UserCheck className="w-3 h-3" /> Verified buyer</Pill>}
        subtitle={<>Confidential listings matched to your profile · Identities unlock after a clickwrap NDA and broker approval</>}
        actions={
          <span className="h-9 px-3.5 rounded-lg border border-border bg-white text-[13px] text-ink-muted flex items-center gap-2">
            Showing <strong className="text-ink font-semibold">{filteredDeals.length}</strong> of {deals.length}
          </span>
        }
      />

      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-1 rounded-lg bg-surface-subtle border border-border">
            {sectors.map((s) => {
              const active = selectedSector === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSector(s.id as any)}
                  className={`px-3 h-8 rounded-md text-[12.5px] font-medium flex items-center gap-1.5 ${
                    active ? 'bg-white text-ink shadow-subtle ring-1 ring-border' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-primary' : ''}`} />}
                  {s.label}
                </button>
              );
            })}
          </div>
          <select
            value={selectedTransition}
            onChange={(e) => setSelectedTransition(e.target.value)}
            className="h-10 px-3 bg-white border border-border rounded-lg text-[13px] text-ink"
          >
            <option value="all">All transition types</option>
            <option value="buyout">Buyout (100% acquisition)</option>
            <option value="retirement">Partner retirement & succession</option>
            <option value="partnership">Partnership transition</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="City — e.g. Bengaluru, Mumbai"
              className="w-full h-10 pl-9 pr-3 bg-white border border-border rounded-lg text-[13px] placeholder:text-ink-light"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
            <input
              type="text"
              value={searchSpecialty}
              onChange={(e) => setSearchSpecialty(e.target.value)}
              placeholder="Specialty — e.g. Ortho, Ophthalmology"
              className="w-full h-10 pl-9 pr-3 bg-white border border-border rounded-lg text-[13px] placeholder:text-ink-light"
            />
          </div>
          <select
            value={searchRevenue}
            onChange={(e) => setSearchRevenue(e.target.value)}
            className="h-10 px-3 bg-white border border-border rounded-lg text-[13px] text-ink"
          >
            <option value="">Any revenue band</option>
            <option value="₹50L - ₹1Cr">₹50L – ₹1 Crore</option>
            <option value="₹1Cr - ₹2Cr">₹1 Cr – ₹2 Crore</option>
            <option value="₹2Cr - ₹5Cr">₹2 Cr – ₹5 Crore</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSelectedSector('all');
              setSelectedTransition('all');
              setSearchCity('');
              setSearchSpecialty('');
              setSearchRevenue('');
            }}
            className="h-10 px-4 text-[13px] font-medium text-ink-muted hover:text-ink rounded-lg hover:bg-surface-subtle flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Listing Cards */}
      {filteredDeals.length === 0 ? (
        <div className="card border-dashed p-14 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-subtle mx-auto flex items-center justify-center">
            <Search className="w-5 h-5 text-ink-light" />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">No practices match these filters</p>
          <p className="text-[13px] text-ink-muted mt-1">Try a different city or reset the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDeals.map((deal) => {
            const isUnlocked = unlockedListings.includes(deal.id);
            const isFav = favorites.includes(deal.id);
            const theme = SECTOR_THEME[deal.sector];
            const SectorIcon = theme.icon;
            return (
              <article
                key={deal.id}
                className={`group bg-white rounded-2xl border overflow-hidden flex flex-col shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 ${
                  isUnlocked ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-border'
                }`}
              >
                {/* Cover */}
                <div className={`relative h-28 bg-gradient-to-br ${theme.cover} overflow-hidden`}>
                  <SectorIcon className="absolute -right-4 -bottom-6 w-32 h-32 text-white/15" strokeWidth={1.25} />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-white/15 backdrop-blur px-2.5 py-1 rounded-full ring-1 ring-white/20">
                      <SectorIcon className="w-3.5 h-3.5" /> {theme.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(deal.id)}
                      aria-label="Save listing"
                      className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-ink-muted'}`} />
                    </button>
                  </div>
                  <span className="absolute left-4 bottom-3 font-mono text-[11px] text-white/80">{deal.code}</span>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-[15px] font-semibold text-ink leading-snug">
                    {isUnlocked ? `${deal.sellerName.split('(')[0].trim()}'s Practice` : deal.title}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                    <MapPin className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                    <span className="truncate">{deal.zone}, {deal.city}</span>
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden ring-1 ring-border">
                    <div className="bg-white p-3">
                      <dt className="text-[11px] text-ink-light">Annual revenue</dt>
                      <dd className="mt-0.5 text-[13px] font-semibold text-ink">{deal.revenueBand}</dd>
                    </div>
                    <div className="bg-white p-3">
                      <dt className="text-[11px] text-ink-light">Deal type</dt>
                      <dd className="mt-0.5 text-[13px] font-semibold text-ink truncate" title={deal.transitionType}>
                        {deal.transitionType.split(' (')[0]}
                      </dd>
                    </div>
                    <div className="bg-white p-3 col-span-2">
                      <dt className="text-[11px] text-ink-light">Facility</dt>
                      <dd className="mt-0.5 text-[13px] font-medium text-ink truncate" title={deal.operatoriesLabel}>
                        {deal.operatoriesLabel || `${deal.chairs} units`}
                      </dd>
                    </div>
                  </dl>

                  {/* Financials: locked vs unlocked */}
                  <div className="mt-4">
                    {isUnlocked ? (
                      <div className="rounded-xl bg-emerald-50 ring-1 ring-inset ring-emerald-600/15 p-3.5">
                        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-800">
                          <Unlock className="w-3.5 h-3.5" /> Tier 2 access granted
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                          <div><p className="text-emerald-700/70">Revenue</p><p className="font-semibold text-emerald-900">{deal.exactRevenue?.replace(' / yr', '')}</p></div>
                          <div><p className="text-emerald-700/70">EBITDA</p><p className="font-semibold text-emerald-900">{deal.ebitda?.split(' ')[0]}</p></div>
                          <div><p className="text-emerald-700/70">Asking</p><p className="font-semibold text-emerald-900">{deal.askingPrice}</p></div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-xl bg-surface-subtle p-3.5 overflow-hidden">
                        <div className="grid grid-cols-3 gap-2 text-[12px] blur-[5px] select-none" aria-hidden>
                          <div><p className="text-ink-light">Revenue</p><p className="font-semibold">₹84,50,000</p></div>
                          <div><p className="text-ink-light">EBITDA</p><p className="font-semibold">₹31,20,000</p></div>
                          <div><p className="text-ink-light">Asking</p><p className="font-semibold">₹1.15 Cr</p></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-[12px] font-medium text-ink-muted">
                          <Lock className="w-3.5 h-3.5" /> Financials unlock after NDA
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-5">
                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => showToast(`Opening verified data room for ${deal.code} (8 documents ready)`)}
                        className="w-full h-10 text-[13px] font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Open data room
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setNdaDeal(deal); setTypedName(''); setAgreedToTerms(false); }}
                        className="w-full h-10 text-[13px] font-medium bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" /> Sign NDA to view details
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* NDA Modal */}
      {ndaDeal && (
        <div
          className="modal-overlay fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setNdaDeal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-border max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-base text-ink">Confidential NDA — Clickwrap</h3>
                  <p className="text-xs text-ink-muted">Ref: {ndaDeal.code} · v2.4 · Arbitration Act 1996</p>
                </div>
              </div>
              <button onClick={() => setNdaDeal(null)} className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-surface-subtle">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* NDA text */}
            <div className="p-5 overflow-y-auto flex-1">
              <div className="bg-surface-subtle rounded-lg border border-border p-4 text-xs text-ink-muted h-40 overflow-y-auto space-y-2 leading-relaxed">
                <p className="font-bold text-ink uppercase text-[11px]">Confidentiality Undertaking for Healthcare Practice Acquisition Evaluation</p>
                <p><strong>1. Confidentiality:</strong> In consideration of receiving proprietary practice data, financial statements, and clinical asset registers relating to Practice Ref <strong>{ndaDeal.code}</strong>, the Recipient agrees to treat all information as strictly confidential.</p>
                <p><strong>2. Non-Circumvention:</strong> The Recipient undertakes not to approach patients, staff, or landlord directly without prior written consent from Ricoz Healthcare Brokerage.</p>
                <p><strong>3. Governing Law:</strong> Subject to the laws of India. Disputes under the jurisdiction of Bengaluru courts, Karnataka.</p>
                <p><strong>4. Audit:</strong> Digital acceptance timestamp, IP address, and unique SHA-256 hash are recorded to tamper-proof audit log.</p>
              </div>

              {/* Form */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Your Legal Full Name (as registered with Dental/Medical Council)
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="e.g. Dr. Priya V. Sharma"
                    className="w-full p-2.5 bg-surface-subtle border border-border rounded-lg text-xs font-semibold text-ink focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">DCI / Council Reg No.</label>
                    <input disabled value="DCI-KA-19842" className="w-full p-2.5 bg-surface-subtle border border-border rounded-lg text-xs text-ink-muted" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Recorded IP</label>
                    <input disabled value="103.21.144.62 (BLR)" className="w-full p-2.5 bg-surface-subtle border border-border rounded-lg text-xs text-ink-muted font-mono" />
                  </div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span className="text-xs text-ink-muted">
                    I have read and agree to the Confidentiality Undertaking. I understand this acceptance is <strong className="text-ink">legally binding</strong> and recorded with a tamper-proof SHA-256 hash.
                  </span>
                </label>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-5 pt-0 border-t border-border flex gap-3 justify-end flex-shrink-0">
              <button
                onClick={() => setNdaDeal(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-subtle rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeNDA}
                className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Execute NDA & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
