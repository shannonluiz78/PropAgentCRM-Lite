import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Tone = "success" | "pending" | "attention" | "info" | "neutral";

const tones: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  pending: "bg-pending/10 text-pending",
  attention: "bg-attention/10 text-attention",
  info: "bg-info/10 text-info",
  neutral: "bg-ink/5 text-ink-soft",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
