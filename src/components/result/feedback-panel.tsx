"use client";

import { Check, X } from "@phosphor-icons/react";
import { type FormEvent, useState } from "react";

interface FeedbackPanelProps {
  sessionId: string;
}

export function FeedbackPanel({ sessionId }: FeedbackPanelProps) {
  const [structureDiscovery, setStructureDiscovery] = useState<boolean | null>(null);
  const [feltLabeled, setFeltLabeled] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (structureDiscovery === null || feltLabeled === null) return;
    setStatus("saving");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureDiscovery, feltLabeled, note: note.trim() || undefined }),
      });
      setStatus(response.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "saved") {
    return (
      <section className="py-8 text-center" aria-live="polite">
        <Check className="mx-auto text-[var(--accent)]" aria-hidden="true" size={26} />
        <p className="mt-3 font-serif text-2xl">已收到</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="feedback-title" className="py-8">
      <form onSubmit={submitFeedback} className="mx-auto max-w-3xl">
        <h2 id="feedback-title" className="sr-only">
          反馈
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ChoiceQuestion
            label="它有没有帮你看见一点问题结构？"
            value={structureDiscovery}
            onChange={setStructureDiscovery}
          />
          <ChoiceQuestion
            label="它有没有让你感觉被贴了标签？"
            value={feltLabeled}
            onChange={setFeltLabeled}
          />
        </div>
        <label htmlFor="feedback-note" className="mt-6 block text-sm font-medium">
          补一句，可不填
        </label>
        <textarea
          id="feedback-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="mt-3 w-full resize-y border border-[var(--line)] bg-transparent p-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <div className="mt-5 flex items-center justify-between gap-4">
          <p
            className="text-sm text-[var(--accent)]"
            role={status === "error" ? "alert" : undefined}
          >
            {status === "error" ? "反馈没有保存成功，请再试一次" : ""}
          </p>
          <button
            type="submit"
            disabled={structureDiscovery === null || feltLabeled === null || status === "saving"}
            className="min-h-11 cursor-pointer bg-[var(--ink)] px-6 text-sm text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {status === "saving" ? "正在保存" : "提交反馈"}
          </button>
        </div>
      </form>
    </section>
  );
}

interface ChoiceQuestionProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

function ChoiceQuestion({ label, value, onChange }: ChoiceQuestionProps) {
  return (
    <fieldset>
      <legend className="text-sm leading-relaxed text-[var(--ink)]">{label}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border text-sm ${value === true ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]" : "border-[var(--line)]"}`}
          aria-pressed={value === true}
        >
          <Check aria-hidden="true" size={16} /> 有
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border text-sm ${value === false ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]" : "border-[var(--line)]"}`}
          aria-pressed={value === false}
        >
          <X aria-hidden="true" size={16} /> 没有
        </button>
      </div>
    </fieldset>
  );
}
