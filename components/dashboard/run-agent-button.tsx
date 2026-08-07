"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; drafted: number; provider?: string; message?: string }
  | { kind: "error"; message: string };

export function RunAgentButton({ hasActiveSops }: { hasActiveSops: boolean }) {
  const router = useRouter();
  const [result, setResult] = useState<Result>({ kind: "idle" });

  async function run() {
    setResult({ kind: "loading" });
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "Something went wrong" });
        return;
      }

      setResult({
        kind: "success",
        drafted: data.drafted ?? 0,
        provider: data.provider,
        message: data.message,
      });
      router.refresh();
    } catch {
      setResult({ kind: "error", message: "Couldn't reach the agent — check your connection" });
    }
  }

  return (
    <div>
      <Button
        onClick={run}
        disabled={!hasActiveSops || result.kind === "loading"}
        variant="secondary"
      >
        <Sparkles size={14} />
        {result.kind === "loading" ? "Checking your SOPs…" : "Run Lead Agent now"}
      </Button>

      {result.kind === "success" && (
        <p className="mt-2 text-xs text-ink-soft">
          {result.drafted > 0 ? (
            <>
              Drafted {result.drafted} item{result.drafted > 1 ? "s" : ""} —{" "}
              <Link href="/dashboard/approvals" className="text-brass-dark underline">
                review in Approvals
              </Link>
              .
            </>
          ) : (
            (result.message ?? "Nothing currently matches your SOPs.")
          )}
        </p>
      )}

      {result.kind === "error" && (
        <p className="mt-2 text-xs text-attention">{result.message}</p>
      )}

      {!hasActiveSops && (
        <p className="mt-2 text-xs text-ink-soft">
          Add an active{" "}
          <Link href="/dashboard/sops" className="text-brass-dark underline">
            standing instruction
          </Link>{" "}
          first.
        </p>
      )}
    </div>
  );
}
