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
  { id: "computer-science", label: "Computer Science", short: "CS", count: "~30 Qs", color: "#4F7A6E" },
  { id: "english", label: "English Core", short: "Eng", count: "~25 Qs", color: "#6B6680" },
];

export const modes = [
  {
    id: "doubt",
    label: "Doubt Solver",
    short: "Doubt",
    icon: MessageCircleQuestion,
    description: "Exam-focused answers with citation evidence.",
  },
  {
    id: "learning",
    label: "Learning",
    short: "Learning",
    icon: GraduationCap,
    description: "Step-by-step concepts aligned to scoring points.",
  },
  {
    id: "practice",
    label: "Practice",
    short: "Practice",
    icon: BookOpen,
    description: "Score practice answers against the marking scheme.",
  },
  {
    id: "revision",
    label: "Revision",
    short: "Revision",
    icon: RotateCcw,
    description: "Rapid chapter revision with key scoring cues.",
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
];

export const savedItems = [
];

export const revisionPack = [
  ["Magnetic flux", "Phi = B · A · cos theta"],
  ["Faraday's law", "A changing flux induces EMF: epsilon = - dPhi/dt"],
  ["Lenz's law", "Induced current opposes the change in flux."],
];

export const formulaRows = [
];

export const doubtQuickActions = [
  "Explain electric field in simple words",
  "Why is Nernst equation useful?",
  "Differentiate x² sin x",
  "What does INNER JOIN do in SQL?",
  "Write a 50-word school notice",
];

export const learningQuickActions = [
  { subject: "physics", topic: "Electrostatics", label: "Learn Electrostatics" },
  { subject: "chemistry", topic: "Solutions", label: "Learn Solutions" },
  { subject: "mathematics", topic: "Matrices", label: "Learn Matrices" },
  { subject: "computer-science", topic: "Python file handling", label: "Learn Python file handling" },
  { subject: "english", topic: "Notice writing", label: "Learn Notice writing" },
];

export const practiceQuickActions = [
  { subject: "physics", label: "Easy Physics question" },
  { subject: "chemistry", label: "Easy Chemistry question" },
  { subject: "mathematics", label: "Easy Mathematics question" },
  { subject: "computer-science", label: "Easy Computer Science question" },
  { subject: "english", label: "Easy English question" },
];

export const revisionQuickActions = [
  { subject: "physics", topic: "Electrostatics", label: "Revise Electrostatics" },
  { subject: "chemistry", topic: "Chemical Kinetics", label: "Revise Chemical Kinetics" },
  { subject: "mathematics", topic: "Calculus", label: "Revise Calculus" },
  { subject: "computer-science", topic: "Computer Networks", label: "Revise Computer Networks" },
  { subject: "english", topic: "Creative Writing", label: "Revise Creative Writing" },
];

export const syllabusTopics = {
  physics: ["Electrostatics", "Current Electricity", "Magnetism", "EMI and AC", "EM Waves", "Optics", "Dual Nature", "Atoms and Nuclei", "Semiconductors"],
  chemistry: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols Phenols and Ethers", "Aldehydes Ketones and Carboxylic Acids", "Amines", "Biomolecules"],
  mathematics: ["Relations and Functions", "Algebra", "Calculus", "Vectors and 3D Geometry", "Linear Programming", "Probability"],
  "computer-science": ["Python functions", "Exception handling", "File handling", "Stacks", "Computer networks", "Database management", "SQL", "Python-SQL connectivity"],
  english: ["Reading Skills", "Creative Writing", "Literature", "Listening/Speaking", "Project Work"],
} as const;

export const syllabusReferences = [
  ["CBSE Curriculum 2025-26", "https://cbseacademic.nic.in/curriculum_2026.html"],
  ["Physics Class XII syllabus", "https://cbseacademic.nic.in/web_material/CurriculumMain26/SrSec/Physics_SrSec_2025-26.pdf"],
  ["Chemistry Class XII syllabus", "https://cbseacademic.nic.in/web_material/CurriculumMain26/SrSec/Chemistry_SrSec_2025-26.pdf"],
  ["Mathematics Class XII syllabus", "https://cbseacademic.nic.in/web_material/CurriculumMain26/SrSec/Maths_SrSec_2025-26.pdf"],
  ["Computer Science Class XII syllabus", "https://cbseacademic.nic.in/web_material/CurriculumMain26/SrSec/Computer_Science_SrSec_2025-26.pdf"],
  ["English Core Class XII syllabus", "https://cbseacademic.nic.in/web_material/CurriculumMain26/SrSec/English_core_SrSec_2025-26.pdf"],
] as const;

export const modeHighlights = [
  { icon: MessageCircleQuestion, title: "Doubt Solver", text: "Ask board-exam doubts and get source-backed answers." },
  { icon: GraduationCap, title: "Learning", text: "Learn with exam-ready steps and checkpoint prompts." },
  { icon: Sigma, title: "Practice", text: "Submit answers and score against marking points." },
  { icon: Brain, title: "Revision", text: "Revise chapters with formulas, cues, and quick checks." },
  { icon: Bookmark, title: "Saved", text: "Save strong answers and reopen them before revision." },
  { icon: CheckCircle2, title: "Sources", text: "Every grounded answer keeps its source visible." },
];
