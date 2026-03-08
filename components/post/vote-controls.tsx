"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";

import type { VoteValue } from "@/lib/types";
import { resolveVoteState, scoreDelta } from "@/lib/ranking";

interface VoteControlsProps {
  endpoint: string;
  initialScore: number;
  initialVote: VoteValue;
  isAuthenticated: boolean;
  orientation?: "vertical" | "horizontal";
}

export function VoteControls({
  endpoint,
  initialScore,
  initialVote,
  isAuthenticated,
  orientation = "vertical",
}: VoteControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState<VoteValue>(initialVote);

  const mutateVote = (incomingValue: -1 | 1) => {
    if (!isAuthenticated) {
      router.push("/auth/sign-in");
      return;
    }

    const nextVote = resolveVoteState(vote, incomingValue);
    const nextScore = score + scoreDelta(vote, nextVote);
    const previousScore = score;
    const previousVote = vote;
    setVote(nextVote);
    setScore(nextScore);

    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: incomingValue }),
      });

      if (!response.ok) {
        setVote(previousVote);
        setScore(previousScore);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div
      className={`inline-flex rounded-full border border-black/10 bg-[var(--panel)] p-1 shadow-sm ${
        orientation === "vertical" ? "flex-col items-center" : "items-center gap-1"
      }`}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => mutateVote(1)}
        className={`rounded-full p-1.5 transition ${
          vote === 1 ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
        }`}
      >
        <ArrowBigUp className="h-5 w-5" />
      </button>
      <span className="min-w-9 text-center text-sm font-semibold text-[var(--ink)]">{score}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => mutateVote(-1)}
        className={`rounded-full p-1.5 transition ${
          vote === -1
            ? "bg-[var(--highlight)] text-white"
            : "text-[var(--muted)] hover:text-[var(--ink)]"
        }`}
      >
        <ArrowBigDown className="h-5 w-5" />
      </button>
    </div>
  );
}
