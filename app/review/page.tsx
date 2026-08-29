"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SECTION_NAMES, type MarkStatus, type Question } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "wrong" | "unsure" | "correct" | "attempted" | "unmarked";

const FILTERS: { key: Filter; label: string; cls: string }[] = [
  { key: "wrong", label: "✕ 모름", cls: "data-[on=true]:bg-wrong data-[on=true]:border-wrong" },
  { key: "unsure", label: "△ 애매", cls: "data-[on=true]:bg-unsure data-[on=true]:border-unsure" },
  { key: "correct", label: "○ 정답", cls: "data-[on=true]:bg-correct data-[on=true]:border-correct" },
  { key: "attempted", label: "풀었던 전체", cls: "data-[on=true]:bg-navy data-[on=true]:border-navy" },
  { key: "unmarked", label: "미체크", cls: "data-[on=true]:bg-sub data-[on=true]:border-sub" },
];

const MARK_BTN: { key: MarkStatus; label: string; on: string }[] = [
  { key: "wrong", label: "✕", on: "bg-wrong border-wrong text-white" },
  { key: "unsure", label: "△", on: "bg-unsure border-unsure text-white" },
  { key: "correct", label: "○", on: "bg-correct border-correct text-white" },
];

export default function ReviewPage() {
  const supabase = useMemo(() => createClient(), []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [marks, setMarks] = useState<Record<number, MarkStatus>>({});
  const [filter, setFilter] = useState<Filter>("wrong");
  const [section, setSection] = useState<string>("all");
  const [openAnswers, setOpenAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: qs }, { data: ms }, { data: auth }] = await Promise.all([
        supabase.from("questions").select("*").order("id"),
        supabase.from("marks").select("*"),
        supabase.auth.getUser(),
      ]);
      setUserId(auth.user?.id ?? null);
      setQuestions((qs as Question[]) ?? []);
      const m: Record<number, MarkStatus> = {};
      (ms ?? []).forEach((r: { question_id: number; status: MarkStatus }) => {
        m[r.question_id] = r.status;
      });
      setMarks(m);
      setLoading(false);
    })();
  }, [supabase]);

  async function setMark(qid: number, status: MarkStatus) {
    if (!userId) return;
    const prev = marks[qid];
    if (prev === status) {
      setMarks((m) => {
        const n = { ...m };
        delete n[qid];
        return n;
      });
      await supabase.from("marks").delete().eq("question_id", qid);
    } else {
      setMarks((m) => ({ ...m, [qid]: status }));
      await supabase
        .from("marks")
        .upsert(
          {
            user_id: userId,
            question_id: qid,
            status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" }
        );
    }
  }

  const list = useMemo(() => {
    let base =
      section === "all"
        ? questions
        : questions.filter((q) => q.section === Number(section));
    switch (filter) {
      case "attempted":
        return base.filter((q) => marks[q.id]);
      case "unmarked":
        return base.filter((q) => !marks[q.id]);
      default:
        return base.filter((q) => marks[q.id] === filter);
    }
  }, [questions, marks, filter, section]);

  const counts = useMemo(() => {
    const base =
      section === "all"
        ? questions
        : questions.filter((q) => q.section === Number(section));
    const c: Record<Filter, number> = { wrong: 0, unsure: 0, correct: 0, attempted: 0, unmarked: 0 };
    base.forEach((q) => {
      const s = marks[q.id];
      if (s) {
        c[s]++;
        c.attempted++;
      } else c.unmarked++;
    });
    return c;
  }, [questions, marks, section]);

  if (loading)
    return <p className="mt-20 text-center text-sm text-sub">불러오는 중…</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            data-on={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border-[1.5px] border-line bg-white px-3 py-1.5 text-xs font-bold text-sub transition-colors data-[on=true]:text-white",
              f.cls
            )}
          >
            {f.label} {counts[f.key]}
          </button>
        ))}
      </div>

      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="mb-4 w-full rounded-[10px] border border-line bg-white px-2.5 py-2 text-sm font-semibold sm:w-auto"
      >
        <option value="all">전체 구간</option>
        {Object.entries(SECTION_NAMES).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-sm text-sub">해당하는 문제가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((q) => (
            <Card key={q.id} className="p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {/* 왼쪽: 정답 (클릭 시 공개) */}
                <button
                  onClick={() => setOpenAnswers((o) => ({ ...o, [q.id]: !o[q.id] }))}
                  className="relative shrink-0 rounded-[10px] border border-dashed border-navy bg-navy-soft px-3 py-2.5 text-left sm:w-[45%]"
                >
                  <p
                    className={cn(
                      "whitespace-pre-wrap text-sm font-semibold transition-all [word-break:keep-all]",
                      !openAnswers[q.id] && "select-none blur-[6px]"
                    )}
                  >
                    {q.answer}
                  </p>
                  {!openAnswers[q.id] && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-navy">
                      눌러서 정답 보기
                    </span>
                  )}
                </button>
                {/* 오른쪽: 번호 + 지문 */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge>{SECTION_NAMES[q.section]}</Badge>
                    <div className="flex gap-1">
                      {MARK_BTN.map((b) => (
                        <button
                          key={b.key}
                          onClick={() => setMark(q.id, b.key)}
                          className={cn(
                            "h-6 w-6 rounded-md border-[1.5px] border-line bg-white text-xs font-bold text-sub",
                            marks[q.id] === b.key && b.on
                          )}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-bold leading-relaxed [word-break:keep-all]">
                    <span className="mr-1 text-navy">{q.label}.</span>
                    {q.prompt}
                  </p>
                  <Link
                    href={`/?q=${q.id}`}
                    className="mt-1.5 inline-block text-xs font-bold text-navy underline"
                  >
                    이 문제 풀기 →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
