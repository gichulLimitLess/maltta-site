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

  // 새 문항 추가
  const [adding, setAdding] = useState(false);
  const [newSection, setNewSection] = useState("0");
  const [newLabel, setNewLabel] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [creating, setCreating] = useState(false);

  // 선택 삭제
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("questions").select("*").order("id");
      setQuestions((data as Question[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const list = useMemo(() => {
    const base =
      section === "all"
        ? questions
        : questions.filter((q) => q.section === Number(section));
    const s = search.trim();
    if (!s) return base;
    return base.filter(
      (q) => q.prompt.includes(s) || q.answer.includes(s) || q.label === s
    );
  }, [questions, search, section]);

  // 필터가 바뀌면 선택을 비운다.
  // 보이지 않는 문항이 선택된 채로 남아 실수로 삭제되는 것을 막기 위함.
  useEffect(() => {
    setSelected(new Set());
    setConfirmingDelete(false);
  }, [search, section]);

  const allSelected = list.length > 0 && list.every((q) => selected.has(q.id));

  function toggleOne(id: number) {
    setConfirmingDelete(false);
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setConfirmingDelete(false);
    setSelected(allSelected ? new Set() : new Set(list.map((q) => q.id)));
  }

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
      setError("저장 실패: " + error.message);
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

  function resetNewForm() {
    setNewLabel("");
    setNewPrompt("");
    setNewAnswer("");
  }

  async function create() {
    const label = newLabel.trim();
    const prompt = newPrompt.trim();
    const answer = newAnswer.trim();
    if (!label || !prompt || !answer) {
      setError("번호·지문·정답을 모두 입력해 주세요.");
      return;
    }
    setError(null);
    setCreating(true);
    // id는 넘기지 않는다. DB의 identity가 다음 번호를 부여한다.
    const { data, error } = await supabase
      .from("questions")
      .insert({ section: Number(newSection), label, prompt, answer })
      .select()
      .single();
    setCreating(false);
    if (error) {
      setError("추가 실패: " + error.message);
      return;
    }
    setQuestions((qs) => [...qs, data as Question].sort((a, b) => a.id - b.id));
    resetNewForm();
    setSavedId((data as Question).id);
  }

  async function removeSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setDeleting(true);
    const { error } = await supabase.from("questions").delete().in("id", ids);
    setDeleting(false);
    if (error) {
      setError("삭제 실패: " + error.message);
      return;
    }
    setQuestions((qs) => qs.filter((q) => !selected.has(q.id)));
    setSelected(new Set());
    setConfirmingDelete(false);
    setError(null);
  }

  if (loading)
    return <p className="mt-20 text-center text-sm text-sub">불러오는 중…</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-sub [word-break:keep-all]">
        지문·정답에 오류가 있으면 여기서 바로 수정하세요. 저장하면 즉시 모든 기기에 반영됩니다.
      </p>

      {error && (
        <div className="mb-3 rounded-[10px] border-[1.5px] border-wrong bg-wrong-soft px-3 py-2">
          <p className="text-xs font-bold text-wrong [word-break:keep-all]">{error}</p>
        </div>
      )}

      {/* 새 문항 추가 */}
      {adding ? (
        <Card className="mb-4 p-3.5">
          <p className="mb-2.5 text-xs font-extrabold text-sub">새 문항 추가</p>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                className="rounded-[10px] border border-line bg-white px-2.5 py-2 text-sm font-semibold"
              >
                {Object.entries(SECTION_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <Input
                placeholder="번호 표기 (예: 3-1)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-extrabold text-sub">지문</p>
              <Textarea
                className="min-h-[60px]"
                placeholder="문제 지문을 입력하세요"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-extrabold text-sub">정답</p>
              <Textarea
                className="min-h-[80px]"
                placeholder="정답을 입력하세요"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={create} disabled={creating}>
                {creating ? "추가 중…" : "추가"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setAdding(false);
                  resetNewForm();
                  setError(null);
                }}
              >
                닫기
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          size="sm"
          variant="primary"
          className="mb-4"
          onClick={() => {
            setAdding(true);
            setError(null);
          }}
        >
          + 새 문항 추가
        </Button>
      )}

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

      {/* 선택 / 삭제 바 */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer accent-navy"
          />
          <span className="text-xs font-semibold text-sub">전체 선택</span>
        </label>
        <span className="text-xs font-semibold text-sub">{list.length}개 문항</span>
        {selected.size > 0 && (
          <span className="text-xs font-bold text-navy">{selected.size}개 선택됨</span>
        )}
        {selected.size > 0 &&
          (confirmingDelete ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-wrong [word-break:keep-all]">
                {selected.size}개 문항을 삭제할까요? 해당 문항의 체크 기록도 함께 사라지며 되돌릴 수 없습니다.
              </span>
              <Button size="sm" variant="danger" onClick={removeSelected} disabled={deleting}>
                {deleting ? "삭제 중…" : "삭제"}
              </Button>
              <Button size="sm" onClick={() => setConfirmingDelete(false)}>
                취소
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>
              선택 삭제
            </Button>
          ))}
      </div>

      <div className="flex flex-col gap-2">
        {list.map((q) => (
          <Card key={q.id} className="p-3.5">
            {editingId === q.id ? (
              <div className="flex flex-col gap-2.5">
                <Badge>
                  {SECTION_NAMES[q.section]} · {q.label}번
                </Badge>
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
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(q.id)}
                  onChange={() => toggleOne(q.id)}
                  aria-label={`${q.label}번 선택`}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-navy"
                />
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
