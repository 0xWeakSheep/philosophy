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

const stanceOptions: Array<{
  value: HypothesisStance;
  label: string;
  Icon: typeof CheckCircle;
}> = [
  { value: "resonates", label: "像我", Icon: CheckCircle },
  { value: "rejects", label: "不像", Icon: XCircle },
  { value: "situational", label: "只在这里", Icon: MapPinArea },
  { value: "counterexample", label: "我有反例", Icon: ArrowCounterClockwise },
];

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
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "这次修正没有保存成功");
      }
      onSessionChange(unwrapSession(payload));
      setOpenNote(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败，请再试一次");
    } finally {
      setPending(null);
    }
  }

  return (
    <section aria-labelledby="hypothesis-title" className="mt-16 sm:mt-24">
      <div className="max-w-3xl">
        <h2 id="hypothesis-title" className="font-serif text-3xl leading-tight sm:text-4xl">
          这些只是读法，不是判决
        </h2>
        <p className="mt-4 leading-relaxed text-[var(--muted)]">
          每条读法都必须回到你说过的话。反驳它，会让镜面比“同意”更清楚。
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {hypotheses.map((hypothesis, index) => (
          <article
            key={hypothesis.id}
            className={`border border-[var(--line)] bg-[var(--paper-deep)] p-5 sm:p-7 ${index % 2 === 1 ? "lg:translate-y-8" : ""}`}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-xs tracking-[0.12em] text-[var(--accent)]">
                  可能的读法
                </p>
                <h3 className="mt-3 font-serif text-2xl leading-tight">{hypothesis.title}</h3>
              </div>
              {hypothesis.stance !== "unreviewed" ? (
                <span className="border border-[var(--line)] px-2.5 py-1 font-mono text-[10px] text-[var(--muted)]">
                  已被你修正
                </span>
              ) : null}
            </div>

            <p className="mt-5 leading-relaxed text-[var(--muted)]">{hypothesis.interpretation}</p>

            {hypothesis.stanceNote ? (
              <div className="mt-5 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3">
                <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--accent)]">
                  你补上的反例
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
                  {hypothesis.stanceNote}
                </p>
              </div>
            ) : null}

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-[var(--ink)]">它依据了什么</p>
                <div className="mt-3 space-y-3">
                  {hypothesis.evidence.map((evidence) => (
                    <blockquote
                      key={evidence.id}
                      className="border-l border-[var(--accent)] pl-3 text-sm leading-relaxed text-[var(--muted)]"
                    >
                      “{evidence.quote}”
                    </blockquote>
                  ))}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-medium text-[var(--ink)]">
                  <Question aria-hidden="true" size={15} /> 哪里可能看错
                </p>
                {hypothesis.counterEvidence.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {hypothesis.counterEvidence.map((evidence) => (
                      <blockquote
                        key={evidence.id}
                        className="border-l border-[var(--line)] pl-3 text-sm leading-relaxed text-[var(--muted)]"
                      >
                        “{evidence.quote}”
                      </blockquote>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    目前没有足够反证。你可以主动补上一条。
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stanceOptions.map(({ value, label, Icon }) => {
                const selected = hypothesis.stance === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => submitStance(hypothesis.id, value)}
                    disabled={pending === hypothesis.id}
                    className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 border px-2 text-xs transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-55 ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]"
                        : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <Icon aria-hidden="true" size={15} /> {label}
                  </button>
                );
              })}
            </div>

            {openNote === hypothesis.id ? (
              <form
                className="mt-5 border-l-2 border-[var(--accent)] pl-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitStance(hypothesis.id, "counterexample", notes[hypothesis.id]);
                }}
              >
                <label htmlFor={`counterexample-${hypothesis.id}`} className="text-sm font-medium">
                  写下那个反例
                </label>
                <textarea
                  id={`counterexample-${hypothesis.id}`}
                  value={notes[hypothesis.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [hypothesis.id]: event.target.value }))
                  }
                  rows={3}
                  maxLength={600}
                  className="mt-2 w-full resize-y border border-[var(--line)] bg-transparent p-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  placeholder="什么时候，同样的事情并没有让你这样理解？"
                />
                <button
                  type="submit"
                  disabled={!notes[hypothesis.id]?.trim() || pending === hypothesis.id}
                  className="mt-3 min-h-11 cursor-pointer bg-[var(--ink)] px-5 text-sm text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  把反例放进镜面
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>

      {error ? (
        <p className="mt-6 text-sm text-[var(--accent)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
