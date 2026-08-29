import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] text-sm font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-navy text-white hover:bg-navy/90",
        ghost: "border-[1.5px] border-line bg-white text-ink hover:bg-navy-soft",
        danger: "border-[1.5px] border-wrong text-wrong bg-white hover:bg-wrong-soft",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "px-3 py-1.5 text-xs",
      },
    },
    defaultVariants: { variant: "ghost", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
