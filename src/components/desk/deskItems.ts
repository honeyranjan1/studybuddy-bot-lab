export type DeskItem = {
  id: string;
  label: string;
  caption: string;
  to: string;
  position: [number, number, number];
  labelOffset?: [number, number, number];
};

export const DESK_ITEMS: DeskItem[] = [
  { id: "notes", label: "Notes", caption: "structured notes in seconds", to: "/notes", position: [-1.55, 0.78, 0.42] },
  { id: "flashcards", label: "Flashcards", caption: "active recall decks", to: "/flashcards", position: [-0.75, 0.78, 0.95] },
  { id: "quiz", label: "Quiz", caption: "adaptive practice tests", to: "/quiz", position: [0.15, 0.78, 0.98] },
  { id: "tutor", label: "AI Tutor", caption: "ask anything, anytime", to: "/chat", position: [0, 1.28, -0.55], labelOffset: [0, 0.62, 0] },
  { id: "dsa", label: "DSA Practice", caption: "code, run, get feedback", to: "/dsa-practice", position: [1.5, 1.05, -0.35], labelOffset: [0, 0.5, 0] },
  { id: "exams", label: "Exam Countdown", caption: "stay ahead of deadlines", to: "/exam-countdown", position: [1.45, 0.78, 0.62] },
];
