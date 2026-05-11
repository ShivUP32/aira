import Link from "next/link";
import { ArrowRight, Bookmark, CheckCircle2, Search, Send } from "lucide-react";
import { AiraMark } from "@/components/aira/AiraMark";
import { Chip } from "@/components/aira/Chip";
import { InstallButton } from "@/components/aira/InstallButton";
import { modeHighlights, modes, subjects } from "@/lib/aira/content";

export function LandingPage() {
  return (
    <main className="site-shell">
      <nav className="landing-nav">
        <Link href="/" className="brand-lockup">
          <AiraMark size={30} />
          <span>Aira</span>
        </Link>
        <div className="nav-actions">
          <a href="#modes">Modes</a>
          <a href="#sources">Sources</a>
          <Link href="/saved">Saved</Link>
          <Link href="/chat">Try app</Link>
          <Link href="/login" className="small-button">Log in</Link>
        </div>
      </nav>

      <section className="web-hero">
        <div className="hero-copy">
          <Chip tone="saffron">Built on 2025 CBSE board papers</Chip>
          <h1>
            Board-exam answers that show <em>where the marks come from.</em>
          </h1>
          <p>
            Aira helps Class 12 students solve doubts, practise questions,
            revise chapters, and learn concepts with visible source citations.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="primary-button">
              Start free <ArrowRight size={18} />
            </Link>
            <Link href="/chat" className="secondary-button">
              Explore demo
            </Link>
            <InstallButton />
          </div>
          <div className="hero-subtext">No card · English + हिन्दी · Works as a PWA</div>
        </div>

        <div className="web-app-preview" aria-label="Aira app preview">
          <div className="preview-topbar">
            <div className="brand-lockup small">
              <AiraMark size={24} />
              <span>Aira</span>
            </div>
            <div className="preview-search">
              <Search size={16} />
              Ask about Physics, Math, Chemistry...
            </div>
            <Link href="/chat" className="tiny-pill">Open app</Link>
          </div>
          <div className="preview-grid">
            <aside className="preview-sidebar">
              <div className="section-kicker">Modes</div>
              {modes.map((mode, index) => {
                const Icon = mode.icon;
                return (
                  <div className={`preview-nav-item ${index === 0 ? "active" : ""}`} key={mode.id}>
                    <Icon size={16} />
                    <span>{mode.label}</span>
                  </div>
                );
              })}
              <div className="section-kicker">Subjects</div>
              {subjects.slice(0, 4).map((subject) => (
                <div className="preview-nav-item" key={subject.id}>
                  <span style={{ color: subject.color }}>■</span>
                  <span>{subject.label}</span>
                </div>
              ))}
            </aside>
            <section className="preview-chat">
              <div className="message user">Why does a copper ring slow down in a magnetic field?</div>
              <article className="preview-answer">
                <div className="answer-head">
                  <AiraMark size={24} />
                  <strong>Answer in marking-scheme points</strong>
                </div>
                <p>
                  The changing magnetic flux induces a current. By Lenz&apos;s
                  law, that current opposes the change, so the magnetic force
                  acts opposite to the ring&apos;s motion.
                </p>
                <div className="formula-box">epsilon = -dPhi/dt ⇒ F = BIL</div>
                <div className="chip-row">
                  <Chip tone="source">CBSE 2025 Physics · Set-1 · Q12 · 5m</Chip>
                  <Chip tone="success"><CheckCircle2 size={14} /> Marking scheme</Chip>
                </div>
              </article>
              <Link href="/chat" className="preview-input">
                <span>Ask a doubt or paste a board question...</span>
                <span className="preview-send"><Send size={16} /></span>
              </Link>
            </section>
          </div>
        </div>
      </section>

      <section className="website-section" id="modes">
        <div className="section-heading">
          <div className="section-kicker">Study modes</div>
          <h2>One product, four ways to study.</h2>
          <p>Each mode changes the workspace instead of forcing every task into a chat bubble.</p>
        </div>
        <div className="feature-grid large">
          {modeHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <Link href="/chat" className="feature-card" key={item.title}>
                <Icon size={20} />
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="website-section split" id="sources">
        <div className="section-heading">
          <div className="section-kicker">Citations</div>
          <h2>Answers stay attached to the paper.</h2>
          <p>
            Source chips open the original question, solution source, marks,
            and marking-scheme breakdown, so students can see what to write.
          </p>
          <div className="chip-row">
            <Chip tone="source">CBSE 2025 Physics · Set-1 · Q12 · 5m</Chip>
            <Chip tone="success">Official marking scheme</Chip>
          </div>
        </div>
        <div className="source-card">
          <div className="section-kicker">Marking scheme · 5 marks</div>
          <div className="scheme-row"><span>01</span><div><strong>State Lenz&apos;s law</strong><p>Induced current opposes the change in flux producing it.</p></div></div>
          <div className="scheme-row"><span>02</span><div><strong>Direction analysis</strong><p>On entry it opposes the external field; on exit it aids it.</p></div></div>
          <div className="scheme-row"><span>03</span><div><strong>Derivation</strong><p>Phi = BA, so epsilon = -dPhi/dt = -BLv.</p></div></div>
        </div>
      </section>

      <section className="website-section cta-section">
        <Bookmark size={24} />
        <h2>Start studying with sources attached.</h2>
        <p>Aira is built for Supabase auth, OpenRouter answers, RAG retrieval, and local-first saved answers.</p>
        <div className="hero-actions">
          <Link href="/chat" className="primary-button">Open Aira</Link>
          <Link href="/onboarding" className="secondary-button">Set up subjects</Link>
        </div>
      </section>
    </main>
  );
}
