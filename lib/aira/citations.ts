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

export const emptyCitation: AiraCitation = {
  id: "",
  label: "",
  subject: "",
  year: new Date().getFullYear(),
  set: "",
  set_label: "Source",
  section: "",
  q_no: "",
  marks: 0,
  chapter: "",
  topic: "",
  language: "en",
  solution_source: "llm-generated",
  question: "",
  answer: "",
  scheme: [],
};
