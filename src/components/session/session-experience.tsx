"use client";

import { ArrowLeft, ArrowRight, Trash, Warning } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnswerSuggestions } from "./answer-suggestions";
import { MirrorChamber } from "./mirror-chamber";
import { ThoughtPortrait } from "./thought-portrait";
import type { AnswerSuggestion, MirrorSession, SessionMessage } from "./types";
import { suggestionAnswerText, unwrapAnswerSuggestions, unwrapSession } from "./types";

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

async function requestAnswerSuggestions(sessionId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/sessions/${sessionId}/suggestions`, {
    method: "POST",
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    throw new Error("候选更新失败");
  }
  return unwrapAnswerSuggestions(await response.json());
}

export function SessionExperience({ sessionId }: SessionExperienceProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [session, setSession] = useState<MirrorSession | null>(null);
  const [answer, setAnswer] = useState("");
  const answerRef = useRef("");
  const suggestionAbortRef = useRef<AbortController | null>(null);
  const suggestionRequestRef = useRef(0);
  const [suggestions, setSuggestions] = useState<AnswerSuggestion[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [suggestionSource, setSuggestionSource] = useState<string | undefined>();
  const [refreshingSuggestions, setRefreshingSuggestions] = useState(false);
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
        if (!response.ok) throw new Error("这次探索不存在或已删除");
        const nextSession = unwrapSession(await response.json());
        setSession(nextSession);
        setSuggestions(nextSession.suggestions ?? []);
        setSuggestionSource(nextSession.suggestions?.length ? "local" : undefined);
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
  const suggestionQuestionId =
    session?.stage === "topic_confirm" || session?.stage === "questioning"
      ? assistantMessage?.id
      : undefined;

  useEffect(() => {
    if (!suggestionQuestionId) return;
    suggestionAbortRef.current?.abort();
    const controller = new AbortController();
    suggestionAbortRef.current = controller;
    const requestId = ++suggestionRequestRef.current;

    async function refreshInBackground() {
      try {
        const payload = await requestAnswerSuggestions(sessionId, controller.signal);
        if (requestId === suggestionRequestRef.current && answerRef.current.trim().length === 0) {
          setSuggestions(payload.suggestions);
          setSuggestionSource(payload.source);
          setSelectedSuggestionId(null);
        }
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
      }
    }

    void refreshInBackground();
    return () => {
      controller.abort();
      if (suggestionAbortRef.current === controller) suggestionAbortRef.current = null;
    };
  }, [sessionId, suggestionQuestionId]);

  useEffect(
    () => () => {
      suggestionAbortRef.current?.abort();
    },
    [],
  );

  function selectSuggestion(suggestion: AnswerSuggestion) {
    const content = suggestionAnswerText(suggestion);
    answerRef.current = content;
    setAnswer(content);
    setSelectedSuggestionId(suggestion.id);
    setError("");
  }

  function updateAnswer(content: string) {
    answerRef.current = content;
    setAnswer(content);
    setSelectedSuggestionId(
      suggestions.find((suggestion) => suggestionAnswerText(suggestion) === content)?.id ?? null,
    );
    if (error) setError("");
  }

  async function refreshAnswerSuggestions() {
    if (!session || refreshingSuggestions) return;
    suggestionAbortRef.current?.abort();
    const controller = new AbortController();
    suggestionAbortRef.current = controller;
    const requestId = ++suggestionRequestRef.current;
    setRefreshingSuggestions(true);
    try {
      const payload = await requestAnswerSuggestions(session.id, controller.signal);
      if (requestId !== suggestionRequestRef.current) return;
      setSuggestions(payload.suggestions);
      setSuggestionSource(payload.source);
      setSelectedSuggestionId(null);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      // Existing local suggestions stay usable when the optional AI refinement is unavailable.
    } finally {
      if (requestId === suggestionRequestRef.current && !controller.signal.aborted) {
        setRefreshingSuggestions(false);
      }
      if (suggestionAbortRef.current === controller) suggestionAbortRef.current = null;
    }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = answer.trim();
    if (content.length < 2 || !session) {
      setError("请先写下一句话");
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
        throw new Error(typeof payload.error === "string" ? payload.error : "暂时无法保存");
      }
      const nextSession = unwrapSession(payload);
      suggestionAbortRef.current?.abort();
      suggestionAbortRef.current = null;
      suggestionRequestRef.current += 1;
      setSession(nextSession);
      setSuggestions(nextSession.suggestions ?? []);
      setSuggestionSource(nextSession.suggestions?.length ? "local" : undefined);
      setAnswer("");
      answerRef.current = "";
      setSelectedSuggestionId(null);
      setRefreshingSuggestions(false);
      if (nextSession.stage === "result") {
        router.push(`/session/${nextSession.id}/result`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "发送失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSession() {
    if (!session || !window.confirm("确定删除这次探索？")) return;
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
            <ArrowLeft aria-hidden="true" /> 重新开始
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
          <h1 className="mt-6 font-serif text-3xl leading-tight sm:text-5xl">先保证安全</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            这段内容可能涉及正在发生的危险。镜室不会继续分析；请联系当地紧急服务或能立即在场的人。
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
      className="paper-grain min-h-[100dvh] bg-[var(--paper)] px-4 py-4 text-[var(--ink)] sm:px-6 sm:py-5"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="flex min-h-12 items-center justify-between gap-4 border-b border-[var(--line)]">
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

        <div className="grid gap-8 py-6 lg:h-[calc(100dvh-5.5rem)] lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-10 lg:py-4 xl:grid-cols-[minmax(21rem,0.68fr)_minmax(0,1.32fr)] xl:gap-14">
          <section
            className="order-2 min-w-0 lg:order-1 lg:flex lg:min-h-0 lg:flex-col lg:justify-center lg:gap-3"
            aria-labelledby="mirror-state-title"
          >
            <h2 id="mirror-state-title" className="sr-only">
              当前显影状态
            </h2>
            <div className="min-h-56 overflow-hidden lg:min-h-0 lg:shrink">
              <ThoughtPortrait
                messages={session.messages}
                revealed={session.questionIndex}
                marker={session.marker}
              />
            </div>
            <div className="mt-3 shrink-0 lg:mt-0">
              <MirrorChamber compact revealed={session.questionIndex} />
            </div>
          </section>

          <section
            className="order-1 min-w-0 lg:order-2 lg:w-full lg:self-center"
            aria-labelledby="current-question"
          >
            {userMessage ? (
              <div className="mb-1 flex max-w-3xl items-center gap-2.5 border-l border-[var(--line)] pl-3">
                <span className="shrink-0 font-mono text-[0.65rem] tracking-[0.12em] text-[var(--muted)]">
                  上一句
                </span>
                <blockquote className="line-clamp-1 text-xs leading-relaxed text-[var(--muted)]">
                  {highlightedText(userMessage.content, session.marker)}
                </blockquote>
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              <motion.div
                key={assistantMessage?.id ?? progress}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                {...(reduceMotion ? {} : { exit: { opacity: 0, y: -8 } })}
                transition={{ duration: 0.32 }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-px w-7 bg-[var(--accent)]" aria-hidden="true" />
                  <p className="font-mono text-[0.68rem] tracking-[0.15em] text-[var(--accent)]">
                    追问
                  </p>
                </div>
                <h1
                  id="current-question"
                  className="question-type mt-1 max-w-3xl text-[clamp(1.5rem,2vw,2.1rem)]"
                >
                  {assistantMessage?.content ?? "你愿意先停在哪一句话上？"}
                </h1>
                {assistantMessage?.example ? (
                  <div className="mt-2.5 flex max-w-3xl items-start gap-3 border-l-2 border-[var(--accent)] bg-[var(--surface)] px-3 py-2">
                    <span className="shrink-0 pt-0.5 font-mono text-[0.62rem] tracking-[0.13em] text-[var(--accent)]">
                      放到现实里
                    </span>
                    <p className="text-[0.82rem] leading-[1.55] text-[var(--muted)]">
                      {assistantMessage.example}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <AnswerSuggestions
              suggestions={suggestions}
              selectedId={selectedSuggestionId}
              refreshing={refreshingSuggestions}
              source={suggestionSource}
              disabled={submitting}
              onSelect={selectSuggestion}
              onRefresh={refreshAnswerSuggestions}
            />

            <form className="mt-3" onSubmit={submitAnswer}>
              <label
                htmlFor="answer"
                className="block font-mono text-[0.7rem] tracking-[0.1em] text-[var(--ink)]"
              >
                你的回答
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(event) => updateAnswer(event.target.value)}
                disabled={submitting}
                rows={2}
                maxLength={1800}
                className="mt-2 min-h-16 w-full resize-y border border-[var(--line)] bg-transparent px-3.5 py-2 font-serif text-[0.95rem] leading-[1.5] tracking-[-0.01em] text-[var(--ink)] outline-none transition-colors duration-200 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60"
                placeholder="可改写已选答案，或自己写。"
                aria-describedby={error ? "answer-help answer-error" : "answer-help"}
              />
              <div className="mt-1.5 flex min-h-11 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p id="answer-help" className="sr-only">
                  候选回答可以修改，最终以输入框内容为准。
                </p>
                {error ? (
                  <p
                    id="answer-error"
                    role="alert"
                    className="text-xs leading-relaxed text-[var(--accent)]"
                  >
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting || answer.trim().length < 2}
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap bg-[var(--ink)] px-6 text-sm font-medium text-[var(--paper)] transition-[transform,background-color,opacity] duration-200 hover:bg-[var(--accent-strong)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] sm:ml-auto"
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
