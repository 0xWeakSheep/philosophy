"use client";

import { ArrowClockwise } from "@phosphor-icons/react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      className="paper-grain grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5 text-[var(--ink)]"
    >
      <div className="max-w-xl border-l-2 border-[var(--accent)] pl-6">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--accent)]">显影中断</p>
        <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">这一面暂时没有成像</h1>
        <p className="mt-5 leading-relaxed text-[var(--muted)]">
          你的内容没有因此被判定或解释。可以重新尝试这一步，或者稍后再回来。
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex min-h-11 cursor-pointer items-center gap-2 bg-[var(--ink)] px-5 text-sm text-[var(--paper)]"
        >
          <ArrowClockwise aria-hidden="true" size={17} /> 再试一次
        </button>
      </div>
    </main>
  );
}
