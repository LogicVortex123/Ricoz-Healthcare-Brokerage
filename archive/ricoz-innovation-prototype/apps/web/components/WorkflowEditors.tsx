"use client";
import React, { useEffect, useState } from "react";

type Api = (path: string, method?: string, body?: any) => Promise<any>;
type Doc = {
  id: string;
  name: string;
  category: string;
  state: string;
  classification: string;
};
type Holding = { ownerId: string; legalName: string; basisPoints: number };
export function formatMoney(minor: number, currency: string) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  });
  return formatter.format(
    minor / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2),
  );
}
export function EvidenceSelect({
  docs,
  category,
  name = "evidenceDocumentId",
  label = "Reviewed evidence",
  required = true,
}: {
  docs: Doc[];
  category?: string;
  name?: string;
  label?: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <select name={name} required={required} defaultValue="">
        <option value="">Choose a released document</option>
        {docs
          .filter(
            (d) =>
              d.state === "released" && (!category || d.category === category),
          )
          .map((d) => (
            <option value={d.id} key={d.id}>
              {d.name} · {d.category}
            </option>
          ))}
      </select>
    </label>
  );
}
function Form({
  title,
  onSubmit,
  children,
}: {
  title: string;
  onSubmit: (data: FormData) => Promise<any>;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  return (
    <form
      className="platform-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        setDone("");
        try {
          await onSubmit(data);
          setDone("Saved.");
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>{title}</h3>
      {children}
      <button disabled={busy}>{busy ? "Saving…" : title}</button>
      {error && (
        <p className="platform-error" role="alert">
          {error}
        </p>
      )}
      {done && <p role="status">{done}</p>}
    </form>
  );
}
const Reason = () => (
  <label>
    Recorded reason
    <textarea name="reason" minLength={5} maxLength={1000} required />
  </label>
);
export function OwnershipEditor({
  practice,
  snapshots,
  docs,
  api,
  refresh,
}: {
  practice: any;
  snapshots: any[];
  docs: Doc[];
  api: Api;
  refresh: () => Promise<any>;
}) {
  const baseline = snapshots.find(
    (s) => s._id === practice.ownershipSnapshotId,
  );
  const [rows, setRows] = useState<Holding[]>(
    baseline?.holdings || [{ ownerId: "", legalName: "", basisPoints: 10000 }],
  );
  useEffect(() => {
    if (baseline) setRows(baseline.holdings);
  }, [baseline?._id]);
  const total = rows.reduce((sum, h) => sum + h.basisPoints, 0);
  const update = (i: number, field: string, value: string) =>
    setRows(
      rows.map((h, n) =>
        n === i
          ? {
              ...h,
              [field]:
                field === "basisPoints"
                  ? Math.round(Number(value) * 100)
                  : value,
            }
          : h,
      ),
    );
  return (
    <Form
      title={
        baseline
          ? "Refresh ownership evidence"
          : "Verify initial ownership snapshot"
      }
      onSubmit={async (data) => {
        if (total !== 10000)
          throw new Error("Ownership must total exactly 100%.");
        await api(`/practices/${practice._id}/ownership`, "POST", {
          holdings: rows.map(({ ownerId, legalName, basisPoints }) => ({
            ownerId,
            legalName,
            basisPoints,
          })),
          evidenceDocumentId: data.get("evidenceDocumentId"),
          baselineId: practice.ownershipSnapshotId || null,
          reason: data.get("reason"),
        });
        await refresh();
      }}
    >
      <p>
        Legal owners are independent of login accounts. Existing holdings change
        only through an authorized closing.
      </p>
      {rows.map((row, i) => (
        <div className="platform-fields platform-inset" key={i}>
          <label>
            Legal owner name {i + 1}
            <input
              value={row.legalName}
              required
              readOnly={!!baseline}
              onChange={(e) => update(i, "legalName", e.target.value)}
            />
          </label>
          <label>
            Stable legal owner identifier {i + 1}
            <input
              value={row.ownerId}
              required
              readOnly={!!baseline}
              onChange={(e) => update(i, "ownerId", e.target.value)}
            />
          </label>
          <label>
            Ownership percentage {i + 1}
            <input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={row.basisPoints / 100}
              required
              readOnly={!!baseline}
              onChange={(e) => update(i, "basisPoints", e.target.value)}
            />
          </label>
          {!baseline && rows.length > 1 && (
            <button
              type="button"
              className="secondary"
              onClick={() => setRows(rows.filter((_, n) => n !== i))}
            >
              Remove owner {i + 1}
            </button>
          )}
        </div>
      ))}
      {!baseline && (
        <button
          type="button"
          className="secondary"
          onClick={() =>
            setRows([...rows, { ownerId: "", legalName: "", basisPoints: 0 }])
          }
        >
          Add legal owner
        </button>
      )}
      <p role="status">Total ownership: {(total / 100).toFixed(2)}%</p>
      <div className="platform-fields">
        <EvidenceSelect docs={docs} category="ownership" />
        <Reason />
      </div>
    </Form>
  );
}
export function DealCreator({
  practice,
  docs,
  api,
}: {
  practice: any;
  docs: Doc[];
  api: Api;
}) {
  const [people, setPeople] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  useEffect(() => {
    api(`/practices/${practice._id}/directory`)
      .then(setPeople)
      .catch((e) => setError(e.message));
  }, [practice._id]);
  const update = (i: number, field: string, value: string) =>
    setParticipants(
      participants.map((p, n) => (n === i ? { ...p, [field]: value } : p)),
    );
  return (
    <Form
      title="Create private deal"
      onSubmit={async (data) => {
        if (!participants.length)
          throw new Error("Add at least one named participant.");
        const d = await api("/deals", "POST", {
          practiceId: practice._id,
          purpose: data.get("purpose"),
          legalStructure: data.get("legalStructure"),
          participants,
          reason: data.get("reason"),
        });
        setCreatedId(d.id);
      }}
    >
      <p>
        A retirement or succession can be entirely private, with named existing
        partners and no external buyer.
      </p>
      <div className="platform-fields">
        <label>
          Transition purpose
          <select
            name="purpose"
            defaultValue={practice.intake.transitionPurpose}
          >
            {[
              "fullAcquisition",
              "partialBuyout",
              "partnerRetirement",
              "succession",
            ].map((s) => (
              <option value={s} key={s}>
                {s.replace(/([A-Z])/g, " $1")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Legal structure
          <select
            name="legalStructure"
            defaultValue={practice.intake.legalStructure}
          >
            {["equityTransfer", "assetTransfer", "otherReviewed"].map((s) => (
              <option value={s} key={s}>
                {s.replace(/([A-Z])/g, " $1")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="platform-fields platform-inset">
        <label>
          Find registered participant by exact email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="secondary"
          onClick={async () => {
            try {
              const found = await api(
                `/practices/${practice._id}/directory?email=${encodeURIComponent(email)}`,
              );
              if (!found.length)
                throw new Error(
                  "No verified active account found. Ask the participant to register and verify first.",
                );
              setPeople([
                ...people.filter((p) => !found.some((f: any) => f.id === p.id)),
                ...found,
              ]);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Find participant
        </button>
      </div>
      <label>
        Add a named participant
        <select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            setParticipants([
              ...participants,
              {
                userId: e.target.value,
                capacity: "buyer",
                authorityDocumentId: "",
              },
            ]);
          }}
        >
          <option value="">Choose a related or located person</option>
          {people
            .filter((p) => !participants.some((x) => x.userId === p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.email}
              </option>
            ))}
        </select>
      </label>
      {participants.map((p, i) => (
        <div className="platform-inset" key={p.userId}>
          <h4>{people.find((x) => x.id === p.userId)?.name}</h4>
          <div className="platform-fields">
            <label>
              Participant capacity {i + 1}
              <select
                value={p.capacity}
                onChange={(e) => update(i, "capacity", e.target.value)}
              >
                {[
                  "buyer",
                  "acquirer",
                  "retiringPartner",
                  "remainingPartner",
                  "successor",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Authority evidence {i + 1}
              <select
                required
                value={p.authorityDocumentId}
                onChange={(e) =>
                  update(i, "authorityDocumentId", e.target.value)
                }
              >
                <option value="">Choose released authority evidence</option>
                {docs
                  .filter(
                    (d) => d.state === "released" && d.category === "authority",
                  )
                  .map((d) => (
                    <option value={d.id} key={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() =>
              setParticipants(participants.filter((_, n) => n !== i))
            }
          >
            Remove participant
          </button>
        </div>
      ))}
      {error && (
        <p role="alert" className="platform-error">
          {error}
        </p>
      )}
      <Reason />
      {createdId && (
        <p role="status">
          Private deal created. Open Deals to continue the qualification and
          disclosure workflow.
        </p>
      )}
    </Form>
  );
}
export function TransferEditor({
  deal,
  docs,
  api,
  refresh,
}: {
  deal: any;
  docs: Doc[];
  api: Api;
  refresh: () => Promise<any>;
}) {
  const before: Holding[] = deal.ownership?.holdings || [];
  const [rows, setRows] = useState<any[]>(
    deal.proposal?.transfers || [
      {
        fromOwnerId: "",
        toOwnerId: "",
        toLegalName: "",
        basisPoints: 0,
        consentDocumentId: "",
      },
    ],
  );
  const update = (i: number, field: string, value: string) =>
    setRows(
      rows.map((r, n) =>
        n === i
          ? {
              ...r,
              [field]:
                field === "basisPoints"
                  ? Math.round(Number(value) * 100)
                  : value,
            }
          : r,
      ),
    );
  const after = new Map(before.map((h) => [h.ownerId, { ...h }]));
  for (const t of rows) {
    const from = after.get(t.fromOwnerId);
    if (from) from.basisPoints -= t.basisPoints;
    if (t.toOwnerId) {
      const to = after.get(t.toOwnerId);
      if (to) to.basisPoints += t.basisPoints;
      else
        after.set(t.toOwnerId, {
          ownerId: t.toOwnerId,
          legalName: t.toLegalName,
          basisPoints: t.basisPoints,
        });
    }
  }
  return (
    <Form
      title="Record transfer proposal"
      onSubmit={async (data) => {
        await api(`/deals/${deal.id}/proposal`, "POST", {
          baselineId: deal.ownership?._id,
          transfers: rows,
          disputed: data.get("disputed") === "on",
          reason: data.get("reason"),
        });
        await refresh();
      }}
    >
      <p>
        Transfer percentage points of the entire practice. Transferring 30
        points from a 60% holding leaves 30%.
      </p>
      {rows.map((t, i) => (
        <div className="platform-fields platform-inset" key={i}>
          <label>
            Transferor {i + 1}
            <select
              required
              value={t.fromOwnerId}
              onChange={(e) => update(i, "fromOwnerId", e.target.value)}
            >
              <option value="">Choose baseline legal owner</option>
              {before.map((h) => (
                <option key={h.ownerId} value={h.ownerId}>
                  {h.legalName} · {h.basisPoints / 100}%
                </option>
              ))}
            </select>
          </label>
          <label>
            Transferee legal owner identifier {i + 1}
            <input
              list={`owners-${deal.id}`}
              required
              value={t.toOwnerId}
              onChange={(e) => update(i, "toOwnerId", e.target.value)}
            />
          </label>
          <label>
            Transferee legal name {i + 1}
            <input
              required
              value={t.toLegalName}
              onChange={(e) => update(i, "toLegalName", e.target.value)}
            />
          </label>
          <label>
            Percentage points transferred {i + 1}
            <input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              required
              value={t.basisPoints / 100}
              onChange={(e) => update(i, "basisPoints", e.target.value)}
            />
          </label>
          <label>
            Consent evidence {i + 1}
            <select
              required
              value={t.consentDocumentId}
              onChange={(e) => update(i, "consentDocumentId", e.target.value)}
            >
              <option value="">Choose released consent</option>
              {docs
                .filter(
                  (d) => d.state === "released" && d.category === "consent",
                )
                .map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </label>
          {rows.length > 1 && (
            <button
              type="button"
              className="secondary"
              onClick={() => setRows(rows.filter((_, n) => n !== i))}
            >
              Remove transfer
            </button>
          )}
        </div>
      ))}
      <datalist id={`owners-${deal.id}`}>
        {before.map((h) => (
          <option key={h.ownerId} value={h.ownerId}>
            {h.legalName}
          </option>
        ))}
      </datalist>
      <button
        type="button"
        className="secondary"
        onClick={() =>
          setRows([
            ...rows,
            {
              fromOwnerId: "",
              toOwnerId: "",
              toLegalName: "",
              basisPoints: 0,
              consentDocumentId: "",
            },
          ])
        }
      >
        Add transfer
      </button>
      <div className="platform-table-scroll">
        <table>
          <caption>Ownership before and proposed after closing</caption>
          <thead>
            <tr>
              <th>Legal owner</th>
              <th>Before</th>
              <th>Proposed after</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(after.values()).map((h) => (
              <tr key={h.ownerId}>
                <td>{h.legalName || h.ownerId}</td>
                <td>
                  {(before.find((b) => b.ownerId === h.ownerId)?.basisPoints ||
                    0) / 100}
                  %
                </td>
                <td>
                  {h.basisPoints / 100}%
                  {h.basisPoints < 0 && " — invalid over-transfer"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label>
        <input
          name="disputed"
          type="checkbox"
          defaultChecked={deal.proposal?.disputed}
        />
        A transfer is disputed; block progression until resolved
      </label>
      <Reason />
    </Form>
  );
}
export function AccessEditor({
  deal,
  docs,
  api,
  refresh,
}: {
  deal: any;
  docs: Doc[];
  api: Api;
  refresh: () => Promise<any>;
}) {
  return (
    <Form
      title="Grant named access"
      onSubmit={async (data) => {
        await api(`/practices/${deal.practiceId}/grants`, "POST", {
          userId: data.get("userId"),
          scopes: data.getAll("scopes"),
          expiresAt: new Date(String(data.get("expiresAt"))).toISOString(),
          reason: data.get("reason"),
        });
        await refresh();
      }}
    >
      <div className="platform-fields">
        <label>
          Named participant
          <select name="userId" required>
            <option value="">Choose participant</option>
            {deal.participants
              .filter((p: any) => p.active)
              .map((p: any) => (
                <option key={p.userId} value={p.userId}>
                  {p.name || p.userId} · {p.capacity}
                </option>
              ))}
          </select>
        </label>
        <label>
          Grant expires at (local time)
          <input type="datetime-local" name="expiresAt" required />
        </label>
      </div>
      <fieldset>
        <legend>Explicit disclosure scopes</legend>
        {[
          ["identity", "Practice identity and address"],
          ["financials", "Raw financial overview"],
          ["upload", "Upload private participant documents"],
          ...docs
            .filter(
              (d) =>
                d.state === "released" && d.classification === "participant",
            )
            .map((d) => [`document:${d.id}`, d.name]),
        ].map(([value, label]) => (
          <label className="platform-checkbox" key={value}>
            <input type="checkbox" name="scopes" value={value} />
            {label}
          </label>
        ))}
      </fieldset>
      <Reason />
    </Form>
  );
}
export function OfferEditor({
  deal,
  docs,
  api,
  refresh,
  counter,
}: {
  deal: any;
  docs: Doc[];
  api: Api;
  refresh: () => Promise<any>;
  counter?: any;
}) {
  const [currency, setCurrency] = useState(counter?.terms.currency || "GBP");
  const digits =
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: /^[A-Z]{3}$/.test(currency) ? currency : "GBP",
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return (
    <Form
      title={counter ? "Submit counteroffer revision" : "Submit offer revision"}
      onSubmit={async (data) => {
        const terms = {
          amountMinor: Math.round(Number(data.get("amount")) * 10 ** digits),
          currency,
          stakeBasisPoints: Math.round(Number(data.get("stake")) * 100),
          legalStructure: deal.legalStructure,
          exclusive: data.get("exclusive") === "on",
          conditions: data.get("conditions"),
          expiresAt: new Date(
            String(data.get("expiresAt")) + "Z",
          ).toISOString(),
          attachments: data.getAll("attachments"),
        };
        const previousId = data.get("previousId");
        await api(
          counter
            ? `/offers/${counter._id}/counter`
            : `/deals/${deal.id}/offers`,
          "POST",
          { ...terms, ...(!counter && previousId ? { previousId } : {}) },
        );
        await refresh();
      }}
    >
      <div className="platform-fields">
        <label>
          Offer amount
          <input
            name="amount"
            type="number"
            min="0.001"
            step="any"
            required
            defaultValue={
              counter ? counter.terms.amountMinor / 10 ** digits : undefined
            }
          />
        </label>
        <label>
          Offer currency
          <input
            value={currency}
            minLength={3}
            maxLength={3}
            pattern="[A-Z]{3}"
            required
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </label>
        <label>
          Practice stake percentage
          <input
            name="stake"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            required
            defaultValue={
              counter ? counter.terms.stakeBasisPoints / 100 : undefined
            }
          />
        </label>
        <label>
          Expires at (UTC)
          <input
            name="expiresAt"
            type="datetime-local"
            required
            defaultValue={new Date(Date.now() + 30 * 86400000)
              .toISOString()
              .slice(0, 16)}
          />
        </label>
      </div>
      <label>
        Conditions
        <textarea
          name="conditions"
          required
          minLength={5}
          maxLength={4000}
          defaultValue={counter?.terms.conditions}
        />
      </label>
      <label className="platform-checkbox">
        <input
          name="exclusive"
          type="checkbox"
          defaultChecked={counter?.terms.exclusive}
        />
        Exclusive terms � prevent conflicting accepted deals for this practice
      </label>
      {!counter && (
        <label>
          Revise a previous submitted offer (optional)
          <select name="previousId">
            <option value="">New offer</option>
            {deal.offers
              .filter((o: any) => o.status === "submitted")
              .map((o: any) => (
                <option key={o._id} value={o._id}>
                  {formatMoney(o.terms.amountMinor, o.terms.currency)} �{" "}
                  {o.createdAt}
                </option>
              ))}
          </select>
        </label>
      )}
      <fieldset>
        <legend>Reviewed document attachments</legend>
        {docs
          .filter((d) => d.state === "released")
          .map((d) => (
            <label className="platform-checkbox" key={d.id}>
              <input type="checkbox" name="attachments" value={d.id} />
              {d.name}
            </label>
          ))}
        {!docs.some((d) => d.state === "released") && (
          <p>No released attachments in your access scope.</p>
        )}
      </fieldset>
    </Form>
  );
}
export function OfferDecision({
  deal,
  offer,
  docs,
  api,
  refresh,
  actorId,
}: {
  deal: any;
  offer: any;
  docs: Doc[];
  api: Api;
  refresh: () => Promise<any>;
  actorId: string;
}) {
  const author = offer.submittedBy || offer.userId;
  const canDecide =
    deal.permissions?.manage ||
    (deal.permissions?.decide && author !== actorId) ||
    (offer.userId === actorId && author !== actorId);
  const options = [
    ...(canDecide ? ["accepted", "rejected"] : []),
    ...(author === actorId ? ["withdrawn"] : []),
  ];
  if (!options.length) return null;
  return (
    <Form
      title="Record offer decision"
      onSubmit={async (data) => {
        await api(`/offers/${offer._id}/decision`, "POST", {
          status: data.get("status"),
          ...(data.get("evidenceDocumentId")
            ? { evidenceDocumentId: data.get("evidenceDocumentId") }
            : {}),
          reason: data.get("reason"),
        });
        await refresh();
      }}
    >
      <div className="platform-fields">
        <label>
          Decision
          <select name="status">
            {options.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <EvidenceSelect
          docs={docs}
          category="terms"
          required={false}
          label="Reviewed terms communication (required for acceptance)"
        />
      </div>
      <Reason />
    </Form>
  );
}
export function ValuationWorkspace({
  record,
  api,
  staff,
  refresh,
}: {
  record: any;
  api: Api;
  staff: boolean;
  refresh: () => Promise<any>;
}) {
  const [detail, setDetail] = useState<any>(record);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [status, setStatus] = useState("inReview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function reload() {
    setBusy(true);
    setError("");
    try {
      const next = await api(`/valuations/${record.id || record._id}`);
      setDetail(next);
      setStatus(next.status === "requested" ? "inReview" : "reported");
      if (staff || next.practiceId) {
        const documents = await api(
          `/practices/${next.practiceId}/documents`,
        );
        setDocs(Array.isArray(documents) ? documents : documents.items || []);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    reload();
  }, [record.id, record._id]);
  const open = ["requested", "inReview"].includes(detail.status);
  const reportDocs = docs.filter(
    (d) =>
      d.state === "released" &&
      d.category === "valuation" &&
      ["owner", "participant"].includes(d.classification),
  );
  return (
    <section className="platform-card">
      <h2>{detail.title || detail.practiceName || "Human valuation"}</h2>
      <p className="platform-muted">
        Human request / review / report only. Asking prices are not appraisals
        and no automated estimate is produced.
      </p>
      {error && (
        <p role="alert" className="platform-error">
          {error}
        </p>
      )}
      <dl>
        <dt>Status</dt>
        <dd>{detail.status}</dd>
        <dt>Practice</dt>
        <dd>{detail.practiceName}</dd>
        <dt>Request reason</dt>
        <dd>{detail.requestReason}</dd>
        {detail.reviewReason && (
          <>
            <dt>Review note</dt>
            <dd>{detail.reviewReason}</dd>
          </>
        )}
        {detail.reviewerName && (
          <>
            <dt>Reviewer</dt>
            <dd>{detail.reviewerName}</dd>
          </>
        )}
        {detail.report && (
          <>
            <dt>Released report</dt>
            <dd>
              {detail.report.name}{" "}
              <a href={`/api/v1/documents/${detail.report.id}/download`}>
                Download report
              </a>
            </dd>
          </>
        )}
      </dl>
      {(detail.history || []).length > 0 && (
        <>
          <h3>Review history</h3>
          <ul>
            {detail.history.map((h: any, i: number) => (
              <li key={`${h.status}-${i}`}>
                {h.status}
                {h.reason ? ` — ${h.reason}` : ""}
                {h.at ? ` · ${new Date(h.at).toLocaleString()}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      {staff && open && detail.permissions?.review && (
        <Form
          title="Review valuation request"
          onSubmit={async (data) => {
            const nextStatus = String(data.get("status"));
            await api(`/valuations/${detail.id}/review`, "POST", {
              status: nextStatus,
              reason: data.get("reason"),
              revision: detail.revision || 0,
              ...(nextStatus === "reported"
                ? { reportDocumentId: data.get("reportDocumentId") }
                : {}),
            });
            await reload();
            await refresh();
          }}
        >
          <div className="platform-fields">
            <label>
              Decision
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {(detail.status === "requested"
                  ? ["inReview", "declined"]
                  : ["reported", "declined"]
                ).map((s) => (
                  <option key={s} value={s}>
                    {s === "inReview"
                      ? "Start human review"
                      : s === "reported"
                        ? "Publish human report"
                        : "Decline request"}
                  </option>
                ))}
              </select>
            </label>
            {status === "reported" && (
              <EvidenceSelect
                docs={reportDocs}
                category="valuation"
                name="reportDocumentId"
                label="Released valuation report"
              />
            )}
          </div>
          {!reportDocs.length && status === "reported" && (
            <p>
              Upload, scan and release a valuation-category document with owner
              or participant classification before publishing a report.
            </p>
          )}
          <Reason />
        </Form>
      )}
      {busy && <p role="status">Refreshing valuation…</p>}
    </section>
  );
}
export function PracticeValuation({
  practice,
  api,
  refresh,
}: {
  practice: any;
  api: Api;
  refresh: () => Promise<any>;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState("");
  const staff = practice.permissions?.review === true;
  async function load() {
    setError("");
    try {
      const list = await api(`/valuations?practiceId=${practice._id}`);
      setItems(Array.isArray(list) ? list : list.items || []);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, [practice._id]);
  const open = items.some((v) =>
    ["requested", "inReview"].includes(v.status),
  );
  if (selected)
    return (
      <>
        <button className="secondary" onClick={() => setSelected(null)}>
          ← Back to practice valuations
        </button>
        <ValuationWorkspace
          record={selected}
          api={api}
          staff={staff}
          refresh={async () => {
            await load();
            await refresh();
          }}
        />
      </>
    );
  return (
    <>
      <p className="platform-muted">
        Request a human valuation review. Reports are prepared by assigned
        staff; this workspace never invents multiples or automated estimates.
      </p>
      {error && (
        <p role="alert" className="platform-error">
          {error}
        </p>
      )}
      <div className="platform-rows">
        {!items.length && (
          <p className="platform-muted">No valuation requests yet.</p>
        )}
        {items.map((v) => (
          <article key={v.id}>
            <div>
              <strong>{v.title || "Human valuation"}</strong>
              <span className="platform-badge" data-status={v.status}>
                {v.status}
              </span>
            </div>
            <small>{v.requestReason}</small>
            <button className="secondary" onClick={() => setSelected(v)}>
              Open valuation
            </button>
          </article>
        ))}
      </div>
      {!open && (
        <Form
          title="Request human valuation"
          onSubmit={async (data) => {
            await api(`/practices/${practice._id}/valuation`, "POST", {
              reason: data.get("reason"),
            });
            await load();
            await refresh();
          }}
        >
          <Reason />
        </Form>
      )}
      {open && (
        <p role="status">
          An open valuation request is already in progress for this practice.
        </p>
      )}
    </>
  );
}
