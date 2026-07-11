"use client";

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/ArrowCounterClockwise";
import { EyeIcon } from "@phosphor-icons/react/Eye";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const lenses = {
  cancellation: {
    label: "临时取消了约会",
    focus: "场域 · 默认规则",
    reading: "约定是否成立，可能被你用来判断自己有没有被重视。",
    question: "如果偶尔失约不等于不重视，你最担心失去的是什么？",
    alternative: "也可能不是你的解释出了问题，而是对方确实反复越过了一条关系边界。",
  },
  mature: {
    label: "成熟的人",
    focus: "本体 · 不可退让",
    reading: "“成熟”在这里不像描述，更像一条决定你能否认可自己的准入规则。",
    question: "如果成熟也允许生气，你担心自己会成为什么样的人？",
    alternative: "也可能你并非害怕不成熟，只是不愿让一时情绪替你决定关系的走向。",
  },
  should: {
    label: "不应该",
    focus: "现象 · 经验解释",
    reading: "“不应该”把已经发生的感受，迅速变成了一项需要被纠正的证据。",
    question: "生气先在保护一条边界，还是先证明你不够好？",
    alternative: "也可能它只是你当下用来暂停行动的方法，并不代表你否认自己的感受。",
  },
} as const;

type LensId = keyof typeof lenses;
type Verdict = "open" | "like" | "refute";

export function DevelopingDemo() {
  const [activeLens, setActiveLens] = useState<LensId>("mature");
  const [verdict, setVerdict] = useState<Verdict>("open");
  const reduceMotion = useReducedMotion();
  const lens = lenses[activeLens];

  function selectLens(nextLens: LensId) {
    setActiveLens(nextLens);
    setVerdict("open");
  }

  return (
    <section className="mirror-stage w-full" aria-label="一句话显影互动演示">
      <div className="flex min-h-14 items-center justify-between border-b hairline px-4 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <EyeIcon aria-hidden="true" size={18} weight="regular" />
          一句话显影器
        </div>
        <span className="mono-label text-[11px] text-[var(--muted)]">可点击原句</span>
      </div>

      <div className="p-5 sm:p-7">
        <p className="mb-3 text-xs text-[var(--muted)]">一件反复发生的事</p>
        <blockquote className="display-type text-[clamp(1.35rem,3vw,2rem)] leading-[1.65] tracking-[-0.025em]">
          他
          <button
            aria-pressed={activeLens === "cancellation"}
            className="demo-token"
            onClick={() => selectLens("cancellation")}
            type="button"
          >
            临时取消了约会
          </button>
          ，我很生气，但
          <button
            aria-pressed={activeLens === "mature"}
            className="demo-token"
            onClick={() => selectLens("mature")}
            type="button"
          >
            成熟的人
          </button>
          <button
            aria-pressed={activeLens === "should"}
            className="demo-token"
            onClick={() => selectLens("should")}
            type="button"
          >
            不应该
          </button>
          为这种事生气。
        </blockquote>
      </div>

      <div className="grid border-t hairline lg:grid-cols-[0.8fr_1.2fr]">
        <div className="border-b hairline p-5 lg:border-r lg:border-b-0 sm:p-6">
          <p className="mono-label text-[11px] text-[var(--accent)]">{lens.focus}</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">系统只提出读法，不宣布结论。</p>
        </div>

        <div className="min-h-[14.5rem] p-5 sm:p-6" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              key={`${activeLens}-${verdict}`}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
            >
              {verdict === "refute" ? (
                <>
                  <p className="text-xs font-medium text-[var(--accent)]">窗外的另一种可能</p>
                  <p className="mt-3 text-base leading-7">{lens.alternative}</p>
                  <p className="mt-4 border-l border-[var(--accent)] pl-3 text-sm leading-6 text-[var(--muted)]">
                    好的判断也要容纳你的反例，以及现实里的权力与边界。
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm leading-7">{lens.reading}</p>
                  <p className="mt-4 border-l border-[var(--accent)] pl-3 text-base font-medium leading-7">
                    {lens.question}
                  </p>
                  {verdict === "like" ? (
                    <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
                      已保留为临时假设。它仍需要你的下一句话来确认。
                    </p>
                  ) : null}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t hairline p-3 sm:px-5">
        <button
          aria-pressed={verdict === "like"}
          className="min-h-11 rounded-[10px] border border-[var(--line)] px-3 text-sm transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]"
          onClick={() => setVerdict("like")}
          type="button"
        >
          这个读法像我
        </button>
        <button
          aria-pressed={verdict === "refute"}
          className="min-h-11 rounded-[10px] border border-[var(--line)] px-3 text-sm transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]"
          onClick={() => setVerdict("refute")}
          type="button"
        >
          我有反例
        </button>
        <button
          aria-label="重置读法"
          className="ml-auto inline-flex size-11 items-center justify-center rounded-[10px] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onClick={() => setVerdict("open")}
          type="button"
        >
          <ArrowCounterClockwiseIcon aria-hidden="true" size={18} weight="regular" />
        </button>
      </div>
    </section>
  );
}
