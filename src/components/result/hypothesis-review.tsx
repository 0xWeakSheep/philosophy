"use client";

import {
  ArrowCounterClockwise,
  CheckCircle,
  MapPinArea,
  Question,
  XCircle,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { Hypothesis, HypothesisStance, MirrorSession } from "@/components/session/types";
import { unwrapSession } from "@/components/session/types";

interface HypothesisReviewProps {
  sessionId: string;
  hypotheses: Hypothesis[];
  onSessionChange: (session: MirrorSession) => void;
}

const stanceOptions = [
  { value: "resonates", label: "像我", Icon: CheckCircle },
  { value: "rejects", label: "不像", Icon: XCircle },
  { value: "situational", label: "只在这里", Icon: MapPinArea },
  { value: "counterexample", label: "有反例", Icon: ArrowCounterClockwise },
] as const satisfies ReadonlyArray<{
  value: HypothesisStance;
  label: string;
  Icon: typeof CheckCircle;
}>;

export function HypothesisReview({
  sessionId,
  hypotheses,
  onSessionChange,
}: HypothesisReviewProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function submitStance(hypothesisId: string, stance: HypothesisStance, note?: string) {
    if (stance === "counterexample" && !note?.trim()) {
      setOpenNote(hypothesisId);
      return;
    }

    setPending(hypothesisId);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/stance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesisId, stance, note: note?.trim() || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error("保存失败");
      onSessionChange(unwrapSession(payload));
      setOpenNote(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败");
    } finally {
      setPending(null);
    }
  }

  return (
    <section aria-labelledby="hypothesis-title" className="mt-9">
      <h2 id="hypothesis-title" className="font-serif text-2xl">
        三条临时读法
      </h2>

      <div className="mt-5 border-t border-[var(--line)]">
        {hypotheses.map((hypothesis, index) => (
          <article key={hypothesis.id} className="border-b border-[var(--line)] py-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <p className="mono-label text-[9px] text-[var(--accent)]">0{index + 1}</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight">{hypothesis.title}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  {hypothesis.interpretation}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-1.5 lg:w-[21rem]">
                {stanceOptions.map(({ value, label, Icon }) => {
                  const selected = hypothesis.stance === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => void submitStance(hypothesis.id, value)}
                      disabled={pending === hypothesis.id}
                      className={`inline-flex min-h-11 items-center justify-center gap-1 border px-1 text-[11px] ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                          : "border-[var(--line)] hover:border-[var(--accent)]"
                      }`}
                      aria-pressed={selected}
                    >
                      <Icon aria-hidden="true" size={14} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {hypothesis.stanceNote ? (
              <p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-sm">
                {hypothesis.stanceNote}
              </p>
            ) : null}

            <details className="mt-4 text-sm">
              <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[var(--muted)]">
                <Question aria-hidden="true" size={15} /> 查看原话依据
              </summary>
              <div className="grid gap-5 pb-2 pt-3 sm:grid-cols-2">
                <div className="space-y-2">
                  {hypothesis.evidence.map((evidence) => (
                    <blockquote
                      key={evidence.id}
                      className="border-l border-[var(--accent)] pl-3 text-[var(--muted)]"
                    >
                      “{evidence.quote}”
                    </blockquote>
                  ))}
                </div>
                <div className="space-y-2">
                  {hypothesis.counterEvidence.map((evidence) => (
                    <blockquote
                      key={evidence.id}
                      className="border-l border-[var(--line)] pl-3 text-[var(--muted)]"
                    >
                      “{evidence.quote}”
                    </blockquote>
                  ))}
                </div>
              </div>
            </details>

            {openNote === hypothesis.id ? (
              <form
                className="mt-4 max-w-2xl border-l-2 border-[var(--accent)] pl-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitStance(hypothesis.id, "counterexample", notes[hypothesis.id]);
                }}
              >
                <label htmlFor={`counterexample-${hypothesis.id}`} className="text-sm">
                  写下反例
                </label>
                <textarea
                  id={`counterexample-${hypothesis.id}`}
                  value={notes[hypothesis.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [hypothesis.id]: event.target.value }))
                  }
                  rows={2}
                  maxLength={600}
                  className="mt-2 w-full border border-[var(--line)] bg-transparent p-3 outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={!notes[hypothesis.id]?.trim() || pending === hypothesis.id}
                  className="mt-2 min-h-11 bg-[var(--ink)] px-5 text-sm text-[var(--paper)] disabled:opacity-45"
                >
                  保存反例
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[var(--accent)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
