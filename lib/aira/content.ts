import {
  BookOpen,
  Bookmark,
  Brain,
  CheckCircle2,
  GraduationCap,
  MessageCircleQuestion,
  RotateCcw,
  Sigma,
} from "lucide-react";

export const subjects = [
  { id: "physics", label: "Physics", short: "Phy", count: "~40 Qs", color: "#4C44B8" },
  { id: "chemistry", label: "Chemistry", short: "Chem", count: "~40 Qs", color: "#B23A48" },
  { id: "mathematics", label: "Mathematics", short: "Math", count: "~50 Qs", color: "#DC8B3F" },
  { id: "computer-science", label: "Computer Sci.", short: "CS", count: "~30 Qs", color: "#4F7A6E" },
  { id: "english", label: "English Core", short: "Eng", count: "~25 Qs", color: "#6B6680" },
];

export const modes = [
  {
    id: "doubt",
    label: "Doubt Solver",
    short: "Doubt",
    icon: MessageCircleQuestion,
    description: "Free-form Q&A with citations.",
  },
  {
    id: "learning",
    label: "Learning",
    short: "Learning",
    icon: GraduationCap,
    description: "Concepts taught step-by-step.",
  },
  {
    id: "practice",
    label: "Practice",
    short: "Practice",
    icon: BookOpen,
    description: "Scored against the marking scheme.",
  },
  {
    id: "revision",
    label: "Revision",
    short: "Revision",
    icon: RotateCcw,
    description: "Concise chapter packs.",
  },
];

export const sampleCitation = {
  label: "CBSE 2025 Physics · Set-1 · Q12 · 5m",
  source: "Set-1 · Section D · Q12",
  status: "Official",
  question:
    "A circular metallic ring of radius r is dropped through a region of uniform magnetic field B directed horizontally. Using Lenz's law, explain qualitatively why the ring experiences retardation. Hence derive an expression for the induced EMF.",
  scheme: [
    ["State Lenz's law", "Induced current opposes the change in flux producing it.", "1m"],
    ["Direction analysis", "On entry: induced moment opposes external B. On exit: aids it.", "1m"],
    ["Derivation", "Phi = BA, so epsilon = -dPhi/dt = -BLv", "2m"],
    ["Conclusion", "F = BIL opposes motion, so mechanical energy becomes heat.", "1m"],
  ],
};

export const starterMessages = [
  {
    role: "user",
    text: "A copper ring is dropped through a magnetic field. Why does it slow down inside?",
  },
  {
    role: "aira",
    text: [
      "Great question. Let's reason carefully.",
      "1. What's changing? As the ring enters, magnetic flux Phi = B.A through it changes, so an EMF is induced.",
      "2. Lenz's law kicks in. The induced current opposes the change in flux. The force F = IL x B on this current points opposite to the ring's motion. Energy goes to heat.",
    ],
  },
];

export const savedItems = [
  {
    id: "sv-1",
    subject: "Physics",
    title: "Now use this to derive the formula for terminal velocity of a falling magnet through a copper pipe",
    time: "Just now",
    synced: true,
    answer:
      "Terminal velocity is reached when gravitational pull on the magnet is exactly balanced by the retarding magnetic force from eddy currents in the pipe wall.",
    formula: "mg = (B²L²v)/R  ⇒  v_terminal = mgR/(BL)²",
    source: "2025 Phy · Set-1 · Q12",
  },
  {
    id: "sv-2",
    subject: "Math",
    title: "If y = (sin x)^x, find dy/dx",
    time: "2h ago",
    synced: false,
  },
  {
    id: "sv-3",
    subject: "Physics",
    title: "Why does work done by magnetic force on a moving charge equal zero?",
    time: "Yesterday",
    synced: false,
  },
  {
    id: "sv-4",
    subject: "Chemistry",
    title: "Difference between SN1 and SN2 with one example each",
    time: "Yesterday",
    synced: false,
  },
];

export const revisionPack = [
  ["Magnetic flux", "Phi = B · A · cos theta"],
  ["Faraday's law", "A changing flux induces EMF: epsilon = - dPhi/dt"],
  ["Lenz's law", "Induced current opposes the change in flux."],
];

export const formulaRows = [
  ["Faraday", "epsilon = - dPhi / dt"],
  ["Motional EMF", "epsilon = B · L · v"],
  ["Self-inductance", "epsilon = - L · dI/dt"],
  ["Stored energy", "U = 1/2 L I²"],
];

export const modeHighlights = [
  { icon: MessageCircleQuestion, title: "Doubt Solver", text: "Ask anything and get a citation-backed answer." },
  { icon: GraduationCap, title: "Learning", text: "Move through ideas in paced, checked lessons." },
  { icon: Sigma, title: "Practice", text: "Write answers and score against marking points." },
  { icon: Brain, title: "Revision", text: "Collapse a chapter into concepts, formulas, and checks." },
  { icon: Bookmark, title: "Saved", text: "Local-first saves with delta sync once signed in." },
  { icon: CheckCircle2, title: "Sources", text: "Every grounded answer keeps its source visible." },
];
