import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-[10px] border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-navy",
          className
        )}
        {...props}
      />
    );
  }
);
