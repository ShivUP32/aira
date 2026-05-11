import type { Mode } from "@/lib/llm/prompts";

export type AiraCitation = {
  id: string;
  label: string;
  subject: string;
  year: number;
  set: string;
  set_label: string;
  section: string;
  q_no: number | string;
  marks: number;
  chapter: string;
  topic: string;
  language: "en" | "hi";
  solution_source: "marking-scheme" | "llm-generated";
  question: string;
  answer: string;
  scheme: { title: string; detail: string; marks: string }[];
};

export const seedDocuments: AiraCitation[] = [
  {
    id: "seed-physics-lenz",
    label: "CBSE 2025 Physics · Set-1 · Q12 · 5m",
    subject: "physics",
    year: 2025,
    set: "55/1/1",
    set_label: "Set-1",
    section: "D",
    q_no: 12,
    marks: 5,
    chapter: "Electromagnetic Induction",
    topic: "Lenz's law",
    language: "en",
    solution_source: "marking-scheme",
    question:
      "A circular metallic ring is dropped through a region of uniform magnetic field. Using Lenz's law, explain why the ring experiences retardation.",
    answer:
      "The changing flux through the ring induces current. By Lenz's law the induced current opposes the change in flux, so the magnetic force opposes motion and mechanical energy is converted into heat.",
    scheme: [
      { title: "State Lenz's law", detail: "Induced current opposes the change in flux producing it.", marks: "1m" },
      { title: "Flux changes", detail: "As the ring enters/exits the field, magnetic flux through it changes.", marks: "1m" },
      { title: "Opposing force", detail: "The induced current creates a magnetic effect opposing the motion.", marks: "2m" },
      { title: "Energy statement", detail: "Retardation occurs because mechanical energy is dissipated as heat.", marks: "1m" },
    ],
  },
  {
    id: "seed-math-logdiff",
    label: "CBSE 2025 Mathematics · Set-1 · Q19 · 3m",
    subject: "mathematics",
    year: 2025,
    set: "65/1/1",
    set_label: "Set-1",
    section: "C",
    q_no: 19,
    marks: 3,
    chapter: "Continuity and Differentiability",
    topic: "Logarithmic differentiation",
    language: "en",
    solution_source: "llm-generated",
    question: "If y = (sin x)^x, find dy/dx.",
    answer:
      "Taking logs, log y = x log(sin x). Differentiating gives y'/y = log(sin x) + x cot x. Hence dy/dx = (sin x)^x [log(sin x) + x cot x].",
    scheme: [
      { title: "Log setup", detail: "Write log y = x log(sin x).", marks: "1m" },
      { title: "Differentiate", detail: "Differentiate both sides correctly.", marks: "1m" },
      { title: "Final answer", detail: "Multiply by y = (sin x)^x.", marks: "1m" },
    ],
  },
  {
    id: "seed-chem-sn",
    label: "CBSE 2025 Chemistry · Set-1 · Q8 · 2m",
    subject: "chemistry",
    year: 2025,
    set: "56/1/1",
    set_label: "Set-1",
    section: "B",
    q_no: 8,
    marks: 2,
    chapter: "Haloalkanes and Haloarenes",
    topic: "SN1 and SN2",
    language: "en",
    solution_source: "llm-generated",
    question: "Differentiate between SN1 and SN2 reactions with one example each.",
    answer:
      "SN1 is unimolecular and proceeds through a carbocation intermediate; SN2 is bimolecular and occurs through a single backside attack step.",
    scheme: [
      { title: "SN1 feature", detail: "Unimolecular, carbocation intermediate.", marks: "1m" },
      { title: "SN2 feature", detail: "Bimolecular, concerted backside attack.", marks: "1m" },
    ],
  },
  {
    id: "seed-cs-sql",
    label: "CBSE 2025 Computer Science · Set-1 · Q21 · 3m",
    subject: "computer-science",
    year: 2025,
    set: "83/1/1",
    set_label: "Set-1",
    section: "C",
    q_no: 21,
    marks: 3,
    chapter: "Database Concepts",
    topic: "SQL joins",
    language: "en",
    solution_source: "llm-generated",
    question: "Write an SQL query to display student names with their subject names using a common subject id.",
    answer:
      "Use an INNER JOIN on the shared subject_id: SELECT students.name, subjects.name FROM students INNER JOIN subjects ON students.subject_id = subjects.id;",
    scheme: [
      { title: "Select fields", detail: "Select required columns from both tables.", marks: "1m" },
      { title: "Join", detail: "Use INNER JOIN or equivalent join syntax.", marks: "1m" },
      { title: "Condition", detail: "Write correct ON condition using subject id.", marks: "1m" },
    ],
  },
  {
    id: "seed-english-notice",
    label: "CBSE 2025 English Core · Set-1 · Q4 · 4m",
    subject: "english",
    year: 2025,
    set: "1/1/1",
    set_label: "Set-1",
    section: "B",
    q_no: 4,
    marks: 4,
    chapter: "Writing Skills",
    topic: "Notice writing",
    language: "en",
    solution_source: "llm-generated",
    question: "Draft a notice for a school science exhibition.",
    answer:
      "A notice should include the issuing authority, date, title, event details, eligibility, and signature/designation of the issuer.",
    scheme: [
      { title: "Format", detail: "Notice box, school name, date and title.", marks: "1m" },
      { title: "Content", detail: "Relevant event details and instructions.", marks: "2m" },
      { title: "Expression", detail: "Clear, concise, grammatically correct language.", marks: "1m" },
    ],
  },
];

export function detectLang(text: string): "en" | "hi" {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return devanagari > latin ? "hi" : "en";
}

export function retrieveSeedDocs(query: string, subject?: string, limit = 3) {
  const q = query.toLowerCase();
  return seedDocuments
    .map((doc) => {
      const haystack = `${doc.subject} ${doc.chapter} ${doc.topic} ${doc.question} ${doc.answer}`.toLowerCase();
      const overlap = q
        .split(/\W+/)
        .filter((token) => token.length > 2 && haystack.includes(token)).length;
      const subjectBoost = subject && doc.subject === subject ? 3 : 0;
      return { doc, score: overlap + subjectBoost };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc }, index) => ({ ...doc, similarity: 0.9 - index * 0.08 }));
}

export function demoAnswer(query: string, mode: Mode, docs: AiraCitation[] = retrieveSeedDocs(query, undefined, 2)) {
  const primary = docs[0] || seedDocuments[0];
  if (mode === "practice") {
    return `Here is a board-style practice prompt from ${primary.label}.\n\n**Question:** ${primary.question}\n\nWrite your answer, then submit it for marking-scheme feedback.`;
  }
  if (mode === "revision") {
    return `## Quick revision: ${primary.chapter}\n\n- Core idea: ${primary.answer}\n- Formula / scoring cue: include the exact principle and one consequence.\n- Common mistake: writing a generic explanation without the marking-scheme keyword.\n\n**Quick check:** State the main law or rule in one sentence.`;
  }
  if (mode === "learning") {
    return `## ${primary.topic}, step by step\n\nStart with the intuition: ${primary.answer}\n\nNow connect it to the exam answer: define the principle, apply it to the situation, and finish with the scoring conclusion.\n\n**Check yourself:** What phrase would you underline for marks?`;
  }
  return `I’ll answer this in CBSE marking-scheme style.\n\n${primary.answer}\n\nFor marks, write the answer as points: state the rule, apply it to the given situation, and end with the scoring conclusion.`;
}
