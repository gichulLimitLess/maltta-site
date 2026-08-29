import { cn } from "@/lib/utils";
import * as React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[88px] rounded-[10px] border-[1.5px] border-line bg-[#FDFDFB] p-3 text-[0.95rem] leading-relaxed text-ink resize-y focus:outline-none focus:border-navy",
          className
        )}
        {...props}
      />
    );
  }
);
