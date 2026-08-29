"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SECTION_NAMES, type Question } from "@/lib/types";

export default function EditPage() {
  const supabase = useMemo(() => createClient(), []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("questions").select("*").order("id");
      setQuestions((data as Question[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const list = useMemo(() => {
    let base =
      section === "all"
        ? questions
        : questions.filter((q) => q.section === Number(section));
    const s = search.trim();
    if (!s) return base;
    return base.filter(
      (q) =>
        q.prompt.includes(s) || q.answer.includes(s) || q.label === s
    );
  }, [questions, search, section]);

  function startEdit(q: Question) {
    setEditingId(q.id);
    setDraftPrompt(q.prompt);
    setDraftAnswer(q.answer);
    setSavedId(null);
  }

  async function save() {
    if (editingId === null) return;
    setSaving(true);
    const { error } = await supabase
      .from("questions")
      .update({
        prompt: draftPrompt.trim(),
        answer: draftAnswer.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId);
    setSaving(false);
    if (error) {
      alert("저장 실패: " + error.message);
      return;
    }
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === editingId
          ? { ...q, prompt: draftPrompt.trim(), answer: draftAnswer.trim() }
          : q
      )
    );
    setSavedId(editingId);
    setEditingId(null);
  }

  if (loading)
    return <p className="mt-20 text-center text-sm text-sub">불러오는 중…</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-sub [word-break:keep-all]">
        지문·정답에 오류가 있으면 여기서 바로 수정하세요. 저장하면 즉시 모든 기기에 반영됩니다.
      </p>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="지문·정답·번호로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="rounded-[10px] border border-line bg-white px-2.5 py-2 text-sm font-semibold"
        >
          <option value="all">전체 구간</option>
          {Object.entries(SECTION_NAMES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-xs font-semibold text-sub">{list.length}개 문항</p>

      <div className="flex flex-col gap-2">
        {list.map((q) => (
          <Card key={q.id} className="p-3.5">
            {editingId === q.id ? (
              <div className="flex flex-col gap-2.5">
                <Badge>{SECTION_NAMES[q.section]} · {q.label}번</Badge>
                <div>
                  <p className="mb-1 text-xs font-extrabold text-sub">지문</p>
                  <Textarea
                    className="min-h-[60px]"
                    value={draftPrompt}
                    onChange={(e) => setDraftPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-extrabold text-sub">정답</p>
                  <Textarea
                    className="min-h-[80px]"
                    value={draftAnswer}
                    onChange={(e) => setDraftAnswer(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={save} disabled={saving}>
                    {saving ? "저장 중…" : "저장"}
                  </Button>
                  <Button size="sm" onClick={() => setEditingId(null)}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge>{SECTION_NAMES[q.section]}</Badge>
                    {savedId === q.id && (
                      <span className="text-xs font-bold text-correct">저장됨 ✓</span>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-relaxed [word-break:keep-all]">
                    <span className="mr-1 text-navy">{q.label}.</span>
                    {q.prompt}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-sub [word-break:keep-all]">
                    {q.answer}
                  </p>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => startEdit(q)}>
                  수정
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
