import { cn } from "@/lib/utils";
import * as React from "react";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-block rounded-md bg-navy-soft px-2.5 py-0.5 text-[0.72rem] font-extrabold tracking-wide text-navy",
        className
      )}
      {...props}
    />
  );
}
