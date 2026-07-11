"use client";

import { ArrowLeft, ArrowRight, Trash, Warning } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { MirrorChamber } from "./mirror-chamber";
import type { MirrorSession, SessionMessage } from "./types";
import { unwrapSession } from "./types";

interface SessionExperienceProps {
  sessionId: string;
}

function lastMessage(messages: SessionMessage[], roles: SessionMessage["role"][]) {
  return [...messages].reverse().find((message) => roles.includes(message.role));
}

function highlightedText(text: string, marker: string) {
  if (!marker || !text.includes(marker)) return text;
  const [before, ...rest] = text.split(marker);
  return (
    <>
      {before}
      <mark className="bg-transparent font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/35 underline-offset-4">
        {marker}
      </mark>
      {rest.join(marker)}
    </>
  );
}

export function SessionExperience({ sessionId }: SessionExperienceProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [session, setSession] = useState<MirrorSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadSession() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("没有找到这次探索，或它已经被删除");
        const nextSession = unwrapSession(await response.json());
        setSession(nextSession);
        if (nextSession.stage === "result") {
          router.replace(`/session/${sessionId}/result`);
        }
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "读取会话失败");
      } finally {
        setLoading(false);
      }
    }
    void loadSession();
    return () => controller.abort();
  }, [router, sessionId]);

  const assistantMessage = useMemo(
    () => (session ? lastMessage(session.messages, ["assistant", "mirror"]) : undefined),
    [session],
  );
  const userMessage = useMemo(
    () => (session ? lastMessage(session.messages, ["user"]) : undefined),
    [session],
  );

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = answer.trim();
    if (content.length < 2 || !session) {
      setError("先写下你此刻真正想说的一句话");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${session.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string" ? payload.error : "这句话暂时没有保存成功",
        );
      }
      const nextSession = unwrapSession(payload);
      setSession(nextSession);
      setAnswer("");
      if (nextSession.stage === "result") {
        router.push(`/session/${nextSession.id}/result`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "发送失败，请再试一次");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSession() {
    if (!session || !window.confirm("删除后无法恢复。确定离开这间镜室吗？")) return;
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
          <div className="mt-24 grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="h-72 bg-[var(--mirror)]" />
            <div className="space-y-5">
              <div className="h-4 w-28 bg-[var(--mirror)]" />
              <div className="h-20 max-w-2xl bg-[var(--mirror)]" />
              <div className="h-32 bg-[var(--mirror)]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main
        id="main-content"
        className="grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5 text-[var(--ink)]"
      >
        <div className="max-w-md border-l-2 border-[var(--accent)] pl-5">
          <p role="alert" className="text-xl font-medium">
            {error}
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
            href="/explore"
          >
            <ArrowLeft aria-hidden="true" /> 重新进入
          </Link>
        </div>
      </main>
    );
  }

  if (!session) return null;

  if (session.stage === "safety_stop") {
    return (
      <main
        id="main-content"
        className="min-h-[100dvh] bg-[var(--paper)] px-5 py-8 text-[var(--ink)]"
      >
        <div className="mx-auto max-w-3xl pt-20">
          <Warning className="text-[var(--accent)]" size={32} weight="light" aria-hidden="true" />
          <h1 className="mt-6 font-serif text-3xl leading-tight sm:text-5xl">
            先把你的安全放在解释之前
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            这段表达可能涉及正在发生的伤害或危机。镜室不会继续分析你，也不能替代现实中的专业支持。
            如果你正处在即时危险中，请联系当地紧急服务，或尽快找到你信任且能在场的人。
          </p>
          <Link
            className="mt-10 inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
            href="/"
          >
            <ArrowLeft aria-hidden="true" /> 返回首页
          </Link>
        </div>
      </main>
    );
  }

  const progress = Math.min(session.questionIndex + 1, session.totalQuestions);

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
            <p className="font-mono text-xs text-[var(--muted)]">
              <span className="sr-only">
                当前第 {progress} 个问题，共 {session.totalQuestions} 个
              </span>
              <span aria-hidden="true">
                {progress} / {session.totalQuestions}
              </span>
            </p>
            <button
              type="button"
              onClick={deleteSession}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-[var(--muted)] transition-colors duration-200 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label="删除并离开这次探索"
            >
              <Trash aria-hidden="true" size={19} weight="light" />
            </button>
          </div>
        </header>

        <div className="grid gap-12 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20 lg:py-16">
          <section aria-labelledby="mirror-state-title">
            <h2 id="mirror-state-title" className="sr-only">
              当前显影状态
            </h2>
            <MirrorChamber revealed={session.questionIndex} />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--muted)]">
              每一次回答只让一面镜子稍微清楚。没有证据的地方会继续保持模糊。
            </p>
          </section>

          <section className="min-w-0" aria-labelledby="current-question">
            {userMessage ? (
              <blockquote className="mb-9 max-w-2xl border-l border-[var(--line)] pl-4 text-sm leading-relaxed text-[var(--muted)]">
                {highlightedText(userMessage.content, session.marker)}
              </blockquote>
            ) : null}

            <AnimatePresence mode="wait">
              <motion.div
                key={assistantMessage?.id ?? progress}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                {...(reduceMotion ? {} : { exit: { opacity: 0, y: -8 } })}
                transition={{ duration: 0.32 }}
              >
                <p className="font-mono text-xs tracking-[0.14em] text-[var(--accent)]">
                  只看一个问题
                </p>
                <h1
                  id="current-question"
                  className="mt-4 max-w-3xl font-serif text-3xl leading-[1.25] text-balance sm:text-5xl lg:text-[3.35rem]"
                >
                  {assistantMessage?.content ?? "你愿意先停在哪一句话上？"}
                </h1>
              </motion.div>
            </AnimatePresence>

            <form className="mt-10" onSubmit={submitAnswer}>
              <label htmlFor="answer" className="block text-sm font-medium text-[var(--ink)]">
                你的回答
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={submitting}
                rows={5}
                maxLength={1800}
                className="mt-3 min-h-36 w-full resize-y border border-[var(--line)] bg-transparent p-4 text-base leading-relaxed text-[var(--ink)] outline-none transition-colors duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60"
                placeholder="不用把它说得完整。先写最接近你的那一句。"
                aria-describedby={error ? "answer-error" : "answer-help"}
              />
              <div className="mt-3 flex min-h-11 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <p
                  id={error ? "answer-error" : "answer-help"}
                  role={error ? "alert" : undefined}
                  className={`text-sm ${error ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                >
                  {error || "每次只回答一个问题。你随时可以停下或删除。"}
                </p>
                <button
                  type="submit"
                  disabled={submitting || answer.trim().length < 2}
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 whitespace-nowrap bg-[var(--ink)] px-6 text-sm font-medium text-[var(--paper)] transition-[transform,background-color,opacity] duration-200 hover:bg-[var(--accent-strong)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                >
                  {submitting ? "正在显影" : "继续"}
                  <ArrowRight aria-hidden="true" size={17} />
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
