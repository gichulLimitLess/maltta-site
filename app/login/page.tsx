"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("로그인 실패: 이메일 또는 비밀번호를 확인해 주세요.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-1 text-center text-xl font-extrabold">말따먹기 암기 퀴즈</h1>
      <p className="mb-5 text-center text-sm text-sub">토목기사 실기 · 용어 서술형</p>
      <Card>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-xs font-semibold text-wrong">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "확인 중…" : "로그인"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
