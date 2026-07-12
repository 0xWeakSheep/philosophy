"use client";

import { Eye, FrameCorners, SunHorizon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import type { DimensionKey, DimensionSignal, ForceKey } from "./types";

const dimensionOrder: DimensionKey[] = ["field", "ontology", "phenomenology", "teleology"];
const fallbackSignals: ForceKey[] = ["order", "conflict", "center", "open"];

const dimensionNames: Record<DimensionKey, string> = {
  field: "场域",
  ontology: "本体",
  phenomenology: "现象",
  teleology: "目的",
};

const dimensionQuestions: Record<DimensionKey, string> = {
  field: "什么先于选择？",
  ontology: "什么不靠相信也存在？",
  phenomenology: "什么算证据？",
  teleology: "改变从哪开始？",
};

const forceNames: Record<ForceKey, string> = {
  order: "秩序",
  conflict: "冲突",
  center: "中心",
  open: "开放",
};

const forceSurface: Record<ForceKey, string> = {
  order:
    "bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[size:22px_22px]",
  conflict:
    "bg-[linear-gradient(112deg,transparent_47%,color-mix(in_srgb,var(--accent)_62%,transparent)_48%,color-mix(in_srgb,var(--accent)_62%,transparent)_50%,transparent_51%),linear-gradient(68deg,transparent_55%,var(--line)_56%,transparent_58%)]",
  center:
    "bg-[repeating-radial-gradient(circle_at_52%_50%,transparent_0,transparent_13px,var(--line)_14px,transparent_15px)]",
  open: "bg-[radial-gradient(circle_at_38%_44%,var(--mirror)_0,transparent_70%)] [mask-image:linear-gradient(90deg,#000_20%,transparent_100%)]",
};

interface MirrorChamberProps {
  dimensions?: DimensionSignal[];
  revealed?: number;
  compact?: boolean;
  interactive?: boolean;
  onDimensionChange?: (dimension: DimensionKey) => void;
  windowQuestion?: string;
}

export function MirrorChamber({
  dimensions = [],
  revealed = 0,
  compact = false,
  interactive = false,
  onDimensionChange,
  windowQuestion = "什么现实条件会让这套解释失效？",
}: MirrorChamberProps) {
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState<DimensionKey | null>(null);
  const signalMap = useMemo(
    () => new Map(dimensions.map((dimension) => [dimension.dimension, dimension])),
    [dimensions],
  );

  const selectDimension = (dimension: DimensionKey) => {
    if (!interactive) return;
    setFocused(dimension);
    onDimensionChange?.(dimension);
  };

  return (
    <section className="relative" aria-label="四维线索与现实窗">
      <div
        className={
          compact ? "grid grid-cols-2 gap-2 sm:grid-cols-4" : "grid grid-cols-4 gap-2 sm:gap-3"
        }
      >
        {dimensionOrder.map((dimension, index) => {
          const data = signalMap.get(dimension);
          const visible = index < revealed || Boolean(data);
          const signal = data?.signal ?? fallbackSignals[index] ?? "order";
          const isFocused = focused === dimension;
          const Element = interactive ? motion.button : motion.div;

          return (
            <Element
              key={dimension}
              type={interactive ? "button" : undefined}
              onClick={() => selectDimension(dimension)}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: visible ? 1 : 0.38, y: 0 }}
              transition={{ duration: 0.42, delay: reduceMotion ? 0 : index * 0.06 }}
              className={`group relative overflow-hidden border bg-[var(--paper-deep)] text-left transition-colors duration-200 ${
                compact ? "min-h-[4.75rem]" : "min-h-44 sm:min-h-64"
              } ${
                interactive
                  ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                  : ""
              } ${isFocused ? "border-[var(--accent)]" : "border-[var(--line)]"}`}
              aria-label={`${dimensionNames[dimension]}镜面${data ? `，暂时呈现${forceNames[data.signal]}` : visible ? "，已收集一条线索" : "，尚未显影"}`}
              aria-pressed={interactive ? isFocused : undefined}
            >
              <div
                className={`absolute inset-0 opacity-70 transition-opacity duration-300 ${forceSurface[signal]}`}
              />
              <div className="absolute inset-0 bg-[linear-gradient(150deg,transparent_10%,color-mix(in_srgb,var(--paper)_78%,transparent)_76%)]" />
              <div
                className={`relative flex flex-col justify-between ${
                  compact ? "min-h-[4.75rem] p-2.5" : "min-h-44 p-3 sm:min-h-64 sm:p-4"
                }`}
              >
                <span
                  className={`font-mono tracking-[0.16em] text-[var(--muted)] ${
                    compact ? "text-[0.62rem]" : "text-[10px] sm:text-xs"
                  }`}
                >
                  {dimensionNames[dimension]}
                </span>
                <div>
                  {!compact ? (
                    <p className="hidden max-w-36 text-xs leading-relaxed text-[var(--muted)] sm:block">
                      {data?.observation ?? dimensionQuestions[dimension]}
                    </p>
                  ) : null}
                  <div
                    className={`flex items-center justify-between gap-2 ${compact ? "mt-1" : "mt-3"}`}
                  >
                    <span
                      className={
                        compact
                          ? "text-xs font-medium text-[var(--ink)]"
                          : "text-sm font-medium text-[var(--ink)]"
                      }
                    >
                      {data ? forceNames[data.signal] : visible ? "已有线索" : "等待回答"}
                    </span>
                    {data ? (
                      <Eye aria-hidden="true" size={compact ? 14 : 16} weight="light" />
                    ) : (
                      <FrameCorners aria-hidden="true" size={compact ? 14 : 16} weight="light" />
                    )}
                  </div>
                </div>
              </div>
            </Element>
          );
        })}
      </div>

      <aside
        className={`ml-auto grid grid-cols-[auto_1fr] items-start border-l-2 border-[var(--accent)] bg-[var(--window)] text-[var(--ink)] ${
          compact ? "mt-2 w-full gap-2 px-3 py-2 text-xs" : "mt-3 max-w-md gap-3 px-4 py-3 text-sm"
        }`}
      >
        <SunHorizon
          aria-hidden="true"
          className="mt-0.5 text-[var(--accent)]"
          size={compact ? 16 : 19}
        />
        <div>
          <p className="font-medium">现实窗</p>
          <p
            className={`leading-relaxed text-[var(--muted)] ${compact ? "mt-0.5 line-clamp-1" : "mt-1"}`}
          >
            {windowQuestion}
          </p>
        </div>
      </aside>
    </section>
  );
}
