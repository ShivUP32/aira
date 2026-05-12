"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  Bookmark,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { AiraMark } from "@/components/aira/AiraMark";
import { Chip } from "@/components/aira/Chip";
import { InstallButton } from "@/components/aira/InstallButton";
import {
  doubtQuickActions,
  learningQuickActions,
  modes,
  practiceQuickActions,
  revisionPack,
  revisionQuickActions,
  savedItems,
  starterMessages,
  syllabusReferences,
  syllabusTopics,
  subjects,
} from "@/lib/aira/content";
import { emptyCitation, type AiraCitation } from "@/lib/aira/citations";
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

const defaultMessages = (starterMessages as { role: "user" | "aira"; text: string | string[] }[]).map((message, index) => ({
  id: `starter-${index}`,
  role: message.role,
  text: Array.isArray(message.text) ? message.text.join("\n\n") : message.text,
  citations: undefined,
}));

type PracticeQuestion = {
  citation: AiraCitation;
  documentId: number;
};

export function StudyApp({
  initialMode = "doubt",
  initialConversationId,
  initialSavedId,
  initialQuery,
}: {
  initialMode?: ModeId;
  initialConversationId?: string;
  initialSavedId?: string;
  initialQuery?: string;
}) {
  const [mode, setMode] = useState<ModeId>(initialMode);
  const [selectedCitation, setSelectedCitation] = useState<AiraCitation | null>(null);
  const [practiceQuestion, setPracticeQuestion] = useState<PracticeQuestion | null>(null);
  const [practiceStatus, setPracticeStatus] = useState("Choose a subject to load a stored question.");
  const [showCitation, setShowCitation] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultMessages);
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId || "local-draft");
  const [subject, setSubject] = useState("physics");
  const [language, setLanguage] = useState<LocalProfile["preferred_language"]>("en");
  const [isSending, setIsSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState("Ready for your next board-exam question.");

  useEffect(() => {
    const profile = readJson<LocalProfile>(PROFILE_KEY, { subjects: ["physics", "chemistry", "mathematics"], preferred_language: "en" });
    const localSaved = readJson<LocalSavedItem[]>(SAVED_KEY, savedItems as LocalSavedItem[]).filter((item) => !item.deleted);
    const localConversations = readJson<LocalConversation[]>(CONVERSATIONS_KEY, []);
    writeJson(SAVED_KEY, localSaved);
    const nextConversationId = initialConversationId || localConversations[0]?.id || createLocalId("local");
    const hydrateTimer = window.setTimeout(() => {
      setSubject(profile.subjects[0] || "physics");
      setLanguage(profile.preferred_language);
      setSavedCount(localSaved.length);
      setConversations(localConversations);
      setActiveConversationId(nextConversationId);
      if (initialSavedId) {
        const savedItem = localSaved.find((item) => item.id === initialSavedId);
        if (savedItem) {
          setMode("doubt");
          setSubject(normaliseSubject(savedItem.subject || profile.subjects[0] || "physics"));
          setChatMessages(seedMessagesFromSaved(savedItem, initialQuery));
          setStatus("Saved answer loaded into your chat.");
        }
      } else if (initialQuery?.trim()) {
        setMode("doubt");
        setChatMessages([{ id: createLocalId("u"), role: "user", text: initialQuery.trim() }]);
        setStatus("Question loaded into chat.");
      }
      setHydrated(true);
    }, 100);

    fetch("/api/conversations")
      .then((response) => response.json())
      .then((payload) => {
        const remote = (payload.conversations || []) as LocalConversation[];
        if (remote.length) {
          setConversations((current) => mergeConversations(current, remote));
        }
      })
      .catch(() => null);

    return () => window.clearTimeout(hydrateTimer);
  }, [initialConversationId, initialQuery, initialSavedId]);

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
    persistProfile({ subjects: [id] });
    setSidebarOpen(false);
  };

  const selectLanguage = (nextLanguage: LocalProfile["preferred_language"]) => {
    setLanguage(nextLanguage);
    persistProfile({ preferred_language: nextLanguage });
  };

  const openCitation = (citation?: AiraCitation) => {
    if (citation) {
      setSelectedCitation(citation);
      setShowCitation(true);
    }
  };

  const saveAnswer = async (message?: ChatMessage, citation = selectedCitation) => {
    if (!citation) {
      setStatus("Ask a question first, then save the answer with its source.");
      return;
    }
    const sourceMessage = message || [...chatMessages].reverse().find((item) => item.role === "aira");
    const documentId = Number(citation.id);
    const item: LocalSavedItem = {
      id: createLocalId("sv"),
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
    setStatus("Answer saved. It will stay available in Saved answers.");

    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          document_id: Number.isSafeInteger(documentId) ? documentId : undefined,
        }),
      });
      const payload = await response.json();
      const syncedItem = payload.item as LocalSavedItem | undefined;
      if (syncedItem?.serverId || syncedItem?.synced) {
        const current = readJson<LocalSavedItem[]>(SAVED_KEY, []);
        const merged = mergeSaved([{ ...item, ...syncedItem, id: item.id }], current.filter((entry) => entry.id !== item.id));
        writeJson(SAVED_KEY, merged);
        setStatus("Answer saved to your account.");
      } else {
        setStatus("Answer saved. It will stay available in Saved answers.");
      }
    } catch {
      setStatus("Answer saved. It will stay available in Saved answers.");
    }
  };

  const sendMessage = async (text: string) => {
    if (isSending) return;
    const userMessage: ChatMessage = { id: createLocalId("u"), role: "user", text };
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
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Chat request failed");
      }
      const citations = ((payload.citations || []) as AiraCitation[]).filter((item) => item.question || item.answer);
      const airaMessage: ChatMessage = {
        id: createLocalId("a"),
        role: "aira",
        text: payload.answer || "Aira could not generate an answer right now.",
        citations,
      };
      setChatMessages((messages) => [...messages, airaMessage]);
      setSelectedCitation(citations[0] || null);
      setStatus(citations.length ? "Answer ready with source citations." : "Answer ready. No matching source was found yet.");

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
      setChatMessages((messages) => [
        ...messages,
        { id: createLocalId("a"), role: "aira", text: "Aira could not reach the answer service right now. Please try again in a moment.", citations: [] },
      ]);
      setSelectedCitation(null);
      setStatus("Answer service unavailable.");
    } finally {
      setIsSending(false);
    }
  };

  const newChat = () => {
    setActiveConversationId(createLocalId("local"));
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
    if (!citation) {
      setMode("practice");
      setStatus("Choose a stored question to start practice.");
      return;
    }
    setSelectedCitation(citation);
    setPracticeQuestion({ citation, documentId: Number(citation.id) });
    setShowCitation(false);
    setMode("practice");
    setStatus(`Practice loaded from ${citation.label}.`);
  };

  const loadPracticeQuestion = async (nextSubject = subject, chapter?: string) => {
    setMode("practice");
    setSubject(nextSubject);
    setPracticeStatus("Loading a stored question...");
    try {
      const params = new URLSearchParams({ subject: nextSubject, language: "en" });
      if (chapter) params.set("chapter", chapter);
      const response = await fetch(`/api/practice/question?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.citation || !payload.documentId) {
        throw new Error(payload.error || "No stored question available");
      }
      const next = { citation: payload.citation as AiraCitation, documentId: Number(payload.documentId) };
      setPracticeQuestion(next);
      setSelectedCitation(next.citation);
      setPracticeStatus("");
      setStatus(`Practice loaded from ${next.citation.label}.`);
    } catch {
      setPracticeQuestion(null);
      setPracticeStatus("No stored questions available yet for this selection.");
      setStatus("No stored questions available yet.");
    }
  };

  const sendAndShowChat = (text: string) => {
    sendMessage(text);
    setMode("doubt");
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
              {doubtQuickActions.slice(0, 3).map((action) => (
                <button key={action} onClick={() => sendMessage(action)}>{action}</button>
              ))}
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
            <p>• {subjectLabel(subject)} · English {savedCount ? `· ${savedCount} saved` : ""}</p>
          </div>
          <div className="header-actions">
            <LanguageToggle setLanguage={selectLanguage} />
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
              onStartPractice={loadPracticeQuestion}
              onSend={sendMessage}
            />
          ) : null}
          {mode === "practice" ? (
            <PracticeView
              key={practiceQuestion?.documentId || subject}
              question={practiceQuestion}
              status={practiceStatus}
              onLoadQuestion={loadPracticeQuestion}
            />
          ) : null}
          {mode === "revision" ? <RevisionView subject={subject} onSend={sendAndShowChat} onLoadQuestion={loadPracticeQuestion} /> : null}
          {mode === "learning" ? <LearningView subject={subject} onSend={sendAndShowChat} onLoadQuestion={loadPracticeQuestion} /> : null}
        </div>
        {mode === "doubt" ? <ChatInput onSend={sendMessage} disabled={isSending} /> : null}
      </section>
      {sidebarOpen ? <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" /> : null}

      <aside className="source-panel">
        {selectedCitation ? (
          <CitationDetail
            compact={false}
            citation={selectedCitation}
            onPractice={practiceCitation}
            onSave={() => saveAnswer(undefined, selectedCitation)}
          />
        ) : (
          <EmptySourcePanel />
        )}
      </aside>

      {showCitation ? (
        <div className="modal-backdrop" onClick={() => setShowCitation(false)}>
          <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCitation(false)} aria-label="Close source panel"><X size={18} /></button>
            {selectedCitation ? (
              <CitationDetail
                compact
                citation={selectedCitation}
                onPractice={practiceCitation}
                onSave={() => saveAnswer(undefined, selectedCitation)}
              />
            ) : null}
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
    const hydrateTimer = window.setTimeout(() => {
      setItems(local);
      setExpandedId(local[0]?.id || null);
      setHydrated(true);
      setStatus(`${local.length} saved item${local.length === 1 ? "" : "s"} loaded.`);
    }, 100);

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
          setStatus(`${remote.length} saved item${remote.length === 1 ? "" : "s"} updated.`);
        } else {
          setStatus("Saved answers are up to date.");
        }
      })
      .catch(() => setStatus("Saved answers are available on this device."));

    return () => window.clearTimeout(hydrateTimer);
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
    const serverId = items.find((item) => item.id === id)?.serverId;
    fetch(`/api/saved/${encodeURIComponent(serverId || id)}`, { method: "DELETE" }).catch(() => null);
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
          <span>●</span> Saved answers ready <code>{items.length} saved</code>
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
  onStartPractice,
  onSend,
}: {
  messages: ChatMessage[];
  status: string;
  isSending: boolean;
  onCitation: (citation?: AiraCitation) => void;
  onSave: (message?: ChatMessage, citation?: AiraCitation) => void;
  onPractice: (citation?: AiraCitation) => void;
  onStartPractice: (subject?: string, chapter?: string) => void;
  onSend: (text: string) => void;
}) {
  return (
    <div className="chat-stack">
      {!messages.length ? (
        <div className="empty-state">
          <AiraMark size={34} />
          <h2>Start with a board-exam question.</h2>
          <p>Get marks-focused answers with citations, then save strong responses and switch to practice.</p>
        </div>
      ) : null}
      {messages.map((message) => {
        if (message.role === "user") {
          return <div className="message user" key={message.id}>{message.text}</div>;
        }

        const citation = message.citations?.[0];
        return (
          <article className="message aira" key={message.id}>
            <AiraMark size={24} />
            <div>
              <MarkdownBlock content={message.text} />
              {citation?.answer ? <div className="formula-box">{citation.scheme?.[0]?.detail || citation.answer}</div> : null}
              {message.citations?.length ? (
                <div className="citation-row">
                  {message.citations.slice(0, 3).map((item) => (
                    <button className="citation-button" key={item.id} onClick={() => onCitation(item)}>
                      <Chip tone="source">{item.label}</Chip>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="answer-tools">
                <button onClick={() => onSave(message, citation)}><Bookmark size={15} /> Save</button>
                <button onClick={() => onSend("Give me one related board-exam question from this topic.")}>Related question</button>
                <button onClick={() => citation ? onPractice(citation) : onStartPractice()}>Practice</button>
                {citation ? <button onClick={() => onCitation(citation)}><Check size={15} /> Source</button> : null}
              </div>
            </div>
          </article>
        );
      })}
      <div className="prompt-pills">
        {doubtQuickActions.map((action) => (
          <button key={action} onClick={() => onSend(action)}>{action}</button>
        ))}
        <button onClick={() => onStartPractice()}>Start practice</button>
      </div>
      <p className="status-line">{isSending ? "Aira is thinking..." : status}</p>
    </div>
  );
}

function PracticeView({
  question,
  status,
  onLoadQuestion,
}: {
  question: PracticeQuestion | null;
  status: string;
  onLoadQuestion: (subject?: string, chapter?: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [maxMarks, setMaxMarks] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [attemptStatus, setAttemptStatus] = useState("");
  const citation = question?.citation;

  const submit = async () => {
    if (!question) return;
    setAttemptStatus("Checking against the stored marking scheme...");

    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, documentId: question.documentId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Practice check failed");
      if (typeof payload.score === "number") setScore(payload.score);
      if (typeof payload.maxMarks === "number") setMaxMarks(payload.maxMarks);
      if (payload.feedback) setFeedback(payload.feedback);
      setAttemptStatus(payload.source === "supabase" ? "Attempt saved to your practice history." : "Attempt checked and ready to improve.");
    } catch {
      setAttemptStatus("Could not check this attempt right now.");
    }
  };

  if (!citation) {
    return (
      <div className="mode-page">
        <div className="section-kicker">Practice · Stored questions</div>
        <h2>Choose a stored board-style question.</h2>
        <p>{status || "Practice uses questions extracted from the uploaded CBSE papers."}</p>
        <div className="prompt-pills">
          {practiceQuickActions.map((action) => (
            <button key={action.label} onClick={() => onLoadQuestion(action.subject)}>{action.label}</button>
          ))}
        </div>
      </div>
    );
  }

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
          <strong>{score !== null ? `Score: ${score} / ${maxMarks || citation.marks || 3}` : "Model solution"}</strong>
          <p>{feedback || citation.answer}</p>
          <p>{citation.answer}</p>
          {attemptStatus ? <small>{attemptStatus}</small> : null}
        </div>
      ) : null}
      <div className="bottom-bar inline">
        <button className="secondary-button" onClick={() => { setAnswer(""); setScore(null); setMaxMarks(null); setFeedback(""); setRevealed(false); setAttemptStatus(""); }}>Try again</button>
        <button className="secondary-button" onClick={() => onLoadQuestion(citation.subject)}>New question</button>
        <button className="secondary-button" onClick={() => setRevealed(true)}>Reveal solution</button>
        <button className="primary-button" onClick={submit} disabled={!answer.trim()}>Submit answer</button>
      </div>
    </div>
  );
}

function RevisionView({
  subject,
  onSend,
  onLoadQuestion,
}: {
  subject: string;
  onSend: (text: string) => void;
  onLoadQuestion: (subject?: string, chapter?: string) => void;
}) {
  const topics = syllabusTopics[normaliseSubject(subject) as keyof typeof syllabusTopics] || [];
  return (
    <div className="mode-page">
      <div className="section-kicker">Revision · {subjectLabel(subject)}</div>
      <h2>Revise from the official Class 12 CBSE syllabus.</h2>
      <p>Pick a topic and Aira will create a concise Groq-powered revision pack with exam-focused cues.</p>
      <div className="revision-list">
        {(topics.length ? topics : revisionPack.map((item) => item[0])).map((topic, index) => (
          <article key={topic}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{topic}</strong>
            <p>Generate a short revision pack and then practise a stored question from this area.</p>
          </article>
        ))}
      </div>
      <div className="prompt-pills">
        {revisionQuickActions.map((action) => (
          <button key={action.label} onClick={() => onSend(`${action.label}. Keep it concise for Class 12 CBSE and include quick check questions.`)}>
            {action.label}
          </button>
        ))}
      </div>
      <div className="bottom-bar inline">
        <button className="secondary-button" onClick={() => onLoadQuestion(subject)}>Practice a stored question</button>
        <button className="primary-button" onClick={() => onSend(`Revise ${subjectLabel(subject)} for Class 12 CBSE. Use the official syllabus and give a quick quiz.`)}>Generate revision pack</button>
      </div>
      <SyllabusReferences />
    </div>
  );
}

function LearningView({
  subject,
  onSend,
  onLoadQuestion,
}: {
  subject: string;
  onSend: (text: string) => void;
  onLoadQuestion: (subject?: string, chapter?: string) => void;
}) {
  const topics = syllabusTopics[normaliseSubject(subject) as keyof typeof syllabusTopics] || [];
  return (
    <div className="mode-page learning">
      <div className="progress-segments three"><span className="done" /><span /><span /></div>
      <div className="section-kicker">Learning · Class 12 CBSE syllabus</div>
      <h2>Pick a topic to learn step by step.</h2>
      <p>Aira will teach from the official syllabus and keep the explanation focused on board-exam language.</p>
      <div className="lesson-card">
        <div className="section-kicker">Syllabus topics</div>
        {(topics.length ? topics : ["Choose a subject from the sidebar"]).map((topic, index) => (
          <p key={topic}><em>{index + 1}.</em> <strong>{topic}</strong></p>
        ))}
      </div>
      <div className="prompt-pills">
        {learningQuickActions.map((action) => (
          <button key={action.label} onClick={() => onSend(`${action.label} for Class 12 CBSE. Teach it step by step and end with a quick check.`)}>
            {action.label}
          </button>
        ))}
      </div>
      <div className="bottom-bar inline">
        <button className="secondary-button" onClick={() => onLoadQuestion(subject)}>Practice after learning</button>
        <button className="primary-button" onClick={() => onSend(`Teach me ${subjectLabel(subject)} from the Class 12 CBSE syllabus step by step.`)}>Start learning</button>
      </div>
      <SyllabusReferences />
    </div>
  );
}

function SyllabusReferences() {
  return (
    <div className="source-card compact">
      <div className="section-kicker">Official syllabus references</div>
      {syllabusReferences.map(([label, href]) => (
        <a key={href} href={href} target="_blank" rel="noreferrer">{label}</a>
      ))}
    </div>
  );
}

function EmptySourcePanel() {
  return (
    <article className="citation-detail compact">
      <div className="source-topline">
        <span>Sources</span>
      </div>
      <h2>Ask a question to see sources.</h2>
      <p className="source-question">Aira will attach matching CBSE paper sources when the stored documents contain a close match.</p>
    </article>
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
        placeholder="Ask a board-exam question..."
      />
      <button className="send-button" disabled={!canSend} onClick={submit}>
        <Send size={18} />
        <span className="sr-only">Send message</span>
      </button>
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
  setLanguage,
}: {
  setLanguage: (language: LocalProfile["preferred_language"]) => void;
}) {
  return (
    <div className="mini-segmented" aria-label="Language">
      <button className="active" onClick={() => setLanguage("en")}>EN</button>
    </div>
  );
}

function headerTitle(mode: ModeId, citation: AiraCitation | null) {
  if (mode === "practice") return citation?.topic || "Practice";
  if (mode === "revision") return citation?.chapter || "Revision";
  if (mode === "learning") return "Learning path";
  return citation?.topic || "Doubt Solver";
}

function subjectLabel(id: string) {
  return subjects.find((subject) => subject.id === normaliseSubject(id))?.label || id;
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

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedMessagesFromSaved(item: LocalSavedItem, query?: string): ChatMessage[] {
  const userText = query?.trim() || item.title || "Continue from this saved answer.";
  return [
    { id: createLocalId("u"), role: "user", text: userText },
    {
      id: createLocalId("a"),
      role: "aira",
      text: item.answer || "Saved answer loaded. Ask a follow-up to continue.",
      citations: item.source
        ? [
          {
              ...emptyCitation,
              id: item.citationId || "",
              subject: normaliseSubject(item.subject || ""),
              question: item.title || "",
              answer: item.answer || "",
              label: item.source,
            },
          ]
        : undefined,
    },
  ];
}
