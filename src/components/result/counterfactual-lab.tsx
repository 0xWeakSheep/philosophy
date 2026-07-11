"use client";

import { ArrowRight, ArrowsLeftRight } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type {
  CounterfactualExperiment,
  DimensionKey,
  DimensionSignal,
} from "@/components/session/types";
import { experimentLabel } from "@/components/session/types";

const dimensionNames: Record<DimensionKey, string> = {
  field: "换一条关系规则",
  ontology: "松动不可退让物",
  phenomenology: "允许另一种体验",
  teleology: "改变行动的指向",
};

interface CounterfactualLabProps {
  sessionId: string;
  dimensions: DimensionSignal[];
}

export function CounterfactualLab({ sessionId, dimensions }: CounterfactualLabProps) {
  const reduceMotion = useReducedMotion();
  const [experiment, setExperiment] = useState<CounterfactualExperiment | null>(null);
  const [pending, setPending] = useState<DimensionKey | null>(null);
  const [error, setError] = useState("");

  async function runExperiment(dimension: DimensionKey) {
    setPending(dimension);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/experiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dimension }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "思想实验没有生成成功");
      }
      setExperiment(payload.experiment as CounterfactualExperiment);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "暂时无法改变这面镜子");
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      aria-labelledby="experiment-title"
      className="mt-24 border-t border-[var(--line)] pt-12 sm:mt-32 sm:pt-16"
    >
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <ArrowsLeftRight
            className="text-[var(--accent)]"
            size={28}
            weight="light"
            aria-hidden="true"
          />
          <h2 id="experiment-title" className="mt-5 font-serif text-3xl leading-tight sm:text-4xl">
            只改变一个前提
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-[var(--muted)]">
            这不是更高级的位置。它只是让同一件事换一个角度，看看哪些东西会随之改变。
          </p>
          <div className="mt-7 grid gap-2">
            {dimensions.map((dimension) => (
              <button
                key={dimension.dimension}
                type="button"
                onClick={() => runExperiment(dimension.dimension)}
                disabled={pending !== null}
                className="group flex min-h-12 cursor-pointer items-center justify-between border-b border-[var(--line)] px-1 text-left text-sm transition-colors duration-200 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-50"
              >
                <span>{dimensionNames[dimension.dimension]}</span>
                <ArrowRight
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  size={17}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-80 border border-[var(--line)] bg-[var(--paper-deep)] p-5 sm:p-8">
          <AnimatePresence mode="wait">
            {experiment ? (
              <motion.div
                key={`${experiment.changedDimension}-${experiment.after}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                {...(reduceMotion ? {} : { exit: { opacity: 0, y: -8 } })}
                transition={{ duration: 0.32 }}
              >
                <p className="font-mono text-xs tracking-[0.12em] text-[var(--accent)]">一位之差</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <p className="text-xs text-[var(--muted)]">原来的前提</p>
                    <p className="mt-2 font-serif text-xl leading-snug">
                      {experimentLabel(experiment.before)}
                    </p>
                  </div>
                  <ArrowRight
                    className="rotate-90 text-[var(--accent)] sm:rotate-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs text-[var(--muted)]">临时换成</p>
                    <p className="mt-2 font-serif text-xl leading-snug">
                      {experimentLabel(experiment.after)}
                    </p>
                  </div>
                </div>
                <blockquote className="mt-9 border-l-2 border-[var(--accent)] pl-4 font-serif text-2xl leading-snug sm:text-3xl">
                  {experiment.prompt}
                </blockquote>
                <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
                  {experiment.observation}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={false}
                animate={{ opacity: 1 }}
                className="grid min-h-64 place-items-center text-center"
              >
                <div className="max-w-sm">
                  <p className="font-serif text-2xl">先选一面镜子</p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    其他三面保持不变，只松动一个前提。这里不会替你预测结果。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {error ? (
            <p className="mt-4 text-sm text-[var(--accent)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
