"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  HeartPulse,
  ShieldCheck,
  FileCheck2,
  Handshake,
} from "lucide-react";
type Api = (path: string, method?: string, body?: any) => Promise<any>;
export default function AuthPanel({
  api,
  onSignedIn,
  initialCapacity,
}: {
  api: Api;
  onSignedIn: (result: any) => Promise<void>;
  initialCapacity?: "buyer" | "seller" | null;
}) {
  const [mode, setMode] = useState(initialCapacity ? "register" : "login");
  const [capacity, setCapacity] = useState<"buyer" | "seller" | null>(initialCapacity || null);
  const [config, setConfig] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  async function configure() {
    try {
      setConfig(await api("/auth/config"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    configure();
  }, []);
  const simple = config?.mode === "developmentSimple";
  const heading =
    mode === "register"
      ? "Create your account"
      : mode === "recovery"
        ? "Reset your password"
        : mode === "verify"
          ? "Verify your email"
          : mode === "reset"
            ? "Choose a new password"
            : "Sign in";
  const switchMode = (value: string) => {
    setMode(value);
    setError("");
    setMessage("");
    setNeedsCode(false);
  };
  return (
    <div className="platform-auth-layout">
      <div className="platform-auth-intro">
        <div className="platform-auth-emblem">
          <HeartPulse size={34} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <span className="platform-auth-eyebrow">YOUR NEXT CHAPTER</span>
        <h2>
          Practice transitions,
          <br />
          thoughtfully managed.
        </h2>
        <p>
          One private workspace for owners, buyers and the people guiding the
          transition.
        </p>
        <ul>
          <li>
            <ShieldCheck size={19} aria-hidden="true" />
            <span>
              Clear permissions.
              <small>Share information with the right people.</small>
            </span>
          </li>
          <li>
            <FileCheck2 size={19} aria-hidden="true" />
            <span>
              Every step, organized.
              <small>Keep documents, diligence and tasks together.</small>
            </span>
          </li>
          <li>
            <Handshake size={19} aria-hidden="true" />
            <span>
              Human guidance.
              <small>Move forward with your assigned broker.</small>
            </span>
          </li>
        </ul>
        <div className="platform-auth-categories">
          Dental <span>·</span> Veterinary <span>·</span> Specialist medical
        </div>
      </div>
      <section className="platform-auth platform-auth-simple" aria-labelledby="auth-heading">
        <div className="platform-auth-icon">
          <LockKeyhole size={23} aria-hidden="true" />
        </div>
        <h2 id="auth-heading">{mode === "register" ? "Create your account" : "Sign in"}</h2>
        <p className="platform-muted">
          {mode === "register"
            ? "Pick buyer or seller, then use your email and password."
            : "Use your email and password to open your workspace."}
        </p>
        <div className="platform-auth-tabs" aria-label="Authentication options">
          <button
            type="button"
            className={mode === "login" ? "active" : "secondary"}
            aria-pressed={mode === "login"}
            onClick={() => switchMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : "secondary"}
            aria-pressed={mode === "register"}
            onClick={() => switchMode("register")}
          >
            Create account
          </button>
        </div>
        {simple && (
          <p className="platform-auth-hint">
            Local demo: use email and password. Email verification and MFA are
            deferred for now.
          </p>
        )}
        {mode === "register" && (
          <div className="platform-role-choice" role="group" aria-label="Choose your account type">
            <p className="platform-role-prompt">I want to...</p>
            <button type="button" className={capacity === "seller" ? "platform-role-card selected" : "platform-role-card"} aria-pressed={capacity === "seller"} onClick={() => setCapacity("seller")}>
              <strong>Sell or transition a practice</strong>
              <span>I own a practice or represent its owners.</span>
            </button>
            <button type="button" className={capacity === "buyer" ? "platform-role-card selected" : "platform-role-card"} aria-pressed={capacity === "buyer"} onClick={() => setCapacity("buyer")}>
              <strong>Buy a practice</strong>
              <span>I am exploring practices to acquire.</span>
            </button>
          </div>
        )}
        {!config ? (
          <>
            {error ? (
              <p role="alert" className="platform-error">
                {error}
              </p>
            ) : (
              <p role="status">Loading sign-in…</p>
            )}
            <button className="secondary" onClick={configure}>
              Retry connection
            </button>
          </>
        ) : (
          <form
            key={mode}
            className="platform-auth-fields"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              setMessage("");
              const data = new FormData(e.currentTarget);
              try {
                const body: any = {};
                if (["login", "register", "recovery"].includes(mode))
                  body.email = String(data.get("email")).trim();
                if (["login", "register", "reset"].includes(mode))
                  body.password = data.get("password");
                if (mode === "register") {
                  body.name = data.get("name");
                  body.capacity = capacity;
                }
                if (mode === "login" && needsCode) body.code = data.get("code");
                if (["verify", "reset"].includes(mode))
                  body.token = data.get("token");
                const result = await api(`/auth/${mode}`, "POST", body);
                if (result.user && result.csrf) await onSignedIn(result);
                else setMessage(result.message || "Request completed.");
              } catch (e) {
                const text = (e as Error).message;
                setError(text);
                if (mode === "login" && /MFA code/i.test(text))
                  setNeedsCode(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3>{heading}</h3>
            {mode === "register" && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
            )}
            {["login", "register", "recovery"].includes(mode) && (
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete={mode === "login" ? "username" : "email"}
                  required
                />
              </label>
            )}
            {["verify", "reset"].includes(mode) && (
              <label>
                Email token
                <input name="token" required minLength={64} maxLength={64} />
              </label>
            )}
            {["login", "register", "reset"].includes(mode) && (
              <label>
                Password
                <div className="platform-password-input">
                  <input
                    name="password"
                    aria-label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    minLength={mode === "login" ? 1 : config.passwordMinimum}
                    maxLength={128}
                    required
                    aria-describedby={
                      mode !== "login" ? "password-help" : undefined
                    }
                  />
                  <button
                    type="button"
                    className="secondary"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode !== "login" && (
                  <small id="password-help">
                    At least {config.passwordMinimum} characters.
                  </small>
                )}
              </label>
            )}
            {needsCode && !simple && mode === "login" && (
              <label>
                Authenticator code
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  required
                />
              </label>
            )}
            {error && (
              <p role="alert" className="platform-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="platform-notice">
                {message}
              </p>
            )}
            <button className="platform-auth-submit" disabled={busy || (mode === "register" && !capacity)}>
              {busy
                ? "Please wait…"
                : mode === "register"
                  ? "Create account"
                  : mode === "recovery"
                    ? "Send reset instructions"
                    : heading}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            {mode === "login" && (
              <button
                type="button"
                className="platform-auth-link"
                onClick={() => switchMode("recovery")}
              >
                Forgot password?
              </button>
            )}
            {(!simple || mode === "recovery") && (
              <details className="platform-auth-help">
                <summary>Email verification and reset help</summary>
                <p>Development emails are stored in the local outbox.</p>
                {!simple && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => switchMode("verify")}
                  >
                    Enter verification token
                  </button>
                )}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => switchMode("reset")}
                >
                  Enter reset token
                </button>
              </details>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
