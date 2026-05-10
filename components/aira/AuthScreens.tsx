import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AiraMark } from "@/components/aira/AiraMark";
import { Chip } from "@/components/aira/Chip";
import { subjects } from "@/lib/aira/content";

export function LoginScreen() {
  return (
    <main className="auth-page">
      <section className="auth-card aira-jali">
        <AiraMark size={48} />
        <h1>The Class 12 board exam buddy that gets you <em>extra marks.</em></h1>
        <p>Doubts answered with citations to the real paper. Practice scored against the real marking scheme. हिन्दी + English.</p>
        <Chip tone="saffron">Built on the 2025 CBSE Board papers</Chip>
        <Link href="/onboarding" className="google-button">
          <span>G</span> Continue with Google
        </Link>
        <small>
          By continuing, you agree to Aira&apos;s <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>. Free, forever. No card needed.
        </small>
      </section>
    </main>
  );
}

export function OnboardingScreen() {
  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <div className="progress-row">
          <Link href="/login">‹</Link>
          <span className="progress-bar"><i /></span>
          <span>2/3</span>
        </div>
        <div className="section-kicker">Pick your subjects</div>
        <h1>What are <em>you</em> tackling?</h1>
        <p>We&apos;ll prioritise these in the sidebar. Change anytime.</p>
        <div className="subject-grid">
          {subjects.map((subject, index) => (
            <button className={index < 3 ? "selected" : ""} key={subject.id}>
              <span style={{ color: subject.color }}>■</span>
              <strong>{subject.label}</strong>
              <small>{subject.count}</small>
              <i>{index < 3 ? "✓" : ""}</i>
            </button>
          ))}
        </div>
        <label>Explanations in</label>
        <div className="segmented">
          <button className="active">English</button>
          <button>हिन्दी</button>
          <button>Both</button>
        </div>
        <div className="bottom-bar">
          <span>3 selected</span>
          <Link href="/chat" className="primary-button">
            Continue <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
