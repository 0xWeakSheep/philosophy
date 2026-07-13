"use client";

import { Check, Copy, ShareNetwork } from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { type PointerEvent as ReactPointerEvent, useEffect, useId, useState } from "react";
import { WorldviewCharacter } from "./worldview-character";

export type WorldviewAxisValue = 0 | 1 | 2 | 3;
export type WorldviewAxisDigit = 1 | 2 | 3 | 4;

export interface WorldviewAxis {
  key: string;
  label: string;
  value: WorldviewAxisValue;
  digit: WorldviewAxisDigit;
  stateName: string;
  description: string;
}

export interface WorldviewCubeProfile {
  code: string;
  name: string;
  archetypeTitle: string;
  archetypeFamily: string;
  archetypeLine: string;
  tagline: string;
  axes: readonly WorldviewAxis[];
  emblem: readonly [WorldviewAxisValue, WorldviewAxisValue, WorldviewAxisValue, WorldviewAxisValue];
  traits: readonly string[];
  shareText: string;
}

interface WorldviewCubeProps {
  profile: WorldviewCubeProfile;
}

interface Point {
  x: number;
  y: number;
}

type Face = readonly [Point, Point, Point, Point];
type ShareStatus = "idle" | "copied" | "shared" | "error";

const CUBE_CENTER = { x: 280, y: 226 } as const;
const TOP_FACE = [
  { x: 280, y: 50 },
  { x: 448, y: 138 },
  CUBE_CENTER,
  { x: 112, y: 138 },
] as const satisfies Face;
const LEFT_FACE = [
  { x: 112, y: 138 },
  CUBE_CENTER,
  { x: 280, y: 402 },
  { x: 112, y: 314 },
] as const satisfies Face;
const RIGHT_FACE = [
  CUBE_CENTER,
  { x: 448, y: 138 },
  { x: 448, y: 314 },
  { x: 280, y: 402 },
] as const satisfies Face;

const ORBITS = [
  { rx: 190, ry: 137 },
  { rx: 207, ry: 149 },
  { rx: 224, ry: 161 },
  { rx: 241, ry: 173 },
] as const;

const SATELLITE_SLOTS = [0, 1, 2, 3] as const;

function clampLevel(value: number | undefined): WorldviewAxisValue {
  return Math.min(3, Math.max(0, Math.round(value ?? 0))) as WorldviewAxisValue;
}

function interpolate(start: Point, end: Point, amount: number): Point {
  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
  };
}

function bilinear(face: Face, horizontal: number, vertical: number): Point {
  const top = interpolate(face[0], face[1], horizontal);
  const bottom = interpolate(face[3], face[2], horizontal);
  return interpolate(top, bottom, vertical);
}

function facePoints(face: Face): string {
  return face.map((point) => `${point.x},${point.y}`).join(" ");
}

function cellPoints(face: Face, column: number, row: number): string {
  const startX = clampLevel(column) / 4;
  const endX = (clampLevel(column) + 1) / 4;
  const startY = clampLevel(row) / 4;
  const endY = (clampLevel(row) + 1) / 4;
  return [
    bilinear(face, startX, startY),
    bilinear(face, endX, startY),
    bilinear(face, endX, endY),
    bilinear(face, startX, endY),
  ]
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
}

function cellCenter(face: Face, column: number, row: number): Point {
  return bilinear(face, (clampLevel(column) + 0.5) / 4, (clampLevel(row) + 0.5) / 4);
}

function gridLines(face: Face): Array<readonly [Point, Point]> {
  const lines: Array<readonly [Point, Point]> = [];
  for (let index = 1; index < 4; index += 1) {
    const amount = index / 4;
    lines.push([bilinear(face, amount, 0), bilinear(face, amount, 1)]);
    lines.push([bilinear(face, 0, amount), bilinear(face, 1, amount)]);
  }
  return lines;
}

function radialPoints(
  center: Point,
  lobes: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number,
): string {
  return Array.from({ length: lobes * 2 }, (_, index) => {
    const angle = rotation + (index * Math.PI) / lobes;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return `${(center.x + Math.cos(angle) * radius).toFixed(1)},${(
      center.y + Math.sin(angle) * radius
    ).toFixed(1)}`;
  }).join(" ");
}

function polygonPoints(center: Point, sides: number, radius: number, rotation: number): string {
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (index * Math.PI * 2) / sides;
    return `${(center.x + Math.cos(angle) * radius).toFixed(1)},${(
      center.y + Math.sin(angle) * radius
    ).toFixed(1)}`;
  }).join(" ");
}

function displayCode(profile: WorldviewCubeProfile): string {
  const codeDigits = profile.code.match(/[1-4]/g)?.slice(0, 4);
  return codeDigits?.length === 4 ? codeDigits.join("–") : profile.code;
}

async function writeToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) throw new Error("copy_failed");
}

export function WorldviewCube({ profile }: WorldviewCubeProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const [activeAxisIndex, setActiveAxisIndex] = useState(3);
  const [visualMode, setVisualMode] = useState<"character" | "coordinate">("character");
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 150, damping: 24, mass: 0.45 });
  const smoothY = useSpring(pointerY, { stiffness: 150, damping: 24, mass: 0.45 });
  const rotateY = useTransform(smoothX, [-1, 1], [-2.8, 2.8]);
  const rotateX = useTransform(smoothY, [-1, 1], [2.2, -2.2]);

  const coordinates = [0, 1, 2, 3].map((index) =>
    clampLevel(profile.axes[index]?.value ?? profile.emblem[index]),
  ) as [WorldviewAxisValue, WorldviewAxisValue, WorldviewAxisValue, WorldviewAxisValue];
  const emblem = profile.emblem.map((value) => clampLevel(value)) as [
    WorldviewAxisValue,
    WorldviewAxisValue,
    WorldviewAxisValue,
    WorldviewAxisValue,
  ];
  const activeAxis = profile.axes[activeAxisIndex] ?? profile.axes[0];
  const activeTrait = profile.traits[activeAxisIndex];
  const activeOrbit = coordinates[3];
  const emblemRotation = -Math.PI / 2 + emblem[1] * (Math.PI / 8);
  const emblemLobes = 3 + emblem[0];
  const emblemInnerRadius = 10 + emblem[2] * 3.2;
  const emblemSatellites = 1 + emblem[3];

  const faceHighlights = [
    {
      axisIndex: 0,
      face: TOP_FACE,
      column: coordinates[0],
      row: coordinates[1],
    },
    {
      axisIndex: 1,
      face: LEFT_FACE,
      column: coordinates[1],
      row: 3 - coordinates[2],
    },
    {
      axisIndex: 2,
      face: RIGHT_FACE,
      column: coordinates[0],
      row: 3 - coordinates[2],
    },
  ] as const;

  useEffect(() => {
    if (shareStatus === "idle") return;
    const timeout = window.setTimeout(() => setShareStatus("idle"), 2800);
    return () => window.clearTimeout(timeout);
  }, [shareStatus]);

  function updateTilt(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
  }

  function resetTilt() {
    pointerX.set(0);
    pointerY.set(0);
  }

  async function copyProfile() {
    try {
      await writeToClipboard(profile.shareText);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  }

  async function shareProfile() {
    if (typeof navigator.share !== "function") {
      await copyProfile();
      return;
    }

    try {
      await navigator.share({
        title: `${profile.archetypeTitle} ${displayCode(profile)}`,
        text: profile.shareText,
      });
      setShareStatus("shared");
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      try {
        await writeToClipboard(profile.shareText);
        setShareStatus("copied");
      } catch {
        setShareStatus("error");
      }
    }
  }

  const statusText: Record<ShareStatus, string> = {
    idle: "",
    copied: "卡片文字已复制",
    shared: "分享面板已打开",
    error: "暂时无法复制，请稍后再试",
  };

  return (
    <section
      className="relative isolate overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-deep)] text-[var(--ink)]"
      aria-labelledby={`${titleId}-card-title`}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[var(--accent)]" />

      <header className="grid gap-5 border-b border-[var(--line)] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-7">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] text-[var(--accent)]">
            {profile.archetypeFamily} · 本题思想角色
          </p>
          <h1
            id={`${titleId}-card-title`}
            className="display-type mt-2 max-w-3xl text-3xl sm:text-4xl"
          >
            {profile.archetypeTitle}
          </h1>
          <p className="mt-2 font-serif text-lg text-[var(--accent)]">{profile.name}</p>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {profile.archetypeLine}
          </p>
        </div>
        <div className="lg:text-right">
          <p className="coordinate-type whitespace-nowrap text-3xl text-[var(--ink)] sm:text-4xl">
            {displayCode(profile)}
          </p>
          <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">4⁴ / 256</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.16fr)_minmax(19rem,0.84fr)]">
        <div className="border-b border-[var(--line)] p-3 sm:p-5 lg:border-r lg:border-b-0 lg:px-7 lg:py-5">
          <div className="mx-auto mb-3 flex max-w-[44rem] items-center justify-between gap-3 border-b border-[var(--line)]">
            <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
              {visualMode === "character" ? "四轴共同塑造角色" : "四维坐标结构"}
            </p>
            <fieldset className="flex">
              <legend className="sr-only">切换结果视觉</legend>
              {(["character", "coordinate"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVisualMode(mode)}
                  aria-pressed={visualMode === mode}
                  className="min-h-11 border-b-2 border-transparent px-3 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--ink)]"
                >
                  {mode === "character" ? "角色画像" : "坐标结构"}
                </button>
              ))}
            </fieldset>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {visualMode === "character" ? (
              <motion.div
                key="character"
                className="mx-auto aspect-[552/468] w-full max-w-[26rem] overflow-hidden"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.28 }}
              >
                <WorldviewCharacter embedded profile={profile} />
              </motion.div>
            ) : (
              <motion.div
                key="coordinate"
                className="mx-auto max-w-[44rem] touch-pan-y"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.28 }}
                style={{ rotateX, rotateY, transformPerspective: 900 }}
                onPointerMove={updateTilt}
                onPointerLeave={resetTilt}
              >
                <svg
                  className="h-auto w-full"
                  viewBox="0 0 560 460"
                  role="img"
                  aria-labelledby={`${titleId} ${descriptionId}`}
                  focusable="false"
                >
                  <title id={titleId}>世界观坐标 {displayCode(profile)} 的四维立方体徽记</title>
                  <desc id={descriptionId}>
                    前三位坐标在四乘四乘四的等距立方体三个面上显影，第四位坐标选择外围四条目的轨道。四条轴各有四档，共有二百五十六种组合。
                  </desc>

                  {ORBITS.map((orbit, index) => {
                    const selected = index === activeOrbit;
                    const angle = -0.52 + index * 0.018;
                    const node = {
                      x: CUBE_CENTER.x + Math.cos(angle) * orbit.rx,
                      y: CUBE_CENTER.y + Math.sin(angle) * orbit.ry,
                    };
                    return (
                      <g key={`${orbit.rx}-${orbit.ry}`}>
                        <motion.ellipse
                          cx={CUBE_CENTER.x}
                          cy={CUBE_CENTER.y}
                          rx={orbit.rx}
                          ry={orbit.ry}
                          fill="none"
                          stroke={selected ? "var(--accent)" : "var(--line)"}
                          strokeWidth={selected ? 1.5 : 0.75}
                          strokeDasharray={selected ? undefined : "2 7"}
                          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                          animate={{
                            opacity: selected ? (activeAxisIndex === 3 ? 1 : 0.58) : 0.62,
                            scale: 1,
                          }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.42,
                            delay: reduceMotion ? 0 : index * 0.05,
                          }}
                          style={{ transformOrigin: `${CUBE_CENTER.x}px ${CUBE_CENTER.y}px` }}
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={selected ? 5.4 : 3.4}
                          fill={selected ? "var(--accent)" : "var(--paper)"}
                          stroke={selected ? "var(--accent)" : "var(--line-strong)"}
                          strokeWidth="1"
                        />
                        <text
                          x={node.x + 10}
                          y={node.y + 3}
                          fill={selected ? "var(--accent)" : "var(--muted)"}
                          fontFamily="var(--mono)"
                          fontSize="10"
                        >
                          {index + 1}
                        </text>
                      </g>
                    );
                  })}

                  <g>
                    <polygon
                      points={facePoints(TOP_FACE)}
                      fill="color-mix(in srgb, var(--surface-solid) 76%, var(--paper))"
                      stroke="var(--line-strong)"
                      strokeWidth="1.1"
                    />
                    <polygon
                      points={facePoints(LEFT_FACE)}
                      fill="color-mix(in srgb, var(--paper-deep) 82%, var(--mirror))"
                      stroke="var(--line-strong)"
                      strokeWidth="1.1"
                    />
                    <polygon
                      points={facePoints(RIGHT_FACE)}
                      fill="var(--surface-solid)"
                      stroke="var(--line-strong)"
                      strokeWidth="1.1"
                    />

                    {[TOP_FACE, LEFT_FACE, RIGHT_FACE].flatMap((face) =>
                      gridLines(face).map(([start, end]) => (
                        <line
                          key={`${start.x}-${start.y}-${end.x}-${end.y}`}
                          x1={start.x}
                          y1={start.y}
                          x2={end.x}
                          y2={end.y}
                          stroke="var(--line)"
                          strokeWidth="0.75"
                        />
                      )),
                    )}

                    {faceHighlights.map((highlight) => {
                      const center = cellCenter(highlight.face, highlight.column, highlight.row);
                      const focused = activeAxisIndex === highlight.axisIndex;
                      return (
                        <g key={highlight.axisIndex}>
                          <motion.polygon
                            points={cellPoints(highlight.face, highlight.column, highlight.row)}
                            fill="var(--accent-soft)"
                            stroke="var(--accent)"
                            strokeWidth={focused ? 2 : 1.25}
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                            animate={{ opacity: focused ? 1 : 0.68, scale: 1 }}
                            transition={{
                              duration: reduceMotion ? 0 : 0.36,
                              delay: reduceMotion ? 0 : highlight.axisIndex * 0.08,
                            }}
                            style={{ transformOrigin: `${center.x}px ${center.y}px` }}
                          />
                          <line
                            x1={center.x}
                            y1={center.y}
                            x2={CUBE_CENTER.x}
                            y2={CUBE_CENTER.y}
                            stroke="var(--accent)"
                            strokeWidth="0.75"
                            strokeDasharray="2 5"
                            opacity={focused ? 0.8 : 0.32}
                          />
                        </g>
                      );
                    })}
                  </g>

                  <motion.g
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.48,
                      delay: reduceMotion ? 0 : 0.18,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{ transformOrigin: `${CUBE_CENTER.x}px ${CUBE_CENTER.y}px` }}
                  >
                    <circle
                      cx={CUBE_CENTER.x}
                      cy={CUBE_CENTER.y}
                      r="46"
                      fill="var(--paper)"
                      stroke="var(--accent)"
                      strokeWidth="1.2"
                    />
                    <circle
                      cx={CUBE_CENTER.x}
                      cy={CUBE_CENTER.y}
                      r="38"
                      fill="none"
                      stroke="var(--line-strong)"
                      strokeWidth="0.8"
                      strokeDasharray={`${2 + emblem[2]} ${5 + emblem[1]}`}
                    />
                    <polygon
                      points={radialPoints(
                        CUBE_CENTER,
                        emblemLobes,
                        29,
                        emblemInnerRadius,
                        emblemRotation,
                      )}
                      fill="var(--ink)"
                    />
                    <polygon
                      points={polygonPoints(
                        CUBE_CENTER,
                        3 + emblem[2],
                        8 + emblem[1] * 1.4,
                        -emblemRotation,
                      )}
                      fill="var(--paper)"
                      stroke="var(--accent)"
                      strokeWidth="1"
                    />
                    {SATELLITE_SLOTS.slice(0, emblemSatellites).map((slot) => {
                      const angle =
                        -Math.PI / 2 +
                        emblem[1] * (Math.PI / 10) +
                        (slot * Math.PI * 2) / emblemSatellites;
                      return (
                        <circle
                          key={`satellite-${slot}`}
                          cx={CUBE_CENTER.x + Math.cos(angle) * 36}
                          cy={CUBE_CENTER.y + Math.sin(angle) * 36}
                          r="2.2"
                          fill="var(--accent)"
                        />
                      );
                    })}
                  </motion.g>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {visualMode === "character" ? (
            <div className="mx-auto mt-2 grid max-w-[44rem] grid-cols-2 gap-px bg-[var(--line)] font-mono text-[9px] text-[var(--muted)] sm:grid-cols-4">
              {[
                ["场域", "舞台"],
                ["本体", "轮廓"],
                ["现象", "表情"],
                ["目的", "道具"],
              ].map(([axis, part]) => (
                <span key={axis} className="bg-[var(--paper-deep)] px-2 py-2 text-center">
                  {axis} → {part}
                </span>
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-[44rem] items-center justify-between gap-3 px-1 pt-1 font-mono text-[10px] tracking-[0.06em]">
              <span className="text-[var(--muted)]">4 × 4 × 4 × 4 = 256</span>
              <span className="text-right text-[var(--accent)]">
                {profile.axes[3]?.label ?? "目的轴"} {coordinates[3] + 1} / 4
              </span>
            </div>
          )}

          <p className="sr-only">
            这是坐标 {displayCode(profile)} 的可视化。前三位定位立方体，第四位定位外围轨道。
          </p>
        </div>

        <aside className="flex min-h-full flex-col p-5 sm:p-7 lg:p-8" aria-label="四条世界观轴">
          <ol className="grid grid-cols-2 gap-x-4 gap-y-1 lg:grid-cols-1">
            {profile.axes.slice(0, 4).map((axis, index) => {
              const selected = activeAxisIndex === index;
              return (
                <li key={axis.key}>
                  <button
                    type="button"
                    onClick={() => setActiveAxisIndex(index)}
                    className={`grid min-h-16 w-full cursor-pointer grid-cols-[2rem_1fr] items-center gap-3 border-b px-1 py-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none ${
                      selected
                        ? "border-[var(--accent)] text-[var(--ink)]"
                        : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                    }`}
                    aria-pressed={selected}
                    aria-controls={`${titleId}-axis-panel`}
                  >
                    <span
                      className={`font-mono text-lg ${selected ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                    >
                      {axis.digit}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">{axis.label}</span>
                      <span className="mt-0.5 block truncate text-sm text-[var(--ink)]">
                        {axis.stateName}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <section
            id={`${titleId}-axis-panel`}
            className="mt-5 min-h-28 border-l-2 border-[var(--accent)] bg-[var(--surface)] px-4 py-4 lg:mt-8"
            aria-label="当前维度解释"
            aria-live="polite"
          >
            <AnimatePresence mode="wait" initial={false}>
              {activeAxis ? (
                <motion.div
                  key={activeAxis.key}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                >
                  <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--accent)]">
                    {activeAxis.label} {activeAxis.digit} / 4
                  </p>
                  <p className="mt-2 font-serif text-xl">{activeAxis.stateName}</p>
                  <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                    {activeTrait ?? activeAxis.description}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        </aside>
      </div>

      <footer className="flex flex-col gap-5 border-t border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7 lg:px-9">
        <p
          className={`min-h-5 text-xs ${shareStatus === "error" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
          role="status"
          aria-live="polite"
        >
          {statusText[shareStatus] || "只描述本次议题 · 可反驳"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={() => void copyProfile()}
            className="action-secondary cursor-pointer"
          >
            {shareStatus === "copied" ? (
              <Check aria-hidden="true" size={17} />
            ) : (
              <Copy aria-hidden="true" size={17} />
            )}
            复制
          </button>
          <button
            type="button"
            onClick={() => void shareProfile()}
            className="action-primary cursor-pointer"
          >
            <ShareNetwork aria-hidden="true" size={17} />
            分享
          </button>
        </div>
      </footer>
    </section>
  );
}
