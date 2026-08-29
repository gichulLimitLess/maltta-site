"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "퀴즈" },
  { href: "/review", label: "복습 노트" },
  { href: "/edit", label: "문항 수정" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname.startsWith("/login")) return null;

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-extrabold tracking-tight">말따먹기 암기 퀴즈</h1>
        <button onClick={logout} className="text-xs font-semibold text-sub underline">
          로그아웃
        </button>
      </div>
      <nav className="mt-3 flex overflow-hidden rounded-[10px] border border-line bg-white">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex-1 py-2 text-center text-sm font-bold text-sub",
              pathname === l.href && "bg-navy text-white"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
