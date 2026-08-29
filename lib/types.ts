export type MarkStatus = "wrong" | "unsure" | "correct";

export interface Question {
  id: number;
  section: number;
  label: string;
  prompt: string;
  answer: string;
}

export const SECTION_NAMES: Record<number, string> = {
  0: "기출 정리 ① (연도 미표기)",
  1: "기출 정리 ② (연도 미표기)",
  2: "14~18년도",
  3: "19~23년도",
};

export const MARK_LABEL: Record<MarkStatus, string> = {
  wrong: "✕ 모름",
  unsure: "△ 애매",
  correct: "○ 정답",
};
