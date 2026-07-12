"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import type { SessionMessage } from "./types";

interface ThoughtPortraitProps {
  messages: SessionMessage[];
  revealed: number;
  marker: string;
}

interface Point {
  x: number;
  y: number;
}

const SIGNALS = [
  {
    key: "ideas",
    label: "观念",
    words: ["认为", "相信", "观念", "意识", "意义", "价值", "意志", "认知", "文化", "理解"],
  },
  {
    key: "conditions",
    label: "条件",
    words: ["资源", "制度", "环境", "身体", "技术", "经济", "物质", "阶层", "结构", "历史"],
  },
  {
    key: "evidence",
    label: "证据",
    words: ["证据", "数据", "观察", "结果", "事实", "经验", "案例", "反例", "可靠", "验证"],
  },
  {
    key: "rules",
    label: "规则",
    words: ["规则", "秩序", "规范", "责任", "应该", "必须", "允许", "权利", "公平", "分配"],
  },
  {
    key: "uncertainty",
    label: "未定",
    words: ["也许", "可能", "不确定", "不知道", "难说", "取决于", "但是", "不过", "或许", "未必"],
  },
] as const;

const LABEL_POSITIONS = [
  { x: 160, y: 12, anchor: "middle" },
  { x: 294, y: 62, anchor: "end" },
  { x: 260, y: 174, anchor: "end" },
  { x: 60, y: 174, anchor: "start" },
  { x: 26, y: 62, anchor: "start" },
] as const;

const CENTER = { x: 160, y: 88 } as const;

function hashText(text: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

function countOccurrences(text: string, term: string): number {
  if (!text || !term) return 0;
  return text.split(term).length - 1;
}

function pointAt(points: Point[], index: number): Point {
  const normalized = (index + points.length) % points.length;
  return points[normalized] ?? CENTER;
}

function closedCurve(points: Point[]): string {
  if (points.length < 3) return "";
  const start = pointAt(points, 0);
  let path = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;

  for (let index = 0; index < points.length; index += 1) {
    const previous = pointAt(points, index - 1);
    const current = pointAt(points, index);
    const next = pointAt(points, index + 1);
    const afterNext = pointAt(points, index + 2);
    const controlOne = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const controlTwo = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: next.y - (afterNext.y - current.y) / 6,
    };
    path += ` C ${controlOne.x.toFixed(1)} ${controlOne.y.toFixed(1)}, ${controlTwo.x.toFixed(1)} ${controlTwo.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }

  return `${path} Z`;
}

function curvedLink(from: Point, to: Point, seed: number): string {
  const middleX = (from.x + to.x) / 2;
  const middleY = (from.y + to.y) / 2;
  const bend = (seededUnit(seed) - 0.5) * 26;
  const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const normalX = -(to.y - from.y) / distance;
  const normalY = (to.x - from.x) / distance;
  const controlX = middleX + normalX * bend;
  const controlY = middleY + normalY * bend;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

export function ThoughtPortrait({ messages, revealed, marker }: ThoughtPortraitProps) {
  const reduceMotion = useReducedMotion();
  const portrait = useMemo(() => {
    const userMessages = messages.filter((message) => message.role === "user");
    const answerText = userMessages.map((message) => message.content).join("\n");
    const seed = hashText(`${answerText}|${marker}`);
    const textDepth = Math.min(answerText.length / 220, 1);

    const hits = SIGNALS.map((signal) =>
      signal.words.reduce(
        (total, term) =>
          total + countOccurrences(answerText, term) + countOccurrences(marker, term),
        0,
      ),
    );
    const strongestHit = Math.max(1, ...hits);
    const scores = hits.map((hit, index) => {
      const languageSignal = hit / strongestHit;
      const variation = seededUnit(seed + index * 97) * 0.16;
      return Math.min(1, 0.28 + languageSignal * 0.48 + textDepth * 0.08 + variation);
    });

    const contourPoints = scores.map((score, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / SIGNALS.length;
      const radius = 42 + score * 43 + (seededUnit(seed + index * 41) - 0.5) * 10;
      return {
        x: CENTER.x + Math.cos(angle) * radius * 1.25,
        y: CENTER.y + Math.sin(angle) * radius * 0.78,
      };
    });
    const echoPoints = contourPoints.map((point, index) => {
      const scale = 0.56 + seededUnit(seed + index * 19) * 0.08;
      return {
        x: CENTER.x + (point.x - CENTER.x) * scale,
        y: CENTER.y + (point.y - CENTER.y) * scale,
      };
    });

    const answerNodes = userMessages.slice(-6).map((message, index, visibleMessages) => {
      const messageSeed = hashText(`${message.id}|${message.content}`);
      const progress = visibleMessages.length <= 1 ? 0 : index / (visibleMessages.length - 1);
      const angle = -2.3 + progress * 4.65 + (seededUnit(messageSeed) - 0.5) * 0.42;
      const radius = 24 + index * 9 + seededUnit(messageSeed + 11) * 16;
      return {
        id: message.id,
        point: {
          x: CENTER.x + Math.cos(angle) * radius * 1.2,
          y: CENTER.y + Math.sin(angle) * radius * 0.65,
        },
        seed: messageSeed,
      };
    });

    return {
      answerCount: userMessages.length,
      answerNodes,
      contour: closedCurve(contourPoints),
      contourPoints,
      echo: closedCurve(echoPoints),
      seed,
      signature: `${userMessages.length}-${seed}-${Math.max(0, revealed)}`,
    };
  }, [marker, messages, revealed]);

  const visibleSignals = Math.min(
    SIGNALS.length,
    Math.max(1, portrait.answerCount, Math.max(0, revealed)),
  );
  const markerLabel = marker.trim().slice(0, 7) || "未定";
  const enter = reduceMotion ? false : { opacity: 0, scale: 0.94 };
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.52, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <figure className="relative overflow-hidden border-y border-[var(--line)] bg-[var(--surface)] px-3 py-3 sm:px-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="display-type text-lg text-[var(--ink)]">思想轮廓</h2>
        <p
          className="font-mono text-[10px] tracking-[0.1em] text-[var(--accent)]"
          aria-live="polite"
        >
          生成中
        </p>
      </div>

      <svg
        className="mt-1 h-36 w-full overflow-visible sm:h-44"
        viewBox="0 0 320 184"
        role="img"
        aria-labelledby="thought-portrait-title thought-portrait-description"
        preserveAspectRatio="xMidYMid meet"
      >
        <title id="thought-portrait-title">当前思想轮廓</title>
        <desc id="thought-portrait-description">
          观念、条件、证据、规则与未定线索组成一张仍在变化的因果拓扑。它不是人格或立场的精确测量。
        </desc>

        <g>
          <ellipse
            cx={CENTER.x}
            cy={CENTER.y}
            rx="118"
            ry="65"
            fill="none"
            stroke="var(--line)"
            strokeWidth="0.8"
            strokeDasharray="1 8"
          />
          <ellipse
            cx={CENTER.x}
            cy={CENTER.y}
            rx="72"
            ry="39"
            fill="none"
            stroke="var(--line)"
            strokeWidth="0.7"
            strokeDasharray="5 9"
          />

          <motion.g
            key={portrait.signature}
            initial={enter}
            animate={{ opacity: 1, scale: 1 }}
            transition={transition}
            style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          >
            <path
              d={portrait.echo}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="0.8"
              strokeDasharray="3 7"
              opacity="0.42"
            />
            <path
              d={portrait.contour}
              fill="var(--accent-soft)"
              stroke="var(--accent)"
              strokeWidth="1.35"
              opacity="0.94"
            />

            {portrait.contourPoints.map((point, index) => {
              const active = index < visibleSignals;
              const label = SIGNALS[index]?.label ?? "线索";
              return (
                <g key={label} opacity={active ? 1 : 0.2}>
                  <path
                    d={curvedLink(CENTER, point, portrait.seed + index * 73)}
                    fill="none"
                    stroke={active ? "var(--line-strong)" : "var(--line)"}
                    strokeWidth="0.7"
                  />
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={active ? 3.2 : 2.2}
                    fill={active ? "var(--paper)" : "var(--mirror)"}
                    stroke={active ? "var(--accent)" : "var(--line-strong)"}
                    strokeWidth="1"
                    initial={reduceMotion || !active ? false : { opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.36,
                      delay: reduceMotion ? 0 : index * 0.07,
                    }}
                    style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                  />
                </g>
              );
            })}

            {portrait.answerNodes.map((node, index) => {
              const previous = portrait.answerNodes[index - 1]?.point ?? CENTER;
              return (
                <g key={node.id}>
                  <motion.path
                    d={curvedLink(previous, node.point, node.seed)}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="0.8"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 0.55 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.4,
                      delay: reduceMotion ? 0 : index * 0.06,
                    }}
                  />
                  <motion.circle
                    cx={node.point.x}
                    cy={node.point.y}
                    r={index === portrait.answerNodes.length - 1 ? 3.4 : 2.2}
                    fill={
                      index === portrait.answerNodes.length - 1 ? "var(--accent)" : "var(--ink)"
                    }
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.25 }}
                    animate={{ opacity: 0.88, scale: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.34,
                      delay: reduceMotion ? 0 : index * 0.06 + 0.08,
                    }}
                    style={{ transformOrigin: `${node.point.x}px ${node.point.y}px` }}
                  />
                </g>
              );
            })}

            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="11"
              fill="var(--paper)"
              stroke="var(--line-strong)"
              strokeWidth="0.8"
            />
            <circle cx={CENTER.x} cy={CENTER.y} r="2.6" fill="var(--accent)" />
            <text
              x={CENTER.x}
              y={CENTER.y + 21}
              textAnchor="middle"
              fill="var(--ink)"
              fontFamily="var(--serif)"
              fontSize="9.5"
            >
              {markerLabel}
            </text>
          </motion.g>

          {SIGNALS.map((signal, index) => {
            const position = LABEL_POSITIONS[index] ?? LABEL_POSITIONS[0];
            return (
              <text
                key={signal.key}
                x={position.x}
                y={position.y}
                textAnchor={position.anchor}
                fill={index < visibleSignals ? "var(--ink)" : "var(--muted)"}
                opacity={index < visibleSignals ? 0.82 : 0.42}
                fontFamily="var(--mono)"
                fontSize="9"
                letterSpacing="0.08em"
              >
                {signal.label}
              </text>
            );
          })}
        </g>
      </svg>

      <figcaption className="sr-only">临时轮廓，不是人格测量；每次回答都会改变它。</figcaption>
    </figure>
  );
}
