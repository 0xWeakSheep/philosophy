"use client";

import { ArrowLeft, ArrowRight, SunHorizon, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MirrorChamber } from "@/components/session/mirror-chamber";
import type { DimensionKey, MirrorSession } from "@/components/session/types";
import { unwrapSession } from "@/components/session/types";
import { CounterfactualLab } from "./counterfactual-lab";
import { FeedbackPanel } from "./feedback-panel";
import { HypothesisReview } from "./hypothesis-review";

interface ResultExperienceProps {
  sessionId: string;
}

const dimensionNames: Record<DimensionKey, string> = {
  field: "场域",
  ontology: "本体",
  phenomenology: "现象",
  teleology: "目的",
};

export function ResultExperience({ sessionId }: ResultExperienceProps) {
  const router = useRouter();
  const [session, setSession] = useState<MirrorSession | null>(null);
  const [activeDimension, setActiveDimension] = useState<DimensionKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadResult() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("这次显影不存在，或已经被删除");
        setSession(unwrapSession(await response.json()));
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "读取显影结果失败");
      } finally {
        setLoading(false);
      }
    }
    void loadResult();
    return () => controller.abort();
  }, [sessionId]);

  const activeSignal = useMemo(
    () => session?.result?.dimensions.find((item) => item.dimension === activeDimension),
    [activeDimension, session],
  );

  async function deleteSession() {
    if (!session || !window.confirm("删除后无法恢复。确定删除这次显影吗？")) return;
    await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return (
      <main
        id="main-content"
        className="min-h-[100dvh] bg-[var(--paper)] px-5 py-8 text-[var(--ink)]"
      >
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-5 w-36 bg-[var(--mirror)]" />
          <div className="mt-20 h-4 w-24 bg-[var(--mirror)]" />
          <div className="mt-5 h-32 max-w-4xl bg-[var(--mirror)]" />
          <div className="mt-14 h-72 bg-[var(--mirror)]" />
        </div>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main
        id="main-content"
        className="grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5 text-[var(--ink)]"
      >
        <div className="max-w-md border-l-2 border-[var(--accent)] pl-5">
          <p role="alert" className="font-serif text-2xl leading-snug">
            {error || "这次显影还不存在"}
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
            href="/explore"
          >
            <ArrowLeft aria-hidden="true" /> 开始一次新的探索
          </Link>
        </div>
      </main>
    );
  }

  if (!session.result) {
    return (
      <main
        id="main-content"
        className="grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5 text-[var(--ink)]"
      >
        <div className="max-w-md">
          <h1 className="font-serif text-3xl">镜面还没有完成显影</h1>
          <p className="mt-4 leading-relaxed text-[var(--muted)]">
            再回答几个问题，结果会在证据足够时出现。
          </p>
          <Link
            className="mt-7 inline-flex min-h-11 items-center gap-2 bg-[var(--ink)] px-5 text-sm text-[var(--paper)]"
            href={`/session/${session.id}`}
          >
            回到问题 <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  const result = session.result;

  return (
    <main
      id="main-content"
      className="paper-grain min-h-[100dvh] bg-[var(--paper)] px-4 py-5 text-[var(--ink)] sm:px-6 sm:py-7"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--line)]">
          <Link
            href="/"
            className="font-serif text-lg tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            意识形态镜室
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-[var(--muted)] sm:block">
              只绑定这次议题
            </span>
            <button
              type="button"
              onClick={deleteSession}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-[var(--muted)] transition-colors duration-200 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label="删除这次显影"
            >
              <Trash aria-hidden="true" size={19} weight="light" />
            </button>
          </div>
        </header>

        <section className="grid gap-10 pb-12 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20 lg:pt-20">
          <div>
            <p className="font-mono text-xs tracking-[0.14em] text-[var(--accent)]">核心张力</p>
            <h1 className="mt-5 max-w-5xl font-serif text-4xl leading-[1.2] text-balance sm:text-6xl lg:text-[4.6rem]">
              {result.coreTension}
            </h1>
          </div>
          <div className="border-l border-[var(--line)] pl-5">
            <p className="text-sm font-medium">本次议题</p>
            <p className="mt-2 leading-relaxed text-[var(--muted)]">{session.topic}</p>
            <p className="mt-5 text-xs leading-relaxed text-[var(--muted)]">
              这是一个临时结构。它来自你的表达，也可以被你的反例改变。
            </p>
          </div>
        </section>

        <section aria-labelledby="mirror-map-title" className="border-t border-[var(--line)] pt-10">
          <div className="mb-7 max-w-2xl">
            <h2 id="mirror-map-title" className="font-serif text-2xl">
              四面镜子的当前读法
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              选择一面镜子查看它暂时捕捉到的信号。
            </p>
          </div>
          <MirrorChamber
            dimensions={result.dimensions}
            revealed={4}
            interactive
            onDimensionChange={setActiveDimension}
            windowQuestion={result.window.question}
          />
          {activeSignal ? (
            <div className="mt-5 border-l-2 border-[var(--accent)] pl-4" aria-live="polite">
              <p className="font-mono text-xs text-[var(--accent)]">
                {dimensionNames[activeSignal.dimension]}
              </p>
              <p className="mt-2 max-w-2xl leading-relaxed text-[var(--muted)]">
                {activeSignal.observation ??
                  `这面镜子暂时呈现出“${activeSignal.signal}”的组织方式。`}
              </p>
            </div>
          ) : null}
        </section>

        <HypothesisReview
          sessionId={session.id}
          hypotheses={result.hypotheses}
          onSessionChange={setSession}
        />

        <section
          className="mt-24 grid gap-8 bg-[var(--window)] p-5 sm:p-8 lg:grid-cols-[0.55fr_1.45fr]"
          aria-labelledby="window-title"
        >
          <div>
            <SunHorizon
              className="text-[var(--accent)]"
              size={30}
              weight="light"
              aria-hidden="true"
            />
            <h2 id="window-title" className="mt-5 font-serif text-3xl">
              四面镜子之外，还有一扇窗
            </h2>
          </div>
          <div>
            <p className="font-serif text-2xl leading-snug">{result.window.question}</p>
            {result.window.externalFactors.length > 0 ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {result.window.externalFactors.map((factor) => (
                  <p
                    key={factor}
                    className="border-l border-[var(--accent)] pl-3 text-sm leading-relaxed text-[var(--muted)]"
                  >
                    {factor}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-[var(--muted)]">
                当前表达里没有足够信息判断现实的不对等。缺少证据时，镜室不会替现实开脱。
              </p>
            )}
          </div>
        </section>

        <CounterfactualLab sessionId={session.id} dimensions={result.dimensions} />

        <section className="mt-24 grid gap-8 border-t border-[var(--line)] pt-12 lg:grid-cols-[0.7fr_1.3fr]">
          <h2 className="font-serif text-3xl">尚未看清</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.uncertainties.map((uncertainty) => (
              <p
                key={uncertainty}
                className="border-l border-[var(--line)] pl-4 text-sm leading-relaxed text-[var(--muted)]"
              >
                {uncertainty}
              </p>
            ))}
          </div>
        </section>

        <section className="my-24 bg-[var(--ink)] px-5 py-12 text-[var(--paper)] sm:px-10 sm:py-16">
          <p className="font-mono text-xs tracking-[0.14em] text-[var(--paper)]/65">带走一个问题</p>
          <p className="mt-5 max-w-5xl font-serif text-3xl leading-snug sm:text-5xl">
            {result.nextQuestion}
          </p>
        </section>

        <FeedbackPanel sessionId={session.id} />

        <footer className="flex flex-col items-start justify-between gap-5 border-t border-[var(--line)] py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center">
          <p>这次显影不是诊断，也不会定义你。</p>
          <Link
            href="/explore"
            className="inline-flex min-h-11 items-center gap-2 text-[var(--ink)] underline underline-offset-4"
          >
            带另一件事进入镜室 <ArrowRight aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
