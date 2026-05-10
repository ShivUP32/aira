import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { AiraMark } from "@/components/aira/AiraMark";
import { Chip } from "@/components/aira/Chip";
import { PhoneFrame } from "@/components/aira/PhoneFrame";
import { modeHighlights, modes, subjects } from "@/lib/aira/content";

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--aira-canvas)]">
      <section className="hero-grid">
        <nav className="landing-nav">
          <Link href="/" className="brand-lockup">
            <AiraMark size={30} />
            <span>Aira</span>
          </Link>
          <div className="nav-actions">
            <Link href="/saved">Saved</Link>
            <Link href="/chat">Try app</Link>
            <Link href="/login" className="small-button">
              Log in
            </Link>
          </div>
        </nav>

        <div className="hero-copy">
          <Chip tone="saffron">Built on the 2025 CBSE Board papers</Chip>
          <h1>
            The Class 12 board exam buddy that gets you{" "}
            <em>extra marks.</em>
          </h1>
          <p>
            Doubts answered with citations to the real paper. Practice scored
            against the real marking scheme. Free, forever.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="primary-button">
              Continue with Google <ArrowRight size={18} />
            </Link>
            <Link href="/chat" className="secondary-button">
              Open demo
            </Link>
          </div>
          <div className="hero-subtext">One-tap sign-in · No card · हिन्दी + English</div>
        </div>

        <div className="hero-phone-wrap">
          <PhoneFrame>
            <div className="mobile-landing-preview">
              <div className="mobile-top-row">
                <div className="brand-lockup small">
                  <AiraMark size={25} />
                  <span>Aira</span>
                </div>
                <Link href="/login" className="tiny-pill">
                  Log in
                </Link>
              </div>
              <Chip tone="saffron">Built on the 2025 CBSE Board papers</Chip>
              <h2>
                The Class 12 board exam buddy that gets you <em>extra marks.</em>
              </h2>
              <p>Doubts answered with citations to the real paper. Practice scored against the real marking scheme.</p>
              <Link href="/login" className="primary-button full">
                Continue with Google
              </Link>
              <div className="section-kicker">Four modes</div>
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Link href="/chat" className="mode-row" key={mode.id}>
                    <span className="mode-icon"><Icon size={17} /></span>
                    <span>
                      <strong>{mode.label}</strong>
                      <small>{mode.description}</small>
                    </span>
                    <ChevronRight size={17} />
                  </Link>
                );
              })}
            </div>
          </PhoneFrame>
        </div>
      </section>

      <section className="foundation-panel" id="design">
        <div>
          <AiraMark size={38} />
          <h2>Aira <em>Warm Studious</em></h2>
          <p>
            Editorial serif for explanations, quiet UI chrome for repeated
            study, saffron confidence markers, and indigo as the single action
            color.
          </p>
        </div>
        <div className="foundation-grid">
          <div>
            <div className="section-kicker">Modes</div>
            <div className="chip-row">
              {modes.map((mode, index) => (
                <Chip key={mode.id} active={index === 0}>{mode.short}</Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="section-kicker">Subjects</div>
            <div className="chip-row">
              {subjects.map((subject) => (
                <Chip key={subject.id}>
                  <span style={{ color: subject.color }}>■</span> {subject.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="section-kicker">What ships first</div>
            <div className="feature-grid">
              {modeHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="feature-card" key={item.title}>
                    <Icon size={18} />
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
