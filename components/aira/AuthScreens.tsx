"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AiraMark } from "@/components/aira/AiraMark";
import { Chip } from "@/components/aira/Chip";
import { subjects } from "@/lib/aira/content";
import { PROFILE_KEY, writeJson, type LocalProfile } from "@/lib/aira/storage";

export function LoginScreen({ showTestLogin = false }: { showTestLogin?: boolean }) {
  const canShowTestLogin = showTestLogin && process.env.NODE_ENV !== "production";

  return (
    <main className="auth-page web-auth-page">
      <section className="auth-hero-panel">
        <Link href="/" className="brand-lockup">
          <AiraMark size={34} />
          <span>Aira</span>
        </Link>
        <Chip tone="saffron">Free for students</Chip>
        <h1>Sign in once. Keep every doubt, source, and saved answer together.</h1>
        <p>
          Sign in with Google to keep your subjects, saved explanations, and
          revision progress synced across your devices.
        </p>
        <div className="auth-points">
          <span><CheckCircle2 size={17} /> Citation-backed answers</span>
          <span><CheckCircle2 size={17} /> Saved answers across devices</span>
          <span><CheckCircle2 size={17} /> English support in this beta</span>
        </div>
      </section>

      <section className="auth-card">
        <div>
          <div className="section-kicker">Welcome</div>
          <h1>Continue to Aira</h1>
          <p>Use your student Google account to continue and save your learning setup.</p>
        </div>
        <a href="/api/auth/google" className="google-button">
          <span>G</span> Continue with Google
        </a>
        {canShowTestLogin ? (
          <a href="/api/auth/test?next=/onboarding" className="test-login-button">
            Continue as test@test.com
          </a>
        ) : null}
        <small>
          By continuing, you agree to Aira&apos;s <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>. No card needed.
        </small>
      </section>
    </main>
  );
}

export function OnboardingScreen() {
  const [selected, setSelected] = useState(["physics", "chemistry", "mathematics"]);
  const [language] = useState<LocalProfile["preferred_language"]>("en");
  const selectedLabels = useMemo(
    () => subjects.filter((subject) => selected.includes(subject.id)).map((subject) => subject.label),
    [selected]
  );

  const toggleSubject = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((subject) => subject !== id) : [...current, id]
    );
  };

  const continueToApp = async () => {
    const profile = { subjects: selected, preferred_language: language };
    writeJson(PROFILE_KEY, profile);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => undefined);
    window.location.href = "/chat";
  };

  return (
    <main className="onboarding-page web-onboarding-page">
      <section className="onboarding-card">
        <div className="onboarding-main">
          <div className="progress-row">
            <Link href="/login">‹</Link>
            <span className="progress-bar"><i /></span>
            <span>Setup</span>
          </div>
          <div className="section-kicker">Choose your study setup</div>
          <h1>Choose the subjects you are preparing right now.</h1>
          <p>
            Aira will use these to shape your daily practice, revision prompts,
            and doubt-solving flow. You can update this anytime.
          </p>
          <div className="subject-grid">
            {subjects.map((subject) => (
              <button
                className={selected.includes(subject.id) ? "selected" : ""}
                key={subject.id}
                onClick={() => toggleSubject(subject.id)}
                type="button"
              >
                <span style={{ color: subject.color }}>■</span>
                <strong>{subject.label}</strong>
                <small>{subject.count}</small>
                <input
                  aria-label={`${subject.label} selected`}
                  checked={selected.includes(subject.id)}
                  readOnly
                  tabIndex={-1}
                  type="radio"
                />
              </button>
            ))}
          </div>
        </div>

        <aside className="onboarding-side">
          <div>
            <label>Explanations in</label>
            <div className="segmented">
              <button className={language === "en" ? "active" : ""} type="button">English (Beta)</button>
            </div>
          </div>
          <div className="setup-summary">
            <div className="section-kicker">Current setup</div>
            <strong>{selected.length} subjects selected</strong>
            <p>{selectedLabels.join(", ") || "Pick at least one subject"} will appear first in the app workspace.</p>
          </div>
          <div className="bottom-bar">
            <span>{selected.length} selected</span>
            <button className="primary-button" onClick={continueToApp} disabled={!selected.length}>
              Continue <ArrowRight size={17} />
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
