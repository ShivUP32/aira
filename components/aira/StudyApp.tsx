"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Image,
  Menu,
  Mic,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { AiraMark } from "@/components/aira/AiraMark";
import { Chip } from "@/components/aira/Chip";
import {
  formulaRows,
  modes,
  revisionPack,
  sampleCitation,
  savedItems,
  starterMessages,
  subjects,
} from "@/lib/aira/content";

type ModeId = "doubt" | "learning" | "practice" | "revision";

export function StudyApp({ initialMode = "doubt" }: { initialMode?: ModeId }) {
  const [mode, setMode] = useState<ModeId>(initialMode);
  const [showCitation, setShowCitation] = useState(false);

  return (
    <main className="study-shell">
      <aside className="study-sidebar">
        <Link href="/" className="brand-lockup">
          <AiraMark size={30} />
          <span>Aira</span>
        </Link>
        <Link href="/chat" className="new-chat">Ask a doubt</Link>
        <div className="section-kicker">Subjects</div>
        <div className="sidebar-list">
          {subjects.slice(0, 4).map((subject) => (
            <button key={subject.id}>
              <span style={{ color: subject.color }}>■</span>
              {subject.label}
            </button>
          ))}
        </div>
        <div className="section-kicker">Recent</div>
        <div className="conversation-list">
          <button>Lenz&apos;s law direction trick</button>
          <button>Continuity & differentiability</button>
          <button>Bohr&apos;s atomic model</button>
        </div>
        <Link href="/saved" className="saved-link">
          <Bookmark size={16} /> Saved answers
        </Link>
      </aside>

      <section className="study-main">
        <header className="app-header">
          <button className="icon-button"><Menu size={20} /></button>
          <div>
            <h1>{headerTitle(mode)}</h1>
            <p>• {mode === "practice" ? "Mathematics" : "Physics"}</p>
          </div>
          <Link href="/saved" className="icon-button"><Bookmark size={20} /></Link>
        </header>
        <ModeTabs mode={mode} setMode={setMode} />
        <div className="app-scroll">
          {mode === "doubt" ? <DoubtView onCitation={() => setShowCitation(true)} /> : null}
          {mode === "practice" ? <PracticeView /> : null}
          {mode === "revision" ? <RevisionView /> : null}
          {mode === "learning" ? <LearningView /> : null}
        </div>
        {mode === "doubt" ? <ChatInput /> : null}
      </section>

      <aside className="source-panel">
        <CitationDetail compact={false} />
      </aside>

      {showCitation ? (
        <div className="modal-backdrop" onClick={() => setShowCitation(false)}>
          <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCitation(false)}><X size={18} /></button>
            <CitationDetail compact />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export function SavedScreen() {
  const [items, setItems] = useState(savedItems);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("aira:saved:demo-user");
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      window.localStorage.setItem("aira:saved:demo-user", JSON.stringify(savedItems));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("aira:saved:demo-user", JSON.stringify(items));
    }
  }, [hydrated, items]);

  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));

  return (
    <main className="saved-page">
      <section className="saved-phone">
        <header className="saved-header">
          <Link href="/chat">‹</Link>
          <div>
            <h1>Saved</h1>
            <p>• {items.length} items · synced just now</p>
          </div>
          <button className="icon-button"><Search size={18} /></button>
        </header>
        <div className="filter-strip">
          <Chip active>All · {items.length}</Chip>
          <Chip>Physics · 6</Chip>
          <Chip>Math · 4</Chip>
          <Chip>Chem · 2</Chip>
          <Chip>CS · 1</Chip>
        </div>
        <div className="sync-rail">
          <span>●</span> 1 new save synced from cloud <code>cached · 13 local</code>
        </div>
        <div className="saved-list">
          {items.map((item, index) => (
            <article className={`saved-item ${index === 0 ? "expanded" : ""}`} key={item.id}>
              <div className="saved-title">
                <span className={`subject-dot ${item.subject.toLowerCase()}`} />
                <strong>{item.title}</strong>
                <ChevronDown size={16} />
              </div>
              <p className="saved-meta">{item.time} · {item.subject} {item.synced ? "· just synced" : ""}</p>
              {index === 0 ? (
                <div className="saved-answer-card">
                  <small>Aira&apos;s answer</small>
                  <p>{item.answer}</p>
                  <div className="formula-box">{item.formula}</div>
                  <Chip tone="source">{item.source}</Chip>
                  <Chip>AI-generated derivation</Chip>
                  <div className="saved-actions">
                    <Link href="/chat">Open in chat</Link>
                    <button>Saved</button>
                    <button onClick={() => remove(item.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ModeTabs({ mode, setMode }: { mode: ModeId; setMode: (mode: ModeId) => void }) {
  return (
    <div className="mode-tabs">
      {modes.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={mode === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setMode(item.id as ModeId)}
          >
            <Icon size={15} /> {item.short}
          </button>
        );
      })}
    </div>
  );
}

function DoubtView({ onCitation }: { onCitation: () => void }) {
  return (
    <div className="chat-stack">
      <div className="message user">{starterMessages[0].text}</div>
      <article className="message aira">
        <AiraMark size={24} />
        <div>
          {(starterMessages[1].text as string[]).map((line) => (
            <p key={line}>{line}</p>
          ))}
          <div className="formula-box">epsilon = - dPhi/dt ⇒ F = BIL</div>
          <button className="citation-button" onClick={onCitation}>
            <Chip tone="source">{sampleCitation.label}</Chip>
          </button>
          <div className="answer-tools">
            <button><Bookmark size={15} /> Save</button>
            <button><Check size={15} /></button>
            <button><X size={15} /></button>
          </div>
        </div>
      </article>
      <div className="prompt-pills">
        <button>Show me a related Q</button>
        <button>Switch to Practice</button>
        <button>हिन्दी में समझाइए</button>
      </div>
    </div>
  );
}

function PracticeView() {
  return (
    <div className="mode-page">
      <div className="progress-segments">
        {Array.from({ length: 12 }).map((_, index) => <span className={index < 4 ? "done" : ""} key={index} />)}
      </div>
      <div className="section-kicker">CBSE 2025 · Math · Set-1 · Section C · Q19</div>
      <h2>If y = (sin x)<sup>x</sup>, find dy/dx.</h2>
      <p>Show all steps. 1m for log-diff setup, 1m for differentiation, 1m for the final form.</p>
      <div className="working-box">
        <div className="section-kicker">Your working</div>
        <p>Let y = (sin x)<sup>x</sup>. Taking log:</p>
        <p>log y = x · log(sin x)</p>
        <p>Differentiating:</p>
        <p>(1/y)(dy/dx) = log(sin x) + x cot x <span className="aira-cursor" /></p>
      </div>
      <div className="symbol-row">
        {["π", "∫", "√", "x²", "x/y", "∞", "≠"].map((symbol) => <button key={symbol}>{symbol}</button>)}
      </div>
      <div className="bottom-bar inline">
        <button className="secondary-button">Reveal solution</button>
        <button className="primary-button">Submit answer</button>
      </div>
    </div>
  );
}

function RevisionView() {
  return (
    <div className="mode-page">
      <div className="section-kicker">Revision · Physics</div>
      <h2>Electromagnetic Induction</h2>
      <div className="revision-list">
        {revisionPack.map(([title, text], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="section-kicker">Formulas</div>
      <div className="formula-table">
        {formulaRows.map(([name, formula]) => (
          <div key={name}><span>{name}</span><strong>{formula}</strong></div>
        ))}
      </div>
      <div className="quick-quiz">
        <span>1</span>
        <p>What does Lenz&apos;s law tell us about direction?</p>
        <input placeholder="Type your answer..." />
      </div>
      <button className="primary-button full">Submit & score me</button>
    </div>
  );
}

function LearningView() {
  return (
    <div className="mode-page learning">
      <div className="progress-segments three"><span className="done" /><span /><span /></div>
      <h2>The intuition before the math</h2>
      <p>
        Bohr fixed a problem nobody else could explain: why don&apos;t electrons
        spiral into the nucleus? Classical physics said they <em>should</em>,
        but hydrogen atoms are stable.
      </p>
      <div className="lesson-card">
        <div className="section-kicker">The three postulates</div>
        <p><em>i.</em> Electrons orbit only at certain allowed radii.</p>
        <p><em>ii.</em> Angular momentum is quantised: mvr = nh/2π.</p>
        <p><em>iii.</em> Energy is emitted only on jumps: hv = E₂ - E₁.</p>
      </div>
      <div className="quick-check">
        <div className="section-kicker">Quick check</div>
        <p>In your own words: why doesn&apos;t the electron radiate while in an allowed orbit?</p>
        <input placeholder="Type 1-2 sentences..." />
        <button className="primary-button full">Check <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

function CitationDetail({ compact }: { compact: boolean }) {
  return (
    <article className={`citation-detail ${compact ? "compact" : ""}`}>
      <div className="source-topline">
        <span>Source · 2025 Physics · 55/1/1</span>
        <Chip tone="success">Official</Chip>
      </div>
      <h2>{sampleCitation.source}</h2>
      <Chip tone="saffron">Long answer · 5 marks</Chip>
      <p className="source-question">{sampleCitation.question}</p>
      <div className="marking-scheme">
        <div className="section-kicker">Marking scheme · 5 marks</div>
        {sampleCitation.scheme.map(([title, detail, mark], index) => (
          <div className="scheme-row" key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{title} <i>{mark}</i></strong>
              <p>{detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bottom-bar inline">
        <button className="secondary-button"><Bookmark size={16} /> Save</button>
        <button className="primary-button">Practice this</button>
      </div>
    </article>
  );
}

function ChatInput() {
  const [value, setValue] = useState("");
  const canSend = useMemo(() => value.trim().length > 0, [value]);

  return (
    <div className="chat-input-bar">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask a doubt..."
      />
      <button className="icon-button"><Image size={18} /></button>
      <button className="icon-button"><Mic size={18} /></button>
      <button className="send-button" disabled={!canSend}><Send size={18} /></button>
    </div>
  );
}

function headerTitle(mode: ModeId) {
  if (mode === "practice") return "Continuity & Differentiability";
  if (mode === "revision") return "Electromagnetic Induction";
  if (mode === "learning") return "Bohr's atomic model";
  return "Lenz's law direction trick";
}
