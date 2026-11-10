import Link from "next/link";

const label = (value?: string) =>
  String(value || "").replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());

export default async function Opportunity({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let teaser: any;
  try {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new Error("Invalid listing");
    const response = await fetch(
      `${process.env.API_ORIGIN || "http://127.0.0.1:4000"}/api/v1/listings/${id}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("Unavailable listing");
    teaser = (await response.json()).data;
  } catch {
    return (
      <div className="platform">
        <main>
          <h1>This listing is not available</h1>
          <p>It may be paused, withdrawn, or temporarily offline.</p>
          <Link className="platform-link" href="/">
            Back to practices
          </Link>
        </main>
      </div>
    );
  }
  return (
    <div className="platform">
      <main>
        <header>
          <div>
            <small>Anonymous listing</small>
            <h1>{teaser.headline}</h1>
          </div>
          <Link className="platform-link" href="/?screen=signin">
            Sign in to respond
          </Link>
        </header>
        <p className="platform-goal">
          {teaser.summary} This page hides the clinic name, address, owners, and finances.
        </p>
        <section className="platform-card">
          <p className="platform-location">
            {teaser.region}, {teaser.country}
          </p>
          <p>
            <span className="platform-badge">{label(teaser.category)}</span>{" "}
            <span className="platform-badge">{label(teaser.transitionPurpose)}</span>
          </p>
          <h2>What happens next</h2>
          <ol className="platform-steps">
            <li>
              <strong>Sign in as a buyer</strong>
              <span>Create an account or use the one you already have.</span>
            </li>
            <li>
              <strong>Send a short note</strong>
              <span>Tell the broker why this practice fits you.</span>
            </li>
            <li>
              <strong>Wait for a person</strong>
              <span>Private files open only after the broker approves you.</span>
            </li>
          </ol>
          <Link className="platform-link" href="/?screen=signin">
            Sign in and express interest
          </Link>
        </section>
        <p>
          <Link href="/">Back to all practices</Link>
        </p>
      </main>
    </div>
  );
}
