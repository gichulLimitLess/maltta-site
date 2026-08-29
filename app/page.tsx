"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SECTION_NAMES, type MarkStatus, type Question } from "@/lib/types";
import { cn } from "@/lib/utils";

const MARK_BTN: { key: MarkStatus; label: string; on: string }[] = [
  { key: "wrong", label: "✕ 모름", on: "bg-wrong border-wrong text-white" },
  { key: "unsure", label: "△ 애매", on: "bg-unsure border-unsure text-white" },
  { key: "correct", label: "○ 정답", on: "bg-correct border-correct text-white" },
];

function QuizInner() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [marks, setMarks] = useState<Record<number, MarkStatus>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [section, setSection] = useState<string>("all");
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const restored = useRef(false);

  // 데이터 로드
  useEffect(() => {
    (async () => {
      const [{ data: qs }, { data: ms }, { data: st }, { data: auth }] = await Promise.all([
        supabase.from("questions").select("*").order("id"),
        supabase.from("marks").select("*"),
        supabase.from("app_state").select("*").eq("key", "position").maybeSingle(),
        supabase.auth.getUser(),
      ]);
      setUserId(auth.user?.id ?? null);
      setQuestions((qs as Question[]) ?? []);
      const m: Record<number, MarkStatus> = {};
      (ms ?? []).forEach((r: { question_id: number; status: MarkStatus }) => {
        m[r.question_id] = r.status;
      });
      setMarks(m);

      // 위치 복원: URL ?q= 우선, 없으면 저장된 위치
      const jump = searchParams.get("q");
      if (jump) {
        const all = (qs as Question[]) ?? [];
        const target = all.find((q) => q.id === Number(jump));
        if (target) {
          setSection("all");
          setIdx(all.findIndex((q) => q.id === target.id));
          restored.current = true;
        }
      } else if (st?.value) {
        const v = st.value as { section?: string; idx?: number };
        if (v.section !== undefined) setSection(v.section);
        if (v.idx !== undefined) setIdx(v.idx);
        restored.current = true;
      }
      setLoading(false);
    })();
  }, [supabase, searchParams]);

  const filtered = useMemo(
    () =>
      section === "all"
        ? questions
        : questions.filter((q) => q.section === Number(section)),
    [questions, section]
  );

  const cur = filtered[Math.min(idx, Math.max(filtered.length - 1, 0))];

  // 위치 자동 저장 (디바운스)
  useEffect(() => {
    if (loading || !userId) return;
    const t = setTimeout(() => {
      supabase
        .from("app_state")
        .upsert(
          {
            user_id: userId,
            key: "position",
            value: { section, idx },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,key" }
        )
        .then(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [section, idx, loading, supabase, userId]);

  const move = useCallback(
    (d: number) => {
      setIdx((i) => Math.min(Math.max(i + d, 0), filtered.length - 1));
      setRevealed(false);
      setInput("");
    },
    [filtered.length]
  );

  // 키보드 ←/→
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  async function toggleMark(status: MarkStatus) {
    if (!cur || !userId) return;
    const prev = marks[cur.id];
    if (prev === status) {
      setMarks((m) => {
        const n = { ...m };
        delete n[cur.id];
        return n;
      });
      await supabase.from("marks").delete().eq("question_id", cur.id);
    } else {
      setMarks((m) => ({ ...m, [cur.id]: status }));
      await supabase
        .from("marks")
        .upsert(
          {
            user_id: userId,
            question_id: cur.id,
            status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" }
        );
    }
  }

  function changeSection(v: string) {
    setSection(v);
    setIdx(0);
    setRevealed(false);
    setInput("");
    router.replace("/"); // ?q= 제거
  }

  const counts = useMemo(() => {
    const c = { wrong: 0, unsure: 0, correct: 0 };
    Object.values(marks).forEach((s) => c[s]++);
    return c;
  }, [marks]);

  if (loading)
    return <p className="mt-20 text-center text-sm text-sub">불러오는 중…</p>;
  if (!cur)
    return <p className="mt-20 text-center text-sm text-sub">문항이 없습니다.</p>;

  const total = questions.length;

  return (
    <div>
      {/* 진행 현황 */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-bold">
          전체 {total}
        </span>
        <span className="rounded-full bg-wrong-soft px-2.5 py-0.5 text-xs font-bold text-wrong">
          모름 {counts.wrong}
        </span>
        <span className="rounded-full bg-unsure-soft px-2.5 py-0.5 text-xs font-bold text-unsure">
          애매 {counts.unsure}
        </span>
        <span className="rounded-full bg-correct-soft px-2.5 py-0.5 text-xs font-bold text-correct">
          정답 {counts.correct}
        </span>
      </div>
      <div className="mb-3 flex h-1.5 overflow-hidden rounded-full bg-line">
        <div className="bg-wrong" style={{ width: `${(counts.wrong / total) * 100}%` }} />
        <div className="bg-unsure" style={{ width: `${(counts.unsure / total) * 100}%` }} />
        <div className="bg-correct" style={{ width: `${(counts.correct / total) * 100}%` }} />
      </div>

      {/* 구간 선택 */}
      <select
        value={section}
        onChange={(e) => changeSection(e.target.value)}
        className="mb-3 w-full rounded-[10px] border border-line bg-white px-2.5 py-2 text-sm font-semibold sm:w-auto"
      >
        <option value="all">전체 구간</option>
        {Object.entries(SECTION_NAMES).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-2">
          <Badge>{SECTION_NAMES[cur.section]}</Badge>
          <span className="mt-0.5 text-xs font-semibold text-sub">
            {idx + 1} / {filtered.length}
          </span>
        </div>

        <div className="mb-4 flex items-start gap-3">
          <p className="flex-1 text-[1.02rem] font-bold leading-relaxed [word-break:keep-all]">
            <span className="mr-1.5 text-navy">{cur.label}.</span>
            {cur.prompt}
          </p>
          <div className="flex shrink-0 flex-col gap-1.5">
            {MARK_BTN.map((b) => (
              <button
                key={b.key}
                onClick={() => toggleMark(b.key)}
                className={cn(
                  "whitespace-nowrap rounded-lg border-[1.5px] border-line bg-white px-2.5 py-1 text-xs font-bold text-sub transition-colors",
                  marks[cur.id] === b.key && b.on
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          placeholder="답을 직접 입력해 보세요 (Enter = 정답 확인)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setRevealed(true);
            }
          }}
        />

        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={() => move(-1)} disabled={idx === 0}>
            ← 이전
          </Button>
          <Button className="flex-[2]" variant="primary" onClick={() => setRevealed((r) => !r)}>
            {revealed ? "정답 가리기" : "정답 확인"}
          </Button>
          <Button className="flex-1" onClick={() => move(1)} disabled={idx === filtered.length - 1}>
            다음 →
          </Button>
        </div>

        {revealed && (
          <div className="mt-4 rounded-[10px] border-[1.5px] border-dashed border-navy bg-navy-soft px-3.5 py-3">
            <p className="mb-1 text-[0.72rem] font-extrabold tracking-wider text-navy">정답</p>
            <p className="whitespace-pre-wrap text-[0.95rem] font-semibold [word-break:keep-all]">
              {cur.answer}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<p className="mt-20 text-center text-sm text-sub">불러오는 중…</p>}>
      <QuizInner />
    </Suspense>
  );
}
