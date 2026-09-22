export type DeskItem = {
  id: string;
  label: string;
  caption: string;
  to: string;
  position: [number, number, number];
  labelOffset?: [number, number, number];
};

export const DESK_ITEMS: DeskItem[] = [
  { id: "notes", label: "Notes", caption: "subject + topic do, AI notes ready", to: "/notes", position: [-1.5, 0.78, 0.45] },
  { id: "flashcards", label: "Flashcards", caption: "active recall decks from any topic", to: "/flashcards", position: [-0.8, 0.78, 1.0] },
  { id: "quiz", label: "Quiz", caption: "adaptive practice tests", to: "/quiz", position: [0.1, 0.78, 1.02] },
  { id: "partners", label: "Study Partners", caption: "match karo aur chat shuru karo", to: "/partners", position: [0.95, 0.79, 1.02], labelOffset: [0, 0.3, 0] },
  { id: "tutor", label: "AI Tutor", caption: "ask anything, anytime", to: "/chat", position: [0, 1.28, -0.55], labelOffset: [0, 0.62, 0] },
  { id: "pdf", label: "PDF Summary", caption: "upload PDF, instant summary", to: "/pdf-summary", position: [-1.65, 1.16, -0.95], labelOffset: [0, 0.46, 0] },
  { id: "dsa", label: "DSA Practice", caption: "code, run, get feedback", to: "/dsa-practice", position: [1.62, 1.05, -0.45], labelOffset: [0, 0.5, 0] },
  { id: "interview", label: "Mock Interview", caption: "live rubric: clarity, depth, communication", to: "/mock-interview", position: [1.62, 0.8, 0.55], labelOffset: [0, 0.62, 0] },
  { id: "exams", label: "Exam Countdown", caption: "stay ahead of deadlines", to: "/exam-countdown", position: [-2.0, 0.78, 0.9] },
];
