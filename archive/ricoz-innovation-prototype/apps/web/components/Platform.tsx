"use client";
import Link from "next/link";
import {
  Compass,
  LayoutDashboard,
  Building2,
  Handshake,
  Users,
  ClipboardList,
  Bell,
  ShieldCheck,
  UserRound,
  FileClock,
  Stethoscope,
  PawPrint,
  HeartPulse,
  ArrowUpRight,
  MapPin,
  LockKeyhole,
  Menu,
  X,
} from "lucide-react";
import PracticeOnboarding from "./PracticeOnboarding";
import AuthPanel from "./AuthPanel";
import {
  OwnershipEditor,
  DealCreator,
  TransferEditor,
  AccessEditor,
  OfferEditor,
  OfferDecision,
  ValuationWorkspace,
  PracticeValuation,
  formatMoney,
} from "./WorkflowEditors";
import React, { useEffect, useState, useRef } from "react";

type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  choices?: { value: string; label: string }[];
  value?: any;
  required?: boolean;
  placeholder?: string;
  help?: string;
  minLength?: number;
};
type RecordData = Record<string, any>;
const title = (s?: string) =>
  String(s || "").replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
const future = () => new Date(Date.now() + 30 * 86400000).toISOString();
function DataForm({
  label,
  fields,
  submit,
  help,
  submitLabel,
  success = "Saved.",
  doneHint,
  doneLabel,
  onDone,
}: {
  label: string;
  fields: Field[];
  submit: (b: RecordData) => Promise<any>;
  help?: string;
  submitLabel?: string;
  success?: string;
  doneHint?: string;
  doneLabel?: string;
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  return (
    <form
      className="platform-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setDone("");
        const data = new FormData(e.currentTarget);
        const body: RecordData = {};
        try {
          for (const f of fields) {
            const v = data.get(f.name);
            if (v === "" && f.required === false) continue;
            body[f.name] =
              f.type === "number"
                ? Number(v)
                : f.type === "checkbox"
                  ? v === "on"
                  : f.type === "json"
                    ? JSON.parse(String(v))
                    : v;
          }
          await submit(body);
          setDone(success);
          (e.target as HTMLFormElement).reset();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>{label}</h3>
      {help && <p className="platform-muted">{help}</p>}
      <div className="platform-fields">
        {fields.map((f) => (
          <label key={f.name}>
            {f.label}
            {f.options || f.choices ? (
              <select
                name={f.name}
                aria-label={f.label}
                defaultValue={f.value}
                required={f.required !== false}
              >
                {(
                  f.choices ||
                  f.options!.map((o) => ({ value: o, label: title(o) }))
                ).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : ["json", "textarea"].includes(f.type || "") ? (
              <textarea
                name={f.name}
                placeholder={f.placeholder}
                aria-describedby={f.help ? `${f.name}-help` : undefined}
                minLength={f.minLength}
                defaultValue={
                  f.type === "json"
                    ? JSON.stringify(f.value ?? [], null, 2)
                    : f.value
                }
                required={f.required !== false}
                rows={f.type === "json" ? 5 : 4}
              />
            ) : (
              <input
                name={f.name}
                type={f.type || "text"}
                defaultValue={f.type === "checkbox" ? undefined : f.value}
                defaultChecked={f.type === "checkbox" ? f.value : undefined}
                required={f.type === "checkbox" ? false : f.required !== false}
              />
            )}
            {f.help && (
              <small id={`${f.name}-help`}>{f.help}</small>
            )}
          </label>
        ))}
      </div>
      <button disabled={busy}>{busy ? "Please wait…" : submitLabel || label}</button>
      {error && (
        <p role="alert" className="platform-error">
          {error}
        </p>
      )}
      {done && (
        <div className="platform-success">
          <p role="status">{done}</p>
          {doneHint && <p>{doneHint}</p>}
          {doneLabel && onDone && (
            <button type="button" className="secondary" onClick={onDone}>
              {doneLabel}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className="platform-badge" data-status={value}>
      {label || title(value)}
    </span>
  );
}
function WorkspaceSections({
  value,
  change,
  labels,
}: {
  value: string;
  change: (value: string) => void;
  labels: string[];
}) {
  return (
    <nav className="platform-sections" aria-label="Workspace sections">
      {labels.map((label) => (
        <button
          type="button"
          key={label}
          className={value === label ? "active" : ""}
          aria-pressed={value === label}
          onClick={() => change(label)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
const navIcons: Record<string, any> = {
  Opportunities: Compass,
  Overview: LayoutDashboard,
  Practices: Building2,
  Deals: Handshake,
  Interests: Users,
  Valuations: FileClock,
  CRM: ClipboardList,
  Audit: ShieldCheck,
  Administration: Users,
  Notifications: Bell,
  Account: UserRound,
  "Sign in": LockKeyhole,
};
const navLabels: Record<string, string> = {
  Opportunities: "Browse practices",
  Overview: "Overview",
  Practices: "My practices",
  Deals: "My deals",
  Interests: "My interests",
  Valuations: "Valuations",
  CRM: "Leads & CRM",
  Audit: "Audit",
  Administration: "Administration",
  Notifications: "Notifications",
  Account: "Account",
  "Sign in": "Sign in",
};
const navGroups: { label: string; ids: string[] }[] = [
  { label: "Discover", ids: ["Opportunities", "Sign in"] },
  {
    label: "Your work",
    ids: ["Overview", "Practices", "Deals", "Interests", "Valuations", "CRM"],
  },
  { label: "Team", ids: ["Audit", "Administration"] },
  { label: "Account", ids: ["Notifications", "Account"] },
];
const requestStatus: Record<string, string> = {
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Not approved",
  revoked: "No longer active",
};
function Rows({
  rows,
  select,
  empty,
}: {
  rows: RecordData[];
  select?: (r: RecordData) => void;
  empty?: string;
}) {
  return (
    <div className="platform-rows">
      {!rows.length && (
        <div className="platform-empty">
          {empty ||
            "Nothing here yet. New items will show up in this list."}
        </div>
      )}
      {rows.map((r, i) => {
        const status =
          r.qualification?.status || r.stage || r.status || r.state;
        const note = typeof r.readiness === "string" ? r.readiness.trim() : "";
        return (
        <article key={r._id || r.id || i}>
          <div>
            <strong>
              {note
                ? note.length > 88
                  ? `${note.slice(0, 88)}…`
                  : note
                : r.title ||
                r.headline ||
                r.intake?.displayName ||
                r.message ||
                r.action ||
                r.name ||
                (r.purpose && title(r.purpose)) ||
                "Record"}
            </strong>
            {status && (
              <Badge value={status} label={requestStatus[status]} />
            )}
          </div>
          <small>
            {r.region ||
              (r.createdAt
                ? `Created ${String(r.createdAt).slice(0, 10)}`
                : r.dueAt
                  ? `Due ${String(r.dueAt).slice(0, 10)}`
                  : note
                    ? "Saved request"
                    : "In your access scope")}
          </small>
          {select && (
            <button className="secondary" onClick={() => select(r)}>
              {note ? "View request" : "Open"}
            </button>
          )}
        </article>
        );
      })}
    </div>
  );
}
export default function Platform() {
  const [account, setAccount] = useState<RecordData | null>(null);
  const [csrf, setCsrf] = useState("");
  const csrfRef = useRef(csrf);
  useEffect(() => { csrfRef.current = csrf; }, [csrf]);
  const refreshFlight = useRef<Promise<boolean> | null>(null);
  const [tab, setTab] = useState("Opportunities");
  const [data, setData] = useState<RecordData[]>([]);
  const [metrics, setMetrics] = useState<RecordData>({});
  const [selected, setSelected] = useState<RecordData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [entryCapacity, setEntryCapacity] = useState<"buyer" | "seller" | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const startAs = (capacity: "buyer" | "seller") => {
    setEntryCapacity(capacity);
    setTab("Sign in");
    setNavOpen(false);
  };
  const goTab = (n: string) => {
    if (n === "Sign in") setEntryCapacity(null);
    setTab(n);
    setNavOpen(false);
  };
  async function api(path: string, method = "GET", body?: any) {
    const idempotencyKey = crypto.randomUUID();
    const send = () =>
      fetch(`/api/v1${path}`, {
        method,
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfRef.current,
          "Idempotency-Key": idempotencyKey,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    let res = await send();
    if (
      res.status === 401 &&
      (!path.startsWith("/auth/") || path === "/auth/logout")
    ) {
      if (!refreshFlight.current)
        refreshFlight.current = (async () => {
          for (let attempt = 0; attempt < 2; attempt++) {
            const refreshed = await fetch("/api/v1/auth/refresh", {
              method: "POST",
              credentials: "same-origin",
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (refreshed.status === 409 && attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 100));
              continue;
            }
            if (!refreshed.ok) return false;
            const result = await refreshed.json();
            csrfRef.current = result.data.csrf;
            setCsrf(result.data.csrf);
            return true;
          }
          return false;
        })().finally(() => {
          refreshFlight.current = null;
        });
      if (await refreshFlight.current) res = await send();
    }
    const result = await res.json();
    if (!res.ok)
      throw new Error(
        `${result.error?.message || "Request failed"}${result.error?.fields ? ": " + result.error.fields.map((f: any) => `${f.path}: ${f.message}`).join("; ") : ""}`,
      );
    if (result.pagination && Array.isArray(result.data))
      Object.assign(result.data, { nextCursor: result.pagination.nextCursor });
    return result.data;
  }
  async function load(cursor?: string) {
    setLoading(true);
    setError("");
    try {
      const endpoint: Record<string, string> = {
        Opportunities: `/listings?limit=12${category ? `&category=${category}` : ""}`,
        Practices: "/practices",
        Deals: "/deals",
        Interests: "/interests",
        CRM: "/leads",
        Notifications: "/notifications",
        Audit: "/audit",
        Administration: "/memberships",
        Valuations: "/valuations",
      };
      if (endpoint[tab]) {
        const result = await api(
          endpoint[tab] +
            (cursor
              ? `${endpoint[tab].includes("?") ? "&" : "?"}cursor=${cursor}`
              : ""),
        );
        setData(result.items || result);
        setNextCursor(result.nextCursor || null);
      }
      if (account && !account.mfaSetupRequired)
        setMetrics(await api("/metrics"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function refreshAccount() {
    try {
      const status = await api("/auth/status");
      if (!status.hasSession) { setAccount(null); return; }
      const a = await api("/account");
      setAccount(a);
      setCsrf(a.csrf);
      return a;
    } catch {
      setAccount(null);
    }
  }
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("screen") === "signin")
      setTab("Sign in");
    refreshAccount();
  }, []);
  useEffect(() => {
    setSelected(null);
    load();
  }, [tab, account, category]);
  const roles: string[] = account?.memberships?.map((m: any) => m.role) || [];
  const staff = roles.some((x) => ["manager", "broker"].includes(x));
  const nav = [
    "Opportunities",
    ...(account
      ? [
          ...(staff || roles.includes("superAdmin") ? ["Overview"] : []),
          ...(roles.includes("seller") || staff ? ["Practices"] : []),
          ...(staff || roles.includes("seller") || roles.includes("buyer") || roles.includes("acquirer") ? ["Deals"] : []),
          ...(staff || roles.includes("buyer") || roles.includes("acquirer") ? ["Interests"] : []),
          ...(staff || roles.includes("seller") ? ["Valuations"] : []),
          ...(staff ? ["CRM"] : []),
          ...(staff || roles.includes("superAdmin") ? ["Audit"] : []),
          ...(roles.some((x) => ["manager", "superAdmin"].includes(x))
            ? ["Administration"]
            : []),
          "Notifications",
          "Account",
        ]
      : ["Sign in"]),
  ];
  return (
    <div className="platform" data-nav-open={navOpen ? "true" : "false"}>
      <button
        type="button"
        className="platform-menu-toggle"
        aria-expanded={navOpen}
        aria-controls="platform-sidebar"
        aria-label={navOpen ? "Close menu" : "Open menu"}
        onClick={() => setNavOpen((open) => !open)}
      >
        {navOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>
      {navOpen && (
        <button
          type="button"
          className="platform-backdrop"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside id="platform-sidebar">
        <Link className="platform-brand" href="/" onClick={() => setNavOpen(false)}>
          <span className="platform-monogram" aria-hidden="true">
            R
          </span>
          <span>
            <strong>Ricoz</strong>
            <small>Practice Transitions</small>
          </span>
        </Link>
        <p className="platform-aside-tag">Dental · Veterinary · Specialist</p>
        <nav aria-label="Main navigation">
          {navGroups.map((group) => {
            const items = group.ids.filter((id) => nav.includes(id));
            if (!items.length) return null;
            return (
              <div key={group.label}>
                <p className="platform-nav-group">{group.label}</p>
                {items.map((n) => {
                  const Icon = navIcons[n] || Compass;
                  return (
                    <button
                      type="button"
                      className={tab === n ? "active" : ""}
                      key={n}
                      aria-current={tab === n ? "page" : undefined}
                      onClick={() => goTab(n)}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {navLabels[n] || n}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="platform-aside-note">
          A broker guides every transition.
          <p>Public listings never show the practice name.</p>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <small>Healthcare practice transitions</small>
            <h1>
              {selected
                ? "Private workspace"
                : tab === "Opportunities"
                  ? "Buy, sell, or transition a clinic"
                  : tab === "Sign in"
                    ? "Welcome"
                    : navLabels[tab] || tab}
            </h1>
          </div>
          <div className="platform-header-actions">
            {account ? (
              <>
                <div className="platform-userchip">
                  <span className="platform-avatar" aria-hidden="true">
                    {account.user.name.charAt(0)}
                  </span>
                  <span>{account.user.name}</span>
                </div>
                <button
                  type="button"
                  className="secondary"
                  onClick={async () => {
                    try {
                      await api("/auth/logout", "POST", {});
                      setAccount(null);
                      setCsrf("");
                      setEntryCapacity(null);
                      setTab("Opportunities");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" onClick={() => goTab("Sign in")}>
                Sign in
              </button>
            )}
          </div>
        </header>
        {error && (
          <div role="alert" className="platform-error">
            {error}
            <button className="secondary" onClick={() => load()}>
              Retry
            </button>
          </div>
        )}
        {account?.mfaSetupRequired && (
          <p role="alert" className="platform-notice">
            Your privileged account must enroll in MFA before accessing
            workspaces. Open Account to continue.
          </p>
        )}
        {selected ? (
          <>
            <button
              type="button"
              className="secondary platform-back"
              onClick={() => {
                setSelected(null);
                load();
              }}
            >
              ← Back to {navLabels[tab] || tab}
            </button>
            {tab === "Practices" ? (
              <PracticeWorkspace
                p={selected}
                api={api}
                staff={staff}
                reload={async () =>
                  setSelected(await api(`/practices/${selected._id}`))
                }
              />
            ) : tab === "Deals" ? (
              <DealWorkspace
                d={selected}
                api={api}
                staff={staff}
                reload={async () =>
                  setSelected(await api(`/deals/${selected.id}`))
                }
                actorId={account?.user.id}
              />
            ) : tab === "Valuations" ? (
              <ValuationWorkspace
                record={selected}
                api={api}
                staff={staff}
                refresh={async () => {
                  await load();
                  setSelected(
                    await api(`/valuations/${selected.id || selected._id}`),
                  );
                }}
              />
            ) : (
              <RecordWorkspace
                tab={tab}
                record={selected}
                api={api}
                refresh={load}
                staff={staff}
              />
            )}
          </>
        ) : (
          <>
            {tab === "Opportunities" && (
              <>
                <p className="platform-goal">
                  Managing buyouts, partner retirements, and acquisitions of
                  dental, veterinary, and specialist medical clinics. You choose
                  buy or sell. A broker handles the private steps.
                </p>
                {!account && (
                  <div className="platform-choice" aria-label="Choose your path">
                    <button type="button" className="platform-choice-card" onClick={() => startAs("buyer")}>
                      <span>I am buying</span>
                      <strong>Find a practice</strong>
                      <em>Browse anonymous listings, then tell a broker you are interested.</em>
                    </button>
                    <button type="button" className="platform-choice-card" onClick={() => startAs("seller")}>
                      <span>I am selling</span>
                      <strong>Transition my practice</strong>
                      <em>Start a sale, buyout, retirement, or succession. A public listing is optional.</em>
                    </button>
                  </div>
                )}
                {!account && (
                <ol className="platform-steps">
                  <li>
                    <strong>Choose buy or sell</strong>
                    <span>Dental, veterinary, or specialist medical.</span>
                  </li>
                  <li>
                    <strong>Stay anonymous in public</strong>
                    <span>Listings show region and type only. No clinic name or finances.</span>
                  </li>
                  <li>
                    <strong>A broker opens the next step</strong>
                    <span>Interest, documents, offers, closing, and handover stay separate.</span>
                  </li>
                </ol>
                )}
                {account && (
                  <div className="platform-next">
                    <p>
                      {roles.includes("seller")
                        ? "Next: open My practices to add a clinic or continue one you started."
                        : roles.includes("buyer") || roles.includes("acquirer")
                          ? "Next: pick a listing below and send a short note. Your saved requests are in My interests."
                          : "Next: use the menu for the records assigned to you."}
                    </p>
                    {roles.includes("seller") && (
                      <button type="button" className="secondary" onClick={() => goTab("Practices")}>
                        Go to my practices
                      </button>
                    )}
                  </div>
                )}
                <div className="platform-toolbar">
                  <h2 id="opportunity-list">Current opportunities</h2>
                  <label>
                    Practice category
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">All categories</option>
                      <option value="dental">Dental</option>
                      <option value="veterinary">Veterinary</option>
                      <option value="specialistMedical">
                        Specialist medical
                      </option>
                    </select>
                  </label>
                </div>
                {loading ? (
                  <p role="status">Loading opportunities…</p>
                ) : (
                  <div className="platform-grid">
                    {data.filter((l) => l?.id && l?.headline && l?.category).map((l) => (
                      <article className="platform-card" key={l.id}>
                        <div className="platform-opportunity-top">
                          <span
                            className="platform-category-icon"
                            aria-hidden="true"
                          >
                            {l.category === "veterinary" ? (
                              <PawPrint size={23} />
                            ) : l.category === "specialistMedical" ? (
                              <Stethoscope size={23} />
                            ) : (
                              <HeartPulse size={23} />
                            )}
                          </span>
                          <Badge value={l.category} />
                        </div>
                        <h3>
                          <Link href={`/opportunities/${l.id}`}>
                            {l.headline}
                          </Link>
                        </h3>
                        <p>{l.summary}</p>
                        <p className="platform-muted platform-location">
                          <MapPin size={14} aria-hidden="true" />
                          {l.region}, {l.country}
                        </p>
                        <Badge value={l.transitionPurpose} />
                        <p>
                          <Link
                            className="platform-text-link"
                            href={`/opportunities/${l.id}`}
                          >
                            View opportunity{" "}
                            <ArrowUpRight size={15} aria-hidden="true" />
                          </Link>
                        </p>
                        {account && (roles.includes("buyer") || roles.includes("acquirer")) ? (
                          <DataForm
                            label="Tell the broker you are interested"
                            help="One short note is enough. This is not a legal offer."
                            submitLabel="Express interest"
                            doneHint="Saved in My interests. A broker reviews it before any private details are shared."
                            doneLabel="View my requests"
                            onDone={() => goTab("Interests")}
                            fields={[
                              {
                                name: "readiness",
                                label: "Your note",
                                type: "textarea",
                                minLength: 10,
                                placeholder:
                                  "Example: I want to explore a full acquisition. Financing is under review, and I can start within 60 days.",
                                help: "At least 10 characters.",
                              },
                            ]}
                            submit={(b) =>
                              api(`/listings/${l.id}/interests`, "POST", b)
                            }
                          />
                        ) : !account ? (
                          <button type="button" onClick={() => startAs("buyer")}>
                            Continue as buyer
                          </button>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
                {!loading && !data.length && (
                  <div className="platform-empty">
                    No published opportunities match these filters. Private
                    partner transitions are managed in the deal workspace.
                  </div>
                )}
                {nextCursor && (
                  <button type="button" onClick={() => load(nextCursor)}>
                    Next page
                  </button>
                )}
              </>
            )}
            {tab === "Sign in" && (
              <AuthPanel
                key={entryCapacity || "standard"}
                api={api}
                initialCapacity={entryCapacity}
                onSignedIn={async (r) => {
                  setCsrf(r.csrf);
                  setAccount({ ...r, memberships: [] });
                  const current = await refreshAccount();
                  const currentRoles: string[] = current?.memberships?.map((m: any) => m.role) || [];
                  setTab(r.mfaSetupRequired ? "Account" : currentRoles.includes("seller") ? "Practices" : currentRoles.includes("buyer") || currentRoles.includes("acquirer") ? "Opportunities" : "Overview");
                }}
              />
            )}
            {tab === "Overview" && (
              <>
                <h2>Your transition portfolio</h2>
                <p className="platform-muted">
                  A simple snapshot of live records in your current access scope.
                </p>
                <div className="platform-grid">
                  {Object.entries(metrics).map(([k, v]) => (
                    <article className="platform-card" key={k}>
                      <p>{title(k)}</p>
                      <strong className="platform-number">{v}</strong>
                    </article>
                  ))}
                  {!Object.keys(metrics).length && (
                    <div className="platform-empty">
                      Metrics appear here once your memberships have active
                      records.
                    </div>
                  )}
                </div>
              </>
            )}
            {tab === "Practices" && (
              <>
                <Rows rows={data} select={setSelected} />
                {nextCursor && (
                  <button onClick={() => load(nextCursor)}>Next page</button>
                )}
                {roles.includes("seller") && (
                  <PracticeOnboarding api={api} refresh={load} />
                )}
              </>
            )}
            {[
              "Deals",
              "CRM",
              "Notifications",
              "Valuations",
            ].includes(tab) && (
              <Rows
                rows={data}
                select={async (r) => {
                  try {
                    setSelected(
                      tab === "Deals"
                        ? await api(`/deals/${r.id}`)
                        : tab === "Valuations"
                          ? await api(`/valuations/${r.id || r._id}`)
                          : r,
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            )}
            {tab === "Interests" && (
              <>
                <p className="platform-muted">
                  These are the requests you sent from Browse practices. Waiting
                  for review means a broker has your note and private details
                  stay hidden until they approve you.
                </p>
                <Rows
                  rows={data}
                  empty="No requests yet. Go to Browse practices, open a listing, and send a short note."
                  select={(r) => setSelected(r)}
                />
              </>
            )}
            {tab === "Audit" && (
              <>
                <Rows rows={data} />
                {nextCursor && (
                  <button onClick={() => load(nextCursor)}>Next page</button>
                )}
              </>
            )}
            {tab === "Administration" && (
              <>
                <Rows rows={data} />
                <DataForm
                  label="Invite a verified staff or organization member"
                  fields={[
                    {
                      name: "email",
                      label: "Verified account email",
                      type: "email",
                    },
                    { name: "organizationId", label: "Organization ID" },
                    {
                      name: "role",
                      label: "Invited role",
                      options: ["broker", "manager", "acquirer"],
                    },
                    { name: "reason", label: "Reason for invitation" },
                  ]}
                  submit={(b) => api("/invitations", "POST", b)}
                />
                {roles.includes("superAdmin") && (
                  <DataForm
                    label="Create organization"
                    fields={[
                      { name: "name", label: "Organization name" },
                      {
                        name: "kind",
                        label: "Organization kind",
                        options: ["brokerage", "acquirer"],
                      },
                      { name: "reason", label: "Reason" },
                    ]}
                    submit={(b) => api("/organizations", "POST", b)}
                  />
                )}
                <DataForm
                  label="Update membership"
                  fields={[
                    { name: "userId", label: "Registered user ID" },
                    { name: "organizationId", label: "Organization ID" },
                    {
                      name: "role",
                      label: "Scoped role",
                      options: [
                        "broker",
                        "manager",
                        "seller",
                        "buyer",
                        "acquirer",
                      ],
                    },
                    {
                      name: "active",
                      label: "Membership active",
                      type: "checkbox",
                      value: true,
                    },
                    { name: "reason", label: "Reason" },
                  ]}
                  submit={async (b) => {
                    await api("/memberships", "POST", b);
                    await load();
                  }}
                />
                {roles.includes("superAdmin") && (
                  <DataForm
                    label="Update account suspension"
                    fields={[
                      { name: "userId", label: "User ID" },
                      { name: "suspended", label: "Suspend", type: "checkbox" },
                      { name: "reason", label: "Reason" },
                    ]}
                    submit={(b) => {
                      const { userId, ...body } = b;
                      return api(`/users/${userId}/suspend`, "POST", body);
                    }}
                  />
                )}
              </>
            )}
            {nextCursor &&
              !["Opportunities", "Practices", "Audit"].includes(tab) && (
                <button onClick={() => load(nextCursor)}>Next page</button>
              )}
            {tab === "Account" && account && (
              <Account
                account={account}
                api={api}
                refresh={refreshAccount}
                setCsrf={setCsrf}
              />
            )}
          </>
        )}
        <footer>
          Healthcare Practice Transition Brokerage · Local demonstration data ·
          Electronic agreement evidence is not a legal signature. No patient or
          clinical records.
        </footer>
      </main>
    </div>
  );
}
function Account({ account, api, refresh, setCsrf }: any) {
  const [secret, setSecret] = useState("");
  return (
    <>
      <section className="platform-card">
        <h2>Your profile</h2>
        <p>
          Signed in as <strong>{account.user.name}</strong> · {account.user.email}
        </p>
        <p className="platform-muted">
          Memberships:{" "}
          {(account.memberships || [])
            .map((m: any) => title(m.role))
            .join(", ") || "None yet"}
        </p>
      </section>
      <DataForm
        label="Save profile"
        fields={[{ name: "name", label: "Name", value: account.user.name }]}
        submit={async (b) => {
          await api("/account", "PATCH", b);
          await refresh();
        }}
      />
      {account.authMode === "developmentSimple" && (
        <p className="platform-auth-hint">
          Local authentication uses email and password. Verification and MFA are
          deferred for this demo.
        </p>
      )}
      {!account.user.mfaEnabled && account.authMode !== "developmentSimple" && (
        <>
          <button
            onClick={async () => {
              try {
                const r = await api("/account/mfa/setup", "POST", {});
                setSecret(r.secret);
              } catch (e) {
                setSecret((e as Error).message);
              }
            }}
          >
            Set up authenticator
          </button>
          {secret && (
            <p>
              Authenticator secret: <code>{secret}</code>
            </p>
          )}
          <DataForm
            label="Confirm MFA"
            fields={[{ name: "code", label: "Six-digit authenticator code" }]}
            submit={async (b) => {
              const r = await api("/account/mfa/confirm", "POST", b);
              setCsrf(r.csrf);
              await refresh();
            }}
          />
        </>
      )}
      <DataForm
        label="Request account deletion review"
        fields={[]}
        submit={() => api("/account/deletion-request", "POST", {})}
      />
      <DataForm
        label="Accept organization invitation"
        fields={[{ name: "token", label: "Single-use invitation token" }]}
        submit={async (b) => {
          await api("/invitations/accept", "POST", b);
          await refresh();
        }}
      />
      <h3>Active memberships</h3>
      <Rows rows={account.memberships} />
    </>
  );
}
function RecordWorkspace({ tab, record: r, api, refresh, staff }: any) {
  if (tab === "Interests") {
    const status = r.qualification?.status || "pending";
    const meaning: Record<string, string> = {
      pending:
        "A broker is reviewing your note. Practice identity and documents stay private until they approve you.",
      approved:
        "You are approved for the next step. Confidentiality still has to be completed before private files open.",
      rejected: "This request was not approved.",
      revoked: "This approval is no longer active.",
    };
    return (
      <section className="platform-card">
        <h2>Your request</h2>
        <Badge value={status} label={requestStatus[status]} />
        <p>{meaning[status] || "Your broker can see this request."}</p>
        <h3>What you wrote</h3>
        <p>{r.readiness || "No note was saved."}</p>
        {r.createdAt && (
          <p className="platform-muted">
            Sent {String(r.createdAt).slice(0, 10)}
          </p>
        )}
        {staff && (
          <DataForm
            label="Review this request"
            help="Approve only when the buyer is ready for the next confidential step."
            submitLabel="Save decision"
            fields={[
              {
                name: "status",
                label: "Decision",
                choices: [
                  { value: "approved", label: "Approve" },
                  { value: "rejected", label: "Do not approve" },
                  { value: "revoked", label: "End an earlier approval" },
                ],
              },
              { name: "expiresAt", label: "Valid until (UTC)", value: future() },
              { name: "reason", label: "Reason the buyer can understand" },
            ]}
            submit={(b) => api(`/interests/${r._id}/qualification`, "POST", b)}
          />
        )}
      </section>
    );
  }
  return (
    <section className="platform-card">
      <h2>{tab} record</h2>
      <dl>
        {Object.entries(r)
          .filter(([k]) => !["__v", "notes", "qualification"].includes(k))
          .map(([k, v]) => (
            <React.Fragment key={k}>
              <dt>{title(k)}</dt>
              <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
            </React.Fragment>
          ))}
      </dl>
      {tab === "CRM" && (
        <>
          <Rows
            rows={(r.notes || []).map((n: any, i: number) => ({
              id: i,
              title: n.text,
              createdAt: n.at,
            }))}
          />
          <DataForm
            label="Add internal note"
            fields={[
              { name: "text", label: "Internal note", type: "textarea" },
            ]}
            submit={(b) => api(`/leads/${r._id}/notes`, "POST", b)}
          />
        </>
      )}
      {tab === "Notifications" && (
        <DataForm
          label="Mark read"
          fields={[]}
          submit={async () => {
            await api(`/notifications/${r._id}/read`, "POST", {});
            await refresh();
          }}
        />
      )}
    </section>
  );
}

function PracticeWorkspace({ p, api, reload }: any) {
  const [section, setSection] = useState("Overview");
  const staff = p.permissions?.review === true;
  const [docs, setDocs] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const [d, s] = await Promise.all([
        api(`/practices/${p._id}/documents`),
        api(`/practices/${p._id}/ownership`),
      ]);
      setDocs(d);
      setSnapshots(s);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    refresh();
  }, [p._id]);
  const reason: Field = {
    name: "reason",
    label: "Evidence / decision reason",
    value: "Reviewed synthetic development evidence",
  };
  return (
    <>
      <h2>{p.intake.displayName}</h2>
      <p>
        Private · {title(p.intake.category)} · {p.intake.country} · Practice ID:{" "}
        <code>{p._id}</code>
      </p>
      {error && <p role="alert">{error}</p>}
      <WorkspaceSections
        value={section}
        change={setSection}
        labels={[
          "Overview",
          "Listing review",
          "Documents",
          "Ownership",
          ...(staff ? ["Deal setup"] : []),
          "Valuation",
        ]}
      />
      <div hidden={section !== "Overview"}>
        <details>
          <summary>Private intake record</summary>
          <dl>
            {Object.entries(p.intake).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>{title(k)}</dt>
                <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
              </React.Fragment>
            ))}
          </dl>
        </details>
        {p.permissions?.assign && (
          <DataForm
            label="Assign broker"
            fields={[
              {
                name: "brokerId",
                label: "Active broker user ID",
                value: p.brokerId,
              },
              reason,
            ]}
            submit={async (b) => {
              await api(`/practices/${p._id}/assign`, "POST", b);
              await reload();
            }}
          />
        )}
      </div>
      <div hidden={section !== "Listing review"}>
        <DataForm
          label={staff ? "Review public teaser" : "Submit teaser for review"}
          fields={[
            {
              name: "headline",
              label: "Anonymized headline",
              value: `${title(p.intake.category)} practice transition opportunity`,
            },
            {
              name: "summary",
              label:
                "Approved anonymized summary — exclude identity and raw financials",
              type: "textarea",
              value:
                "Established healthcare practice seeking a considered ownership transition.",
            },
            {
              name: "region",
              label: "Broad public region",
              value: p.intake.region,
            },
            {
              name: "status",
              label: "Listing status",
              options: staff
                ? [
                    "review",
                    "published",
                    "paused",
                    "underOffer",
                    "withdrawn",
                    "closed",
                  ]
                : ["draft", "review"],
            },
            reason,
          ]}
          submit={(b) =>
            api(`/practices/${p._id}/listing`, "POST", {
              status: b.status,
              reason: b.reason,
              teaser: {
                headline: b.headline,
                summary: b.summary,
                region: b.region,
                country: p.intake.country,
                category: p.intake.category,
                transitionPurpose: p.intake.transitionPurpose,
              },
            })
          }
        />
      </div>
      <div hidden={section !== "Documents"}>
        <h2>Private document workspace</h2>
        <p>
          PDF or UTF-8 text, up to 2 MiB. No patient-identifiable or clinical
          records. Uploads remain quarantined until a clean scan and explicit
          review.
        </p>
        <Upload practiceId={p._id} api={api} refresh={refresh} staff={staff} />
        {docs.map((d) => (
          <article className="platform-card" key={d.id}>
            <h3>
              {d.name} <Badge value={d.state} />
            </h3>
            <p>
              {d.category} · {d.classification} · <code>{d.id}</code>
            </p>
            {d.state === "released" && (
              <a
                className="platform-link"
                href={`/api/v1/documents/${d.id}/download`}
              >
                Download reviewed document
              </a>
            )}
            {staff && d.state === "quarantined" && (
              <DataForm
                label="Run synthetic development scan"
                fields={[]}
                submit={async () => {
                  await api(`/documents/${d.id}/scan`, "POST", {});
                  await refresh();
                }}
              />
            )}
            {staff && d.state === "clean" && (
              <DataForm
                label="Review and release"
                fields={[reason]}
                submit={async (b) => {
                  await api(`/documents/${d.id}/release`, "POST", b);
                  await refresh();
                }}
              />
            )}
            {staff && (
              <DataForm
                label="Delete document"
                fields={[reason]}
                submit={async (b) => {
                  if (
                    !window.confirm(
                      "Delete this document subject to retention and legal holds?",
                    )
                  )
                    return;
                  await api(`/documents/${d.id}`, "DELETE", b);
                  await refresh();
                }}
              />
            )}
          </article>
        ))}
      </div>
      <div hidden={section !== "Ownership"}>
        <h2>Ownership history</h2>
        {snapshots.map((s) => (
          <section className="platform-card" key={s._id}>
            <p>
              Snapshot <code>{s._id}</code>
            </p>
            <table>
              <thead>
                <tr>
                  <th>Legal owner</th>
                  <th>Owner ID</th>
                  <th>Holding</th>
                </tr>
              </thead>
              <tbody>
                {s.holdings.map((h: any) => (
                  <tr key={h.ownerId}>
                    <td>{h.legalName}</td>
                    <td>{h.ownerId}</td>
                    <td>{h.basisPoints / 100}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        {staff && (
          <>
            <OwnershipEditor
              practice={p}
              snapshots={snapshots}
              docs={docs}
              api={api}
              refresh={async () => {
                await reload();
                await refresh();
              }}
            />
          </>
        )}
      </div>
      <div hidden={section !== "Deal setup"}>
        {staff && <DealCreator practice={p} docs={docs} api={api} />}
      </div>
      <div hidden={section !== "Valuation"}>
        <PracticeValuation practice={p} api={api} refresh={reload} />
      </div>
    </>
  );
}
function Upload({ practiceId, api, refresh, staff }: any) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="platform-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        const file = data.get("file") as File;
        try {
          if (!file || file.size > 2097152)
            throw new Error("Choose a PDF or text file up to 2 MiB");
          const d = await api(`/practices/${practiceId}/documents`, "POST", {
            name: file.name,
            category: data.get("category"),
            classification: data.get("classification"),
          });
          const bytes = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          bytes.forEach((b) => {
            binary += String.fromCharCode(b);
          });
          await api(`/documents/${d.id}/content`, "PUT", {
            content: btoa(binary),
          });
          await refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="platform-fields">
        <label>
          Document
          <input name="file" type="file" accept=".pdf,.txt" required />
        </label>
        <label>
          Evidence category
          <select name="category">
            {[
              "authority",
              "ownership",
              "consent",
              "financial",
              "licence",
              "equipment",
              "terms",
              "closing",
              "valuation",
              "other",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Classification
          <select name="classification">
            {["participant", "owner", ...(staff ? ["internal"] : [])].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <button disabled={busy}>
        {busy ? "Uploading…" : "Upload to quarantine"}
      </button>
      {error && (
        <p role="alert" className="platform-error">
          {error}
        </p>
      )}
    </form>
  );
}
function DealWorkspace({ d, api, reload, actorId }: any) {
  const [section, setSection] = useState("Overview");
  const staff = d.permissions?.manage === true;
  const [access, setAccess] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [agreement, setAgreement] = useState<any>(null);
  const [error, setError] = useState("");
  async function refresh() {
    await reload();
    try {
      const [a, ds, n] = await Promise.all([
        api(`/practices/${d.practiceId}/access`),
        api(`/practices/${d.practiceId}/documents`),
        api("/agreement"),
      ]);
      setAccess(a);
      setDocs(ds);
      setAgreement(n);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    refresh();
  }, [d.id]);
  const reason: Field = {
    name: "reason",
    label: "Recorded reason",
    value: "Reviewed synthetic development evidence",
  };
  const action = (path: string) => async (b: any) => {
    await api(path, "POST", b);
    await refresh();
  };
  return (
    <>
      <h2>
        {title(d.purpose)} <Badge value={d.stage} />
      </h2>
      <p>
        Deal <code>{d.id}</code> · Practice <code>{d.practiceId}</code> ·{" "}
        {title(d.legalStructure)}
      </p>
      {error && (
        <p role="alert" className="platform-error">
          {error}
        </p>
      )}
      <div className="platform-stages">
        {[
          "initiated",
          "preparation",
          "diligence",
          "termsAgreed",
          "closing",
          "closed",
          "handover",
          "completed",
        ].map((s) => (
          <span className={d.stage === s ? "current" : ""} key={s}>
            {title(s)}
          </span>
        ))}
      </div>
      <WorkspaceSections
        value={section}
        change={setSection}
        labels={[
          "Overview",
          "Access",
          ...(d.ownership ? ["Ownership"] : []),
          "Offers",
          "Diligence",
          "Closing & handover",
          "Activity",
        ]}
      />
      <div hidden={section !== "Overview"}>
        <div className="platform-grid platform-workspace-metrics">
          <article className="platform-card">
            <p>Mandatory diligence remaining</p>
            <strong className="platform-number">
              {
                d.diligence.filter(
                  (item: any) =>
                    item.mandatory &&
                    !["accepted", "waived"].includes(item.status),
                ).length
              }
            </strong>
          </article>
          <article className="platform-card">
            <p>Open tasks</p>
            <strong className="platform-number">
              {d.tasks.filter((task: any) => !task.done).length}
            </strong>
          </article>
          <article className="platform-card">
            <p>Identity access</p>
            <strong>
              {access?.identity
                ? "Available in your scope"
                : "Controlled disclosure"}
            </strong>
          </article>
        </div>
        <h3>Named participants</h3>
        <Rows
          rows={d.participants.map((p: any) => ({
            id: p.userId,
            title: p.name || p.userId,
            status: p.capacity,
          }))}
        />
      </div>
      <div hidden={section !== "Access"}>
        <h2>Confidentiality and disclosure</h2>
        {access?.identity ? (
          <dl>
            {Object.entries(access.identity).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>{title(k)}</dt>
                <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
              </React.Fragment>
            ))}
          </dl>
        ) : (
          <p>
            Private identity is locked. Current qualification, agreement
            evidence, participation and a named grant are all required.
          </p>
        )}
        {access?.financialOverview && (
          <section className="platform-card">
            <h3>Financial overview</h3>
            <div className="platform-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {access.financialOverview.map((period: any, i: number) => (
                    <tr key={i}>
                      <td>{period.period}</td>
                      <td>
                        {formatMoney(period.revenueMinor, period.currency)}
                      </td>
                      <td>
                        {formatMoney(period.expensesMinor, period.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {agreement?.text ? (
          <details>
            <summary>Agreement {agreement.version}</summary>
            <p className="platform-agreement">{agreement.text}</p>
            <p>{agreement.notice}</p>
            <DataForm
              label="Record agreement acceptance"
              fields={[
                { name: "actorName", label: "Your registered full name" },
                { name: "representedParty", label: "Represented legal party" },
                {
                  name: "authority",
                  label: "I declare authority to accept for this party",
                  type: "checkbox",
                },
              ]}
              submit={(b) =>
                action(`/practices/${d.practiceId}/nda`)({
                  ...b,
                  hash: agreement.hash,
                  version: agreement.version,
                })
              }
            />
          </details>
        ) : (
          <p>
            Agreement acceptance is unavailable until reviewed template text and
            version are configured.
          </p>
        )}
        {staff && (
          <DataForm
            label="Review private participant qualification"
            fields={[
              {
                name: "userId",
                label: "Named participant",
                choices: d.participants.map((p: any) => ({
                  value: p.userId,
                  label: p.name || p.userId,
                })),
              },
              {
                name: "status",
                label: "Decision",
                options: ["approved", "rejected", "revoked"],
              },
              { name: "expiresAt", label: "Expiry (UTC)", value: future() },
              reason,
            ]}
            submit={action(`/practices/${d.practiceId}/qualification`)}
          />
        )}
        {staff && (
          <AccessEditor deal={d} docs={docs} api={api} refresh={refresh} />
        )}
        {access?.grants?.map((g: any) => (
          <article className="platform-card" key={g._id}>
            <p>
              {g.userId} · {g.scopes.join(", ")} · Expires {g.expiresAt}{" "}
              {g.revokedAt && "· Revoked"}
            </p>
            {staff && !g.revokedAt && (
              <DataForm
                label="Revoke grant"
                fields={[reason]}
                submit={action(`/grants/${g._id}/revoke`)}
              />
            )}
          </article>
        ))}
        <h3>Reviewed documents</h3>
        {access?.canUpload && (
          <Upload
            practiceId={d.practiceId}
            api={api}
            refresh={refresh}
            staff={false}
          />
        )}
        {docs.map((doc) => (
          <p key={doc.id}>
            {doc.name} <Badge value={doc.state} />{" "}
            {doc.state === "released" && (
              <a href={`/api/v1/documents/${doc.id}/download`}>Download</a>
            )}
          </p>
        ))}
      </div>
      <div hidden={section !== "Ownership"}>
        {d.ownership && (
          <section className="platform-card">
            <h3>Current ownership snapshot</h3>
            {d.legalStructure === "assetTransfer" && (
              <p>
                Asset transfers do not automatically change legal entity
                ownership.
              </p>
            )}
            <div className="platform-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Legal owner</th>
                    <th>Current holding</th>
                  </tr>
                </thead>
                <tbody>
                  {d.ownership.holdings.map((owner: any) => (
                    <tr key={owner.ownerId}>
                      <td>{owner.legalName}</td>
                      <td>{owner.basisPoints / 100}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}{" "}
        {staff &&
          d.legalStructure === "equityTransfer" &&
          !["closed", "handover", "completed", "cancelled"].includes(
            d.stage,
          ) && (
            <TransferEditor deal={d} docs={docs} api={api} refresh={refresh} />
          )}
      </div>
      <div hidden={section !== "Offers"}>
        <h2>Offer revisions</h2>
        <p>
          Submitted terms are immutable. A revision creates a new offer.
          Acceptance records terms and never closes a deal.
        </p>
        {d.offers.map((o: any) => (
          <article className="platform-card" key={o._id}>
            <h3>
              {formatMoney(o.terms.amountMinor, o.terms.currency)}{" "}
              <Badge value={o.status} />
            </h3>
            <p>
              Offer ID: <code>{o._id}</code> · Stake{" "}
              {o.terms.stakeBasisPoints / 100}%
            </p>
            <p>{o.terms.conditions}</p>
            {o.status === "submitted" &&
              (d.permissions?.decide || d.permissions?.offer) &&
              !["closed", "handover", "completed", "cancelled"].includes(
                d.stage,
              ) && (
                <details>
                  <summary>Counter this offer</summary>
                  <OfferEditor
                    deal={d}
                    docs={docs}
                    api={api}
                    refresh={refresh}
                    counter={o}
                  />
                </details>
              )}
            {o.status === "submitted" &&
              (d.permissions?.decide || o.userId === actorId) && (
                <OfferDecision
                  deal={d}
                  offer={o}
                  docs={docs}
                  api={api}
                  refresh={refresh}
                  actorId={actorId}
                />
              )}
          </article>
        ))}
        {d.permissions?.offer &&
          !["closed", "handover", "completed", "cancelled"].includes(
            d.stage,
          ) && <OfferEditor deal={d} docs={docs} api={api} refresh={refresh} />}
      </div>
      <div hidden={section !== "Diligence"}>
        <h2>Due diligence</h2>
        {d.diligence.map((item: any) => (
          <section key={item.id} className="platform-card">
            <h3>
              {item.title} <Badge value={item.status} />
            </h3>
            {!["closed", "handover", "completed", "cancelled"].includes(
              d.stage,
            ) && (
              <DataForm
                label="Update checklist item"
                fields={[
                  {
                    name: "status",
                    label: "Status",
                    options: staff
                      ? ["submitted", "accepted", "changesRequested", "waived"]
                      : ["submitted"],
                  },
                  {
                    name: "evidenceDocumentId",
                    label: "Reviewed evidence",
                    choices: [
                      {
                        value: "",
                        label:
                          "Choose released evidence (or waive with reason)",
                      },
                      ...docs
                        .filter(
                          (doc: any) =>
                            doc.state === "released" &&
                            (!item.evidenceCategory ||
                              doc.category === item.evidenceCategory),
                        )
                        .map((doc: any) => ({
                          value: doc.id,
                          label: doc.name,
                        })),
                    ],
                    required: false,
                  },
                  reason,
                ]}
                submit={action(`/deals/${d.id}/diligence/${item.id}`)}
              />
            )}
          </section>
        ))}
      </div>
      <div hidden={section !== "Closing & handover"}>
        {" "}
        {staff && !["completed", "cancelled"].includes(d.stage) && (
          <>
            <DataForm
              label="Transition deal stage"
              fields={[
                {
                  name: "stage",
                  label: "Target stage",
                  options:
                    (
                      {
                        initiated: ["preparation", "onHold", "cancelled"],
                        preparation: [
                          "initiated",
                          "diligence",
                          "onHold",
                          "cancelled",
                        ],
                        diligence: [
                          "preparation",
                          "termsAgreed",
                          "onHold",
                          "cancelled",
                        ],
                        termsAgreed: [
                          "diligence",
                          "closing",
                          "onHold",
                          "cancelled",
                        ],
                        closing: ["termsAgreed", "onHold", "cancelled"],
                        closed: ["handover"],
                        handover: ["completed"],
                        onHold: [
                          d.history
                            .filter((h: any) => h.stage !== "onHold")
                            .at(-1)?.stage || "preparation",
                          "cancelled",
                        ],
                      } as Record<string, string[]>
                    )[d.stage] || [],
                },
                reason,
              ]}
              submit={(b) =>
                action(`/deals/${d.id}/stage`)({ ...b, revision: d.revision })
              }
            />
            {d.stage === "closing" && (
              <DataForm
                label="Confirm external legal closing"
                fields={[
                  {
                    name: "evidenceDocumentId",
                    label: "Reviewed external legal-close evidence",
                    choices: docs
                      .filter(
                        (doc: any) =>
                          doc.state === "released" &&
                          doc.category === "closing",
                      )
                      .map((doc: any) => ({ value: doc.id, label: doc.name })),
                  },
                  {
                    name: "baselineId",
                    label: "Current ownership baseline",
                    value: d.baselineId,
                  },
                  reason,
                ]}
                submit={async (b) => {
                  if (
                    !window.confirm(
                      "Record external legal closing and apply the authorized ownership proposal where relevant?",
                    )
                  )
                    return;
                  await action(`/deals/${d.id}/close`)(b);
                }}
              />
            )}
          </>
        )}
        <h2>Tasks and handover</h2>
        {d.tasks.map((t: any) => (
          <article className="platform-card" key={t._id}>
            <strong>{t.title}</strong>{" "}
            <Badge value={t.done ? "completed" : "open"} />
            <p>
              {t.kind} · Due {t.dueAt}
            </p>
            {!t.done &&
              (staff || t.assignedTo === actorId) &&
              (t.kind !== "handover" ||
                ["closed", "handover"].includes(d.stage)) && (
                <DataForm
                  label="Complete task"
                  fields={[]}
                  submit={action(`/tasks/${t._id}/complete`)}
                />
              )}
          </article>
        ))}
        {staff && !["completed", "cancelled"].includes(d.stage) && (
          <DataForm
            label="Assign task"
            fields={[
              { name: "title", label: "Task" },
              {
                name: "assignedTo",
                label: "Assigned actor",
                choices: [
                  { value: actorId, label: "Me" },
                  ...d.participants
                    .filter((p: any) => p.active)
                    .map((p: any) => ({
                      value: p.userId,
                      label: p.name || p.userId,
                    })),
                ],
                value: actorId,
              },
              { name: "dueAt", label: "Due at (UTC)", value: future() },
              {
                name: "mandatory",
                label: "Mandatory",
                type: "checkbox",
                value: true,
              },
              {
                name: "kind",
                label: "Kind",
                options: ["handover", "followUp"],
              },
            ]}
            submit={action(`/deals/${d.id}/tasks`)}
          />
        )}
      </div>
      <div hidden={section !== "Activity"}>
        <h3>Activity history</h3>
        <Rows
          rows={d.history.map((h: any, i: number) => ({
            id: i,
            title: `${title(h.stage)}: ${h.reason}`,
            createdAt: h.at,
          }))}
        />
      </div>
    </>
  );
}

