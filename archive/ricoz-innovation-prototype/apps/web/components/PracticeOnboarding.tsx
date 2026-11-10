"use client";
import React, { useEffect, useState } from "react";
const steps = [
  "Practice identity",
  "Facilities and team",
  "Financial overview",
  "Transition intentions",
];
export default function PracticeOnboarding({
  api,
  refresh,
}: {
  api: (path: string, method?: string, body?: any) => Promise<any>;
  refresh: () => Promise<any>;
}) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("dental");
  const [brokerages, setBrokerages] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, string>>({
    country: "GB",
    transitionPurpose: "fullAcquisition",
    legalStructure: "equityTransfer",
  });
  const [periods, setPeriods] = useState([
    { period: "", currency: "GBP", revenue: "", expenses: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api("/brokerages")
      .then(setBrokerages)
      .catch((e) => setError(e.message));
  }, []);
  const input = (
    name: string,
    label: string,
    type = "text",
    extra: any = {},
  ) => (
    <label key={name}>
      {label}
      <input
        name={name}
        type={type}
        value={values[name] || ""}
        required
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        {...extra}
      />
    </label>
  );
  const updatePeriod = (i: number, field: string, value: string) =>
    setPeriods(periods.map((p, n) => (n === i ? { ...p, [field]: value } : p)));
  const select = (name: string, label: string, options: [string, string][]) => (
    <label>
      {label}
      <select
        name={name}
        value={values[name] || ""}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        required
      >
        <option value="">Select an option</option>
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const financials = periods.map((p) => {
        const digits =
          new Intl.NumberFormat("en", {
            style: "currency",
            currency: p.currency,
          }).resolvedOptions().maximumFractionDigits ?? 2;
        const scale = 10 ** digits;
        return {
          period: p.period,
          currency: p.currency,
          revenueMinor: Math.round(Number(p.revenue) * scale),
          expensesMinor: Math.round(Number(p.expenses) * scale),
        };
      });
      const common = Object.fromEntries(
        [
          "legalName",
          "displayName",
          "country",
          "region",
          "address",
          "ownershipStructure",
          "facility",
          "equipment",
          "transitionReason",
          "transitionPurpose",
          "legalStructure",
          "timeline",
        ].map((k) => [k, values[k]]),
      );
      const extensions =
        category === "dental"
          ? {
              specialty: values.specialty,
              operatories: Number(values.operatories),
            }
          : category === "veterinary"
            ? {
                species: values.species
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
                services: values.services
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              }
            : {
                specialty: values.specialty,
                consultationFacilities: values.consultationFacilities,
                procedureFacilities: values.procedureFacilities,
              };
      await api("/practices", "POST", {
        brokerageId: values.brokerageId,
        intake: {
          ...common,
          category,
          yearsOperating: Number(values.yearsOperating),
          staffCount: Number(values.staffCount),
          financials,
          ...extensions,
        },
      });
      setSaved(true);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (saved)
    return (
      <section className="platform-card">
        <h2>Private practice created</h2>
        <p role="status">
          Your intake is saved. Open its workspace to add evidence and prepare a
          teaser for human review, or keep the entire transition private.
        </p>
        <button
          onClick={() => {
            setSaved(false);
            setStep(0);
            setValues({
              country: "GB",
              transitionPurpose: "fullAcquisition",
              legalStructure: "equityTransfer",
            });
          }}
        >
          Onboard another practice
        </button>
      </section>
    );
  return (
    <section className="platform-card">
      <h2>Onboard a practice</h2>
      <p>
        Private intake for a considered ownership transition. You control
        whether a public teaser is prepared.
      </p>
      <ol className="platform-wizard" aria-label="Onboarding progress">
        {steps.map((s, i) => (
          <li aria-current={step === i ? "step" : undefined} key={s}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <form onSubmit={submit}>
        <h3>{steps[step]}</h3>
        <div className="platform-fields">
          {step === 0 && (
            <>
              <label>
                Category
                <select
                  aria-label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="dental">Dental</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="specialistMedical">Specialist medical</option>
                </select>
              </label>
              {select(
                "brokerageId",
                "Brokerage",
                brokerages.map((b) => [b._id, b.name]),
              )}
              {input("legalName", "Private legal name")}
              {input("displayName", "Private display name")}
              {input("country", "Country code", "text", {
                minLength: 2,
                maxLength: 2,
              })}
              {input("region", "Region")}
              {input("address", "Private address")}
              {input("ownershipStructure", "Ownership structure")}
            </>
          )}
          {step === 1 && (
            <>
              {input("yearsOperating", "Years operating", "number", {
                min: 0,
                max: 250,
              })}
              {input("staffCount", "Aggregate staff count", "number", {
                min: 0,
              })}
              {input("facility", "Facility details")}
              {input("equipment", "Equipment summary")}
              {category === "veterinary" ? (
                <>
                  {input("species", "Species categories (comma separated)")}
                  {input("services", "Services (comma separated)")}
                </>
              ) : (
                input("specialty", "Specialty")
              )}
              {category === "dental" &&
                input("operatories", "Chairs / operatories", "number", {
                  min: 1,
                })}
              {category === "specialistMedical" && (
                <>
                  {input("consultationFacilities", "Consultation facilities")}
                  {input("procedureFacilities", "Procedure facilities")}
                </>
              )}
            </>
          )}
        </div>
        {step === 2 && (
          <>
            <p>
              Provide aggregate business figures only. Asking prices are not
              appraisals; valuation is a separate human review.
            </p>
            {periods.map((p, i) => (
              <div className="platform-fields platform-inset" key={i}>
                <label>
                  Financial period {i + 1}
                  <input
                    value={p.period}
                    required
                    placeholder="Year ending December 2025"
                    onChange={(e) => updatePeriod(i, "period", e.target.value)}
                  />
                </label>
                <label>
                  Currency {i + 1}
                  <input
                    value={p.currency}
                    required
                    pattern="[A-Z]{3}"
                    minLength={3}
                    maxLength={3}
                    onChange={(e) =>
                      updatePeriod(i, "currency", e.target.value.toUpperCase())
                    }
                  />
                </label>
                <label>
                  Revenue {i + 1}
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={p.revenue}
                    required
                    onChange={(e) => updatePeriod(i, "revenue", e.target.value)}
                  />
                </label>
                <label>
                  Expenses {i + 1}
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={p.expenses}
                    required
                    onChange={(e) =>
                      updatePeriod(i, "expenses", e.target.value)
                    }
                  />
                </label>
                {periods.length > 1 && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setPeriods(periods.filter((_, n) => n !== i))
                    }
                  >
                    Remove period {i + 1}
                  </button>
                )}
              </div>
            ))}
            {periods.length < 10 && (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setPeriods([
                    ...periods,
                    {
                      period: "",
                      currency: periods[0].currency,
                      revenue: "",
                      expenses: "",
                    },
                  ])
                }
              >
                Add financial period
              </button>
            )}
          </>
        )}
        {step === 3 && (
          <div className="platform-fields">
            {select("transitionPurpose", "Transition purpose", [
              ["fullAcquisition", "Full practice acquisition"],
              ["partialBuyout", "Partial ownership buyout"],
              ["partnerRetirement", "Partner retirement"],
              ["succession", "Ownership succession"],
            ])}
            {select("legalStructure", "Legal structure", [
              ["equityTransfer", "Equity transfer"],
              ["assetTransfer", "Asset transfer"],
              ["otherReviewed", "Other — requires reviewed closing policy"],
            ])}
            {input("transitionReason", "Transition reason")}
            {input("timeline", "Desired timeline")}
            <p>
              Private identity and raw financials stay out of public discovery.
              Partner retirement can proceed without a public listing or an
              external buyer.
            </p>
          </div>
        )}
        <div className="platform-toolbar">
          {step > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              Previous step
            </button>
          )}
          <button disabled={busy}>
            {busy
              ? "Saving…"
              : step === 3
                ? "Create private practice"
                : "Continue"}
          </button>
        </div>
        {error && (
          <p role="alert" className="platform-error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
