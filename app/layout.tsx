import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "말따먹기 암기 퀴즈 — 토목기사 실기",
  description: "토목기사 실기 용어 서술형 암기 퀴즈",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto max-w-[820px] px-3.5 pb-16 pt-4">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
