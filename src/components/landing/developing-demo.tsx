"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { WorldviewCharacter } from "@/components/result/worldview-character";

const choices = [
  {
    digit: 1,
    label: "规则与资源",
    family: "织序家族",
    title: "新局育种者",
    fieldState: "有界秩序",
    nameToken: "整域",
  },
  {
    digit: 2,
    label: "矛盾与限制",
    family: "裂隙家族",
    title: "分歧开路人",
    fieldState: "张力场域",
    nameToken: "裂域",
  },
  {
    digit: 3,
    label: "人的选择",
    family: "星核家族",
    title: "意义造境者",
    fieldState: "中心场域",
    nameToken: "枢域",
  },
  {
    digit: 4,
    label: "先不下结论",
    family: "旷野家族",
    title: "新境孵化者",
    fieldState: "开放场域",
    nameToken: "旷域",
  },
] as const;

export function DevelopingDemo() {
  const [active, setActive] = useState(2);
  const reduceMotion = useReducedMotion();
  const choice = choices[active] ?? choices[0];
  const profile = {
    code: `${choice.digit}–1–3–4`,
    name: `${choice.nameToken}实核·凝视创生主义`,
    archetypeFamily: choice.family,
    archetypeTitle: choice.title,
    axes: [
      { key: "field", label: "场域", value: active, stateName: choice.fieldState },
      { key: "ontology", label: "本体", value: 0, stateName: "稳定实在" },
      { key: "phenomenology", label: "现象", value: 2, stateName: "聚焦经验" },
      { key: "teleology", label: "目的", value: 3, stateName: "开放生成" },
    ],
    emblem: [active, 0, 2, 3] as const,
    traits: ["先看场景", "确认事实", "追踪焦点", "创造新路"],
  };

  return (
    <section className="mirror-stage w-full" aria-label="世界观角色试玩">
      <div className="flex min-h-12 items-center justify-between border-b hairline px-4">
        <span className="mono-label text-[10px] text-[var(--accent)]">试玩 01 / 04</span>
        <span className="text-xs text-[var(--muted)]">选一项，角色就会变</span>
      </div>

      <div className="grid min-h-[31rem] sm:grid-cols-[0.92fr_1.08fr]">
        <div className="flex flex-col justify-between border-b hairline p-5 sm:border-r sm:border-b-0 sm:p-6">
          <div>
            <p className="text-xs text-[var(--muted)]">结果不同，你第一眼先看哪里？</p>
            <div className="mt-5 grid gap-2">
              {choices.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={active === index}
                  onClick={() => setActive(index)}
                  className="group flex min-h-12 items-center justify-between border-b border-[var(--line)] px-1 text-left text-sm transition-colors hover:text-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]"
                >
                  <span>{item.label}</span>
                  <span className="mono-label text-[10px] opacity-55">0{item.digit}</span>
                </button>
              ))}
            </div>
          </div>
          <Link
            className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-medium"
            href="/explore"
          >
            生成我的思想角色
            <ArrowRightIcon aria-hidden="true" size={17} />
          </Link>
        </div>

        <div className="relative grid min-h-[31rem] place-items-center overflow-hidden bg-[var(--paper-deep)] px-3 pt-3 pb-28">
          <motion.div
            key={choice.title}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 20 }}
            className="w-full max-w-[22rem]"
          >
            <WorldviewCharacter embedded profile={profile} />
          </motion.div>

          <div className="absolute right-4 bottom-4 left-4 border-t border-[var(--line)] bg-[var(--paper-deep)]/90 pt-3 backdrop-blur-sm">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="mono-label text-[9px] text-[var(--muted)]">{choice.family}</p>
                <p className="display-type mt-1 truncate text-2xl text-[var(--ink)]">
                  {choice.title}
                </p>
                <p className="coordinate-type mt-1 text-base text-[var(--accent)]">
                  {profile.code}
                </p>
              </div>
              <span className="mono-label shrink-0 text-right text-[9px] text-[var(--accent)]">
                16 角色
                <br />
                256 画像
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
