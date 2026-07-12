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
  field: "场域",
  ontology: "本体",
  phenomenology: "现象",
  teleology: "目的",
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
      className="mt-14 border-t border-[var(--line)] pt-8 sm:mt-16"
    >
      <div className="grid gap-7 lg:grid-cols-[0.55fr_1.45fr] lg:gap-12">
        <div>
          <ArrowsLeftRight
            className="text-[var(--accent)]"
            size={28}
            weight="light"
            aria-hidden="true"
          />
          <h2 id="experiment-title" className="mt-4 font-serif text-4xl leading-tight">
            换一位
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">只动一个数字。</p>
          <div className="mt-5 grid grid-cols-2 gap-x-4">
            {dimensions.map((dimension) => (
              <button
                key={dimension.dimension}
                type="button"
                onClick={() => runExperiment(dimension.dimension)}
                disabled={pending !== null}
                className="group flex min-h-11 cursor-pointer items-center justify-between border-b border-[var(--line)] px-1 text-left text-sm transition-colors duration-200 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-50"
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

        <div className="min-h-64 border border-[var(--line)] bg-[var(--paper-deep)] p-5 sm:p-7">
          <AnimatePresence mode="wait">
            {experiment ? (
              <motion.div
                key={`${experiment.changedDimension}-${experiment.after}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                {...(reduceMotion ? {} : { exit: { opacity: 0, y: -8 } })}
                transition={{ duration: 0.32 }}
              >
                <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--accent)]">
                  一位之差
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
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
                <blockquote className="mt-6 border-l-2 border-[var(--accent)] pl-4 font-serif text-2xl leading-snug">
                  {experiment.prompt}
                </blockquote>
                <details className="mt-4 text-sm text-[var(--muted)]">
                  <summary className="min-h-11 cursor-pointer py-3">查看变化说明</summary>
                  <p className="pb-2 leading-relaxed">{experiment.observation}</p>
                </details>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={false}
                animate={{ opacity: 1 }}
                className="grid min-h-52 place-items-center text-center"
              >
                <p className="font-serif text-2xl">选一位，看看会变成什么</p>
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
