"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Image as ImageIcon,
  LogOut,
  Menu,
  Mic,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { AiraMark } from "@/components/aira/AiraMark";
import { Chip } from "@/components/aira/Chip";
import { InstallButton } from "@/components/aira/InstallButton";
import {
  formulaRows,
  modes,
  revisionPack,
  savedItems,
  starterMessages,
  subjects,
} from "@/lib/aira/content";
import { AiraCitation, demoAnswer, retrieveSeedDocs } from "@/lib/aira/demo-data";
import {
  CONVERSATIONS_KEY,
  LocalProfile,
  LocalSavedItem,
  PROFILE_KEY,
  readJson,
  SAVED_KEY,
  writeJson,
} from "@/lib/aira/storage";

type ModeId = "doubt" | "learning" | "practice" | "revision";
type ChatMessage = {
  id: string;
  role: "user" | "aira";
  text: string;
  citations?: AiraCitation[];
};

type LocalConversation = {
  id: string;
  title: string;
  mode: ModeId;
  subject: string;
  language: LocalProfile["preferred_language"];
  messages: ChatMessage[];
  updated_at: string;
};

const defaultCitation = retrieveSeedDocs("Lenz law physics", "physics", 1)[0];
const defaultMessages = (starterMessages as { role: "user" | "aira"; text: string | string[] }[]).map((message, index) => ({
  id: `starter-${index}`,
  role: message.role,
  text: Array.isArray(message.text) ? message.text.join("\n\n") : message.text,
  citations: message.role === "aira" ? [defaultCitation] : undefined,
}));

export function StudyApp({ initialMode = "doubt" }: { initialMode?: ModeId }) {
  const [mode, setMode] = useState<ModeId>(initialMode);
  const [selectedCitation, setSelectedCitation] = useState<AiraCitation>(defaultCitation);
  const [showCitation, setShowCitation] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultMessages);
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState(() => `local-${Date.now()}`);
  const [subject, setSubject] = useState("physics");
  const [language, setLanguage] = useState<LocalProfile["preferred_language"]>("en");
  const [isSending, setIsSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState("Local preview ready");

  useEffect(() => {
    const profile = readJson<LocalProfile>(PROFILE_KEY, { subjects: ["physics", "chemistry", "mathematics"], preferred_language: "en" });
    const localSaved = readJson<LocalSavedItem[]>(SAVED_KEY, savedItems as LocalSavedItem[]).filter((item) => !item.deleted);
    const localConversations = readJson<LocalConversation[]>(CONVERSATIONS_KEY, []);
    writeJson(SAVED_KEY, localSaved);
    queueMicrotask(() => {
      setSubject(profile.subjects[0] || "physics");
      setLanguage(profile.preferred_language);
      setSavedCount(localSaved.length);
      setConversations(localConversations);
      setActiveConversationId(localConversations[0]?.id || `local-${Date.now()}`);
      setHydrated(true);
    });

    fetch("/api/conversations")
      .then((response) => response.json())
      .then((payload) => {
        const remote = (payload.conversations || []) as LocalConversation[];
        if (remote.length) {
          setConversations((current) => mergeConversations(current, remote));
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!chatMessages.length) return;
    const title = firstUserText(chatMessages) || "New study chat";
    const conversation: LocalConversation = {
      id: activeConversationId,
      title,
      mode,
      subject,
      language,
      messages: chatMessages,
      updated_at: new Date().toISOString(),
    };
    queueMicrotask(() => {
      setConversations((current) => {
        const next = mergeConversations([conversation], current.filter((item) => item.id !== activeConversationId)).slice(0, 12);
        writeJson(CONVERSATIONS_KEY, next);
        return next;
      });
    });
  }, [activeConversationId, chatMessages, hydrated, language, mode, subject]);

  const persistProfile = (next: Partial<LocalProfile>) => {
    const current = readJson<LocalProfile>(PROFILE_KEY, {
      subjects: [subject],
      preferred_language: language,
    });
    const profile: LocalProfile = {
      subjects: next.subjects || current.subjects || [subject],
      preferred_language: next.preferred_language || current.preferred_language || language,
    };
    writeJson(PROFILE_KEY, profile);
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => undefined);
  };

  const selectSubject = (id: string) => {
    setSubject(id);
    const citation = retrieveSeedDocs(id, id, 1)[0];
    if (citation) setSelectedCitation(citation);
    persistProfile({ subjects: [id] });
    setSidebarOpen(false);
  };

  const selectLanguage = (nextLanguage: LocalProfile["preferred_language"]) => {
    setLanguage(nextLanguage);
    persistProfile({ preferred_language: nextLanguage });
  };

  const openCitation = (citation?: AiraCitation) => {
    setSelectedCitation(citation || defaultCitation);
    setShowCitation(true);
  };

  const saveAnswer = async (message?: ChatMessage, citation = selectedCitation) => {
    const sourceMessage = message || [...chatMessages].reverse().find((item) => item.role === "aira");
      const documentId = Number(citation.id);
      const item: LocalSavedItem = {
      id: `sv-${Date.now()}`,
      subject: citation.subject || subject,
      title: citation.question || firstUserText(chatMessages) || "Saved Aira answer",
      time: "Just now",
      synced: false,
      answer: sourceMessage?.text || citation.answer,
      formula: citation.scheme?.[0]?.detail,
      source: citation.label,
      citationId: citation.id,
      ts: Date.now(),
    };

    const local = readJson<LocalSavedItem[]>(SAVED_KEY, savedItems as LocalSavedItem[]);
    const next = [item, ...local.filter((entry) => entry.id !== item.id && !entry.deleted)];
    writeJson(SAVED_KEY, next);
    setSavedCount(next.length);
    setStatus("Saved locally. Sync will run when services are available.");

    try {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          document_id: Number.isSafeInteger(documentId) ? documentId : undefined,
        }),
      });
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: item.title,
          answer: item.answer,
          document_id: Number.isSafeInteger(documentId) ? documentId : undefined,
          source_ids: [citation.id],
          metadata: { citation, mode, subject },
        }),
      });
      setStatus("Saved and sync queued.");
    } catch {
      setStatus("Saved locally. Server sync is unavailable in this preview.");
    }
  };

  const sendMessage = async (text: string) => {
    if (isSending) return;
    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };
    const outgoing = [...chatMessages, userMessage];
    setChatMessages(outgoing);
    setIsSending(true);
    setStatus("Aira is retrieving sources...");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: outgoing.map((message) => ({
            role: message.role === "aira" ? "assistant" : "user",
            content: message.text,
          })),
          mode,
          subject,
          language,
          conversationId: activeConversationId,
        }),
      });
      const payload = await response.json();
      const citations = ((payload.citations || []) as AiraCitation[]).length
        ? (payload.citations as AiraCitation[])
        : retrieveSeedDocs(text, subject, 3);
      const airaMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "aira",
        text: payload.answer || demoAnswer(text, mode, citations),
        citations,
      };
      setChatMessages((messages) => [...messages, airaMessage]);
      setSelectedCitation(citations[0] || defaultCitation);
      setStatus(payload.source === "openrouter" ? "Answered with retrieved sources." : "Answered with seeded local sources.");

      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConversationId,
          title: text.slice(0, 72),
          mode,
          subject,
          messages: [...outgoing, airaMessage].map((message) => ({
            role: message.role === "aira" ? "assistant" : "user",
            content: message.text,
          })),
        }),
      }).catch(() => null);
    } catch {
      const citations = retrieveSeedDocs(text, subject, 3);
      setChatMessages((messages) => [
        ...messages,
        { id: `a-${Date.now()}`, role: "aira", text: demoAnswer(text, mode, citations), citations },
      ]);
      setSelectedCitation(citations[0] || defaultCitation);
      setStatus("Network failed, so Aira used local seeded sources.");
    } finally {
      setIsSending(false);
    }
  };

  const newChat = () => {
    setActiveConversationId(`local-${Date.now()}`);
    setChatMessages([]);
    setSidebarOpen(false);
    setStatus("New chat started.");
  };

  const loadConversation = async (conversation: LocalConversation) => {
    setActiveConversationId(conversation.id);
    if (conversation.messages?.length) {
      setChatMessages(conversation.messages);
    } else if (!conversation.id.startsWith("local-")) {
      const response = await fetch(`/api/conversations/${conversation.id}`).catch(() => null);
      const payload = response ? await response.json().catch(() => null) : null;
      const messages = Array.isArray(payload?.messages)
        ? payload.messages.map((message: { id?: string; role?: string; content?: string; citations?: AiraCitation[] }, index: number) => ({
            id: message.id || `${conversation.id}-${index}`,
            role: message.role === "assistant" ? "aira" : "user",
            text: message.content || "",
            citations: message.citations,
          }))
        : [];
      setChatMessages(messages.length ? messages : defaultMessages);
    } else {
      setChatMessages(defaultMessages);
    }
    setMode(conversation.mode || "doubt");
    setSubject(conversation.subject || "physics");
    setLanguage(conversation.language || "en");
    setSidebarOpen(false);
  };

  const practiceCitation = (citation = selectedCitation) => {
    setSelectedCitation(citation);
    setShowCitation(false);
    setMode("practice");
    setStatus(`Practice loaded from ${citation.label}.`);
  };

  return (
    <main className={`study-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <aside className="study-sidebar">
        <Link href="/" className="brand-lockup">
          <AiraMark size={30} />
          <span>Aira</span>
        </Link>
        <button className="new-chat" onClick={newChat}>Ask a doubt</button>
        <div className="section-kicker">Subjects</div>
        <div className="sidebar-list">
          {subjects.slice(0, 5).map((item) => (
            <button className={subject === item.id ? "active" : ""} key={item.id} onClick={() => selectSubject(item.id)}>
              <span style={{ color: item.color }}>■</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="section-kicker">Recent</div>
        <div className="conversation-list">
          {hydrated && conversations.slice(0, 5).map((conversation) => (
            <button key={conversation.id} onClick={() => loadConversation(conversation)}>
              {conversation.title || "Study chat"}
            </button>
          ))}
          {!hydrated || !conversations.length ? (
            <>
              <button onClick={() => sendMessage("Explain Lenz's law with a 5-mark answer")}>Lenz&apos;s law direction trick</button>
              <button onClick={() => { const citation = retrieveSeedDocs("logarithmic differentiation", "mathematics", 1)[0] || defaultCitation; setSelectedCitation(citation); setMode("practice"); selectSubject("mathematics"); }}>Continuity & differentiability</button>
              <button onClick={() => { const citation = retrieveSeedDocs("bohr atomic model", "physics", 1)[0] || defaultCitation; setSelectedCitation(citation); setMode("learning"); selectSubject("physics"); }}>Bohr&apos;s atomic model</button>
            </>
          ) : null}
        </div>
        <Link href="/saved" className="saved-link">
          <Bookmark size={16} /> Saved answers
        </Link>
        <div className="sidebar-footer">
          <InstallButton compact />
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="secondary-button full"><LogOut size={15} /> Logout</button>
          </form>
        </div>
      </aside>

      <section className="study-main">
        <header className="app-header">
          <button className="icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={20} /></button>
          <div>
            <h1>{headerTitle(mode, selectedCitation)}</h1>
            <p>• {subjectLabel(subject)} · {languageLabel(language)} {savedCount ? `· ${savedCount} saved` : ""}</p>
          </div>
          <div className="header-actions">
            <LanguageToggle language={language} setLanguage={selectLanguage} />
            <InstallButton compact />
            <Link href="/saved" className="icon-button" aria-label="Saved answers"><Bookmark size={20} /></Link>
          </div>
        </header>
        <ModeTabs mode={mode} setMode={setMode} />
        <div className="app-scroll">
          {mode === "doubt" ? (
            <DoubtView
              messages={chatMessages}
              status={status}
              isSending={isSending}
              onCitation={openCitation}
              onSave={saveAnswer}
              onPractice={practiceCitation}
              onSend={sendMessage}
            />
          ) : null}
          {mode === "practice" ? <PracticeView citation={selectedCitation} /> : null}
          {mode === "revision" ? <RevisionView subject={subject} /> : null}
          {mode === "learning" ? <LearningView language={language} /> : null}
        </div>
        {mode === "doubt" ? <ChatInput onSend={sendMessage} disabled={isSending} /> : null}
      </section>
      {sidebarOpen ? <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" /> : null}

      <aside className="source-panel">
        <CitationDetail
          compact={false}
          citation={selectedCitation}
          onPractice={practiceCitation}
          onSave={() => saveAnswer(undefined, selectedCitation)}
        />
      </aside>

      {showCitation ? (
        <div className="modal-backdrop" onClick={() => setShowCitation(false)}>
          <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCitation(false)}><X size={18} /></button>
            <CitationDetail
              compact
              citation={selectedCitation}
              onPractice={practiceCitation}
              onSave={() => saveAnswer(undefined, selectedCitation)}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export function SavedScreen() {
  const [items, setItems] = useState<LocalSavedItem[]>(savedItems as LocalSavedItem[]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [status, setStatus] = useState("Reading local saves...");

  useEffect(() => {
    const local = readJson<LocalSavedItem[]>(SAVED_KEY, savedItems as LocalSavedItem[]).filter((item) => !item.deleted);
    writeJson(SAVED_KEY, local);
    queueMicrotask(() => {
      setItems(local);
      setExpandedId(local[0]?.id || null);
      setHydrated(true);
      setStatus(`${local.length} local items loaded instantly.`);
    });

    const since = local.reduce((latest, item) => Math.max(latest, item.ts || 0), 0);
    fetch(`/api/saved?since=${since}`)
      .then((response) => response.json())
      .then((payload) => {
        const remote = ((payload.items || []) as LocalSavedItem[]).filter((item) => !item.deleted);
        if (remote.length) {
          setItems((current) => {
            const merged = mergeSaved(remote, current);
            writeJson(SAVED_KEY, merged);
            return merged;
          });
          setStatus(`${remote.length} cloud save${remote.length === 1 ? "" : "s"} merged.`);
        } else {
          setStatus(payload.source === "supabase" ? "Synced. No new cloud saves." : "Local preview mode. Sync will attach after login/env setup.");
        }
      })
      .catch(() => setStatus("Local saves are available. Cloud sync is offline."));
  }, []);

  useEffect(() => {
    if (hydrated) writeJson(SAVED_KEY, items);
  }, [hydrated, items]);

  const remove = (id: string) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      writeJson(SAVED_KEY, next);
      return next;
    });
    fetch(`/api/bookmarks/${id}`, { method: "DELETE" }).catch(() => null);
  };

  const visibleItems = items.filter((item) => {
    const haystack = `${item.title} ${item.answer} ${item.subject}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesSubject = selectedSubject === "all" || normaliseSubject(item.subject) === selectedSubject;
    return matchesQuery && matchesSubject;
  });

  return (
    <main className="saved-page">
      <section className="saved-workspace">
        <header className="saved-header">
          <Link href="/chat">‹</Link>
          <div>
            <h1>Saved</h1>
            <p>• {visibleItems.length} items · {status}</p>
          </div>
          <label className="saved-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saves" />
          </label>
        </header>
        <div className="filter-strip">
          <button className={`filter-chip ${selectedSubject === "all" ? "active" : ""}`} onClick={() => setSelectedSubject("all")}>All · {items.length}</button>
          {subjects.slice(0, 5).map((subject) => (
            <button
              className={`filter-chip ${selectedSubject === subject.id ? "active" : ""}`}
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
            >
              {subject.short} · {items.filter((item) => normaliseSubject(item.subject) === subject.id).length}
            </button>
          ))}
        </div>
        <div className="sync-rail">
          <span>●</span> Local-first saves are ready <code>cached · {items.length} local</code>
        </div>
        <div className="saved-list">
          {visibleItems.map((item) => {
            const expanded = expandedId === item.id;
            return (
            <article className={`saved-item ${expanded ? "expanded" : ""}`} key={item.id}>
              <button className="saved-title saved-title-button" onClick={() => setExpandedId(expanded ? null : item.id)}>
                <span className={`subject-dot ${normaliseSubject(item.subject)}`} />
                <strong>{item.title}</strong>
                <ChevronDown className={expanded ? "rotated" : ""} size={16} />
              </button>
              <p className="saved-meta">{item.time} · {subjectLabel(normaliseSubject(item.subject))} {item.synced ? "· synced" : "· local"}</p>
              {expanded ? (
                <div className="saved-answer-card">
                  <small>Aira&apos;s answer</small>
                  <MarkdownBlock content={item.answer || "Open this save in chat to continue the thread."} />
                  {item.formula ? <div className="formula-box">{item.formula}</div> : null}
                  {item.source ? <Chip tone="source">{item.source}</Chip> : null}
                  <Chip>AI-generated derivation</Chip>
                  <div className="saved-actions">
                    <Link href={`/chat?saved=${encodeURIComponent(item.id)}`}>Open in chat</Link>
                    <button onClick={() => remove(item.id)} aria-label="Delete saved answer"><Trash2 size={15} /></button>
                  </div>
                </div>
              ) : null}
            </article>
          )})}
          {!visibleItems.length ? <p className="empty-state">No saved answers match that search.</p> : null}
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

function DoubtView({
  messages,
  status,
  isSending,
  onCitation,
  onSave,
  onPractice,
  onSend,
}: {
  messages: ChatMessage[];
  status: string;
  isSending: boolean;
  onCitation: (citation?: AiraCitation) => void;
  onSave: (message?: ChatMessage, citation?: AiraCitation) => void;
  onPractice: (citation?: AiraCitation) => void;
  onSend: (text: string) => void;
}) {
  return (
    <div className="chat-stack">
      {!messages.length ? (
        <div className="empty-state">
          <AiraMark size={34} />
          <h2>Ask anything from your board prep.</h2>
          <p>Aira will retrieve the closest source, answer in exam style, and keep citations attached.</p>
        </div>
      ) : null}
      {messages.map((message) => {
        if (message.role === "user") {
          return <div className="message user" key={message.id}>{message.text}</div>;
        }

        const citation = message.citations?.[0] || defaultCitation;
        return (
          <article className="message aira" key={message.id}>
            <AiraMark size={24} />
            <div>
              <MarkdownBlock content={message.text} />
              {citation.answer ? <div className="formula-box">{citation.scheme?.[0]?.detail || citation.answer}</div> : null}
              <div className="citation-row">
                {(message.citations || [citation]).slice(0, 3).map((item) => (
                  <button className="citation-button" key={item.id} onClick={() => onCitation(item)}>
                    <Chip tone="source">{item.label}</Chip>
                  </button>
                ))}
              </div>
              <div className="answer-tools">
                <button onClick={() => onSave(message, citation)}><Bookmark size={15} /> Save</button>
                <button onClick={() => onSend("Give me one related question from the same topic.")}>Related Q</button>
                <button onClick={() => onPractice(citation)}>Practice</button>
                <button onClick={() => onSend("Explain this in Hindi.")}>हिन्दी</button>
                <button onClick={() => onCitation(citation)}><Check size={15} /> Source</button>
              </div>
            </div>
          </article>
        );
      })}
      <div className="prompt-pills">
        <button onClick={() => onSend("Show me a related question.")}>Show me a related Q</button>
        <button onClick={() => onPractice(defaultCitation)}>Switch to Practice</button>
        <button onClick={() => onSend("हिन्दी में समझाइए")}>हिन्दी में समझाइए</button>
      </div>
      <p className="status-line">{isSending ? "Aira is thinking..." : status}</p>
    </div>
  );
}

function PracticeView({ citation }: { citation: AiraCitation }) {
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [revealed, setRevealed] = useState(false);

  const submit = async () => {
    const keywords = citation.scheme.map((item) => item.title.toLowerCase().split(/\W+/)[0]).filter(Boolean);
    const matched = keywords.filter((word) => answer.toLowerCase().includes(word)).length;
    const localScore = Math.min(citation.marks || 3, Math.max(1, Math.round((matched / Math.max(1, keywords.length)) * (citation.marks || 3))));
    setScore(localScore);
    setFeedback(`You included ${matched || 1} scoring cue${matched === 1 ? "" : "s"}. Add the exact marking-scheme words for full marks.`);

    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, citation }),
      });
      const payload = await response.json();
      if (typeof payload.score === "number") setScore(payload.score);
      if (payload.feedback) setFeedback(payload.feedback);
    } catch {
      // local score already shown
    }
  };

  return (
    <div className="mode-page">
      <div className="progress-segments">
        {Array.from({ length: 12 }).map((_, index) => <span className={index < 4 ? "done" : ""} key={index} />)}
      </div>
      <div className="section-kicker">{citation.label}</div>
      <h2>{citation.question}</h2>
      <p>Write your answer in points. Aira scores it against the attached marking scheme.</p>
      <div className="working-box">
        <div className="section-kicker">Your working</div>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Write your working here..."
        />
      </div>
      <div className="symbol-row">
        {["π", "∫", "√", "x²", "x/y", "∞", "≠"].map((symbol) => <button key={symbol} onClick={() => setAnswer((value) => `${value}${symbol}`)}>{symbol}</button>)}
      </div>
      {revealed || score !== null ? (
        <div className="score-card">
          <strong>{score !== null ? `Score: ${score} / ${citation.marks || 3}` : "Model solution"}</strong>
          <p>{feedback || citation.answer}</p>
          <p>{citation.answer}</p>
        </div>
      ) : null}
      <div className="bottom-bar inline">
        <button className="secondary-button" onClick={() => setRevealed(true)}>Reveal solution</button>
        <button className="primary-button" onClick={submit} disabled={!answer.trim()}>Submit answer</button>
      </div>
    </div>
  );
}

function RevisionView({ subject }: { subject: string }) {
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState("");
  const doc = retrieveSeedDocs(subject, subject, 1)[0] || defaultCitation;

  return (
    <div className="mode-page">
      <div className="section-kicker">Revision · {subjectLabel(subject)}</div>
      <h2>{doc.chapter}</h2>
      <div className="revision-list">
        {(doc.scheme?.length ? doc.scheme.map((item) => [item.title, item.detail]) : revisionPack).map(([title, text], index) => (
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
        <p>State the most important scoring cue from this chapter.</p>
        <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer..." />
      </div>
      {checked ? <div className="score-card"><strong>Good.</strong><p>Compare your answer with this cue: {doc.scheme?.[0]?.detail || doc.answer}</p></div> : null}
      <button className="primary-button full" onClick={() => setChecked(true)}>Submit & score me</button>
    </div>
  );
}

function LearningView({ language }: { language: LocalProfile["preferred_language"] }) {
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState("");

  return (
    <div className="mode-page learning">
      <div className="progress-segments three"><span className="done" /><span /><span /></div>
      <h2>The intuition before the formula</h2>
      <p>
        Aira teaches from the idea first, then moves into the exam sentence.
        Use {languageLabel(language).toLowerCase()} explanations when you want the wording to match your study style.
      </p>
      <div className="lesson-card">
        <div className="section-kicker">Three scoring moves</div>
        <p><em>i.</em> Name the principle in one clean sentence.</p>
        <p><em>ii.</em> Apply it to the exact situation in the question.</p>
        <p><em>iii.</em> End with the consequence the examiner expects.</p>
      </div>
      <div className="quick-check">
        <div className="section-kicker">Quick check</div>
        <p>In your own words: what is the scoring phrase you would underline?</p>
        <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type 1-2 sentences..." />
        {checked ? <p className="feedback-line">Nice. Keep the wording compact and include the source keyword: “opposes the change” or the equivalent cue for your chapter.</p> : null}
        <button className="primary-button full" onClick={() => setChecked(true)}>Check <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

function CitationDetail({
  compact,
  citation,
  onPractice,
  onSave,
}: {
  compact: boolean;
  citation: AiraCitation;
  onPractice: (citation?: AiraCitation) => void;
  onSave: () => void;
}) {
  return (
    <article className={`citation-detail ${compact ? "compact" : ""}`}>
      <div className="source-topline">
        <span>Source · {citation.year} {citation.subject} · {citation.set}</span>
        <Chip tone="success">{citation.solution_source === "marking-scheme" ? "Official" : "AI-assisted"}</Chip>
      </div>
      <h2>{citation.set_label} · Section {citation.section} · Q{citation.q_no}</h2>
      <Chip tone="saffron">{citation.marks >= 5 ? "Long answer" : "Short answer"} · {citation.marks} marks</Chip>
      <p className="source-question">{citation.question}</p>
      <div className="marking-scheme">
        <div className="section-kicker">Marking scheme · {citation.marks} marks</div>
        {citation.scheme.map((item, index) => (
          <div className="scheme-row" key={`${item.title}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{item.title} <i>{item.marks}</i></strong>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bottom-bar inline">
        <button className="secondary-button" onClick={onSave}><Bookmark size={16} /> Save</button>
        <button className="primary-button" onClick={() => onPractice(citation)}>Practice this</button>
      </div>
    </article>
  );
}

function ChatInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  const canSend = useMemo(() => value.trim().length > 0 && !disabled, [disabled, value]);
  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="chat-input-bar">
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        placeholder="Ask a doubt..."
      />
      <button className="icon-button" onClick={() => setValue((current) => `${current} [image attached]`)}><ImageIcon size={18} /></button>
      <button className="icon-button" onClick={() => setValue((current) => `${current} Explain by voice note.`)}><Mic size={18} /></button>
      <button className="send-button" disabled={!canSend} onClick={submit}><Send size={18} /></button>
    </div>
  );
}

function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="prose-aira">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function LanguageToggle({
  language,
  setLanguage,
}: {
  language: LocalProfile["preferred_language"];
  setLanguage: (language: LocalProfile["preferred_language"]) => void;
}) {
  return (
    <div className="mini-segmented" aria-label="Explanation language">
      {(["en", "hi", "both"] as const).map((item) => (
        <button className={language === item ? "active" : ""} key={item} onClick={() => setLanguage(item)}>
          {item === "en" ? "EN" : item === "hi" ? "HI" : "Both"}
        </button>
      ))}
    </div>
  );
}

function headerTitle(mode: ModeId, citation: AiraCitation) {
  if (mode === "practice") return citation.topic || "Practice";
  if (mode === "revision") return citation.chapter || "Revision";
  if (mode === "learning") return "Learning path";
  return citation.topic || "Doubt Solver";
}

function subjectLabel(id: string) {
  return subjects.find((subject) => subject.id === normaliseSubject(id))?.label || id;
}

function languageLabel(language: LocalProfile["preferred_language"]) {
  if (language === "hi") return "Hindi";
  if (language === "both") return "English + Hindi";
  return "English";
}

function normaliseSubject(subject: string) {
  return subject.toLowerCase().replace(/\s+/g, "-").replace("math", "mathematics").replace("computer-sci.", "computer-science");
}

function firstUserText(messages: ChatMessage[]) {
  return messages.find((message) => message.role === "user")?.text.slice(0, 90);
}

function mergeConversations(local: LocalConversation[], remote: LocalConversation[]) {
  const map = new Map<string, LocalConversation>();
  [...remote, ...local].forEach((conversation) => map.set(conversation.id, conversation));
  return [...map.values()].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
}

function mergeSaved(remote: LocalSavedItem[], local: LocalSavedItem[]) {
  const map = new Map<string, LocalSavedItem>();
  [...remote, ...local].forEach((item) => map.set(item.id, item));
  return [...map.values()]
    .filter((item) => !item.deleted)
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
