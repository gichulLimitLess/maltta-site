import { cn } from "@/lib/utils";
import * as React from "react";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white border border-line rounded-card p-4 sm:p-5 shadow-[0_1px_3px_rgba(32,36,43,0.05)]",
        className
      )}
      {...props}
    />
  );
}
