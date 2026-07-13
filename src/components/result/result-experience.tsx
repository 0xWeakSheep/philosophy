"use client";

import { ArrowLeft, ArrowRight, CaretDown, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { MirrorChamber } from "@/components/session/mirror-chamber";
import type { DimensionKey, MirrorSession } from "@/components/session/types";
import { unwrapSession } from "@/components/session/types";
import { createWorldviewProfile } from "@/lib/worldview-profile";
import { BreakthroughPlan } from "./breakthrough-plan";
import { CounterfactualLab } from "./counterfactual-lab";
import { FeedbackPanel } from "./feedback-panel";
import { HypothesisReview } from "./hypothesis-review";
import { WorldviewCube } from "./worldview-cube";

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
        if (!response.ok) throw new Error("这次结果不存在，或已经被删除");
        setSession(unwrapSession(await response.json()));
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "读取失败");
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
  const profile = useMemo(() => {
    if (!session?.result) return null;
    try {
      return createWorldviewProfile(session.result.dimensions, session.topic);
    } catch {
      return null;
    }
  }, [session]);

  async function deleteSession() {
    if (!session || !window.confirm("删除这次结果？")) return;
    await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return (
      <main id="main-content" className="min-h-[100dvh] bg-[var(--paper)] px-5 py-8">
        <div className="mx-auto max-w-[1400px] animate-pulse">
          <div className="h-12 border-b border-[var(--line)]" />
          <div className="mt-8 h-[36rem] bg-[var(--mirror)]" />
        </div>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main id="main-content" className="grid min-h-[100dvh] place-items-center px-5">
        <div className="border-l-2 border-[var(--accent)] pl-5">
          <p role="alert" className="font-serif text-2xl">
            {error || "没有找到结果"}
          </p>
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2" href="/explore">
            <ArrowLeft aria-hidden="true" /> 重新开始
          </Link>
        </div>
      </main>
    );
  }

  if (!session.result) {
    return (
      <main id="main-content" className="grid min-h-[100dvh] place-items-center px-5">
        <div>
          <h1 className="font-serif text-3xl">坐标还没生成</h1>
          <Link
            className="mt-6 inline-flex min-h-11 items-center gap-2"
            href={`/session/${session.id}`}
          >
            继续回答 <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main id="main-content" className="grid min-h-[100dvh] place-items-center px-5">
        <div className="max-w-md border-l-2 border-[var(--accent)] pl-5">
          <h1 className="display-type text-3xl">这份旧结果缺少完整四轴</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            新坐标需要场域、本体、现象、目的四个维度各完成一次显影。
          </p>
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2" href="/explore">
            重新生成 <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  const result = session.result;

  return (
    <main
      id="main-content"
      className="paper-grain min-h-[100dvh] bg-[var(--paper)] px-4 py-4 text-[var(--ink)] sm:px-6 sm:py-5"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="flex min-h-12 items-center justify-between border-b border-[var(--line)]">
          <Link href="/" className="font-serif text-lg">
            意识形态镜室
          </Link>
          <button
            type="button"
            onClick={deleteSession}
            className="inline-flex size-11 items-center justify-center text-[var(--muted)] hover:text-[var(--accent)]"
            aria-label="删除这次结果"
          >
            <Trash aria-hidden="true" size={18} />
          </button>
        </header>

        <section className="py-7 sm:py-9" aria-label="世界观身份卡">
          <WorldviewCube profile={profile} />
        </section>

        {result.breakthrough ? (
          <BreakthroughPlan breakthrough={result.breakthrough} />
        ) : (
          <div className="border-y border-[var(--line)] py-5">
            <p className="font-serif text-xl text-[var(--ink)]">{profile.blindSpot}</p>
          </div>
        )}

        <CounterfactualLab sessionId={session.id} dimensions={result.dimensions} />

        <section className="mt-14 border-t border-[var(--line)]" aria-label="结果详情">
          <ResultDetails title="为什么是这个坐标" hint="原话与三条读法">
            <div className="py-8">
              <MirrorChamber
                compact
                dimensions={result.dimensions}
                revealed={4}
                interactive
                onDimensionChange={setActiveDimension}
                windowQuestion={result.window.question}
              />
              {activeSignal ? (
                <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-sm text-[var(--muted)]">
                  {dimensionNames[activeSignal.dimension]}：{activeSignal.observation}
                </p>
              ) : null}
              <HypothesisReview
                sessionId={session.id}
                hypotheses={result.hypotheses}
                onSessionChange={setSession}
              />
            </div>
          </ResultDetails>

          <ResultDetails title="现实盲区" hint={`${result.window.externalFactors.length} 条提醒`}>
            <div className="grid gap-6 py-8 lg:grid-cols-[0.8fr_1.2fr]">
              <p className="font-serif text-2xl leading-snug">{result.window.question}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.window.externalFactors.map((factor) => (
                  <p
                    key={factor}
                    className="border-l border-[var(--accent)] pl-3 text-sm text-[var(--muted)]"
                  >
                    {factor}
                  </p>
                ))}
              </div>
            </div>
          </ResultDetails>

          {result.knowledge ? (
            <ResultDetails title="知识库命中" hint={result.knowledge.code}>
              <div className="grid gap-7 py-8 lg:grid-cols-[0.78fr_1.22fr]">
                <div>
                  <p className="coordinate-type text-3xl text-[var(--accent)]">
                    {result.knowledge.code}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl">{result.knowledge.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {result.knowledge.summary}
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <KnowledgeList title="可能能力" items={result.knowledge.capabilities} />
                  <KnowledgeList title="典型盲区" items={result.knowledge.blindSpots} />
                  <div className="sm:col-span-2">
                    <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--muted)]">
                      SOURCES
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {result.knowledge.sources.slice(0, 4).map((source) => (
                        <p
                          key={`${source.kind}-${source.sourcePath}`}
                          className="border-l border-[var(--line-strong)] pl-3 text-xs leading-5 text-[var(--muted)]"
                        >
                          <span className="text-[var(--ink)]">{source.title}</span>
                          <br />
                          {source.sourcePath}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ResultDetails>
          ) : null}

          <ResultDetails title="给镜室反馈" hint="可选">
            <FeedbackPanel sessionId={session.id} />
          </ResultDetails>
        </section>

        <footer className="flex justify-end py-8">
          <Link href="/explore" className="inline-flex min-h-11 items-center gap-2 text-sm">
            再生成一个 <ArrowRight aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  );
}

function KnowledgeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--muted)]">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.slice(0, 3).map((item) => (
          <p key={item} className="border-l border-[var(--accent)] pl-3 text-sm leading-6">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function ResultDetails({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-b border-[var(--line)]">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-serif text-xl">{title}</span>
        <span className="flex items-center gap-3 text-xs text-[var(--muted)]">
          {hint}
          <CaretDown
            aria-hidden="true"
            className="transition-transform duration-200 group-open:rotate-180"
          />
        </span>
      </summary>
      {children}
    </details>
  );
}
