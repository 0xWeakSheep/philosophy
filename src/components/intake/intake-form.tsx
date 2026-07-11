"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/ArrowRight";
import { LockSimpleIcon } from "@phosphor-icons/react/LockSimple";
import { WarningCircleIcon } from "@phosphor-icons/react/WarningCircle";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

const MIN_LENGTH = 24;
const MAX_LENGTH = 2000;

const examples = [
  {
    short: "我明明生气，却总说没关系",
    full: "对方临时取消约会后，我很生气，却告诉自己成熟的人不该计较。我最后说没关系，但之后会冷淡好几天。",
  },
  {
    short: "对方不回复，我就觉得自己不重要",
    full: "当对方很久不回复时，我会立刻想到自己不重要。我通常不问，而是反复查看消息，最后先疏远对方。",
  },
] as const;

type ApiData = {
  id?: unknown;
  sessionId?: unknown;
  session?: { id?: unknown };
  error?: unknown;
  message?: unknown;
};

function readSessionId(data: ApiData): string | null {
  const candidate = data.session?.id ?? data.sessionId ?? data.id;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}

function readApiError(data: ApiData): string | null {
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    return data.error.message;
  }
  return null;
}

export function IntakeForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [consented, setConsented] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedLength = input.trim().length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedInput = input.trim();
    if (normalizedInput.length < MIN_LENGTH) {
      setError(`再多写一点具体经过吧，至少需要 ${MIN_LENGTH} 个字。`);
      return;
    }
    if (!consented) {
      setError("请先确认你理解这是一项非诊断的自我探索。");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: normalizedInput }),
      });
      const data = (await response.json().catch(() => ({}))) as ApiData;
      if (!response.ok) {
        throw new Error(readApiError(data) ?? "暂时没能创建这次探索，请稍后再试。");
      }

      const sessionId = readSessionId(data);
      if (!sessionId) {
        throw new Error("已经收到你的文字，但没有拿到会话编号。请重试一次。");
      }

      router.push(`/session/${encodeURIComponent(sessionId)}`);
    } catch (caught) {
      setPending(false);
      setError(caught instanceof Error ? caught.message : "连接暂时中断，请检查网络后再试。");
    }
  }

  return (
    <form className="relative" noValidate onSubmit={handleSubmit}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <label className="block text-base font-semibold" htmlFor="intake">
            发生了什么？
          </label>
          <p className="max-w-xl text-sm leading-6 text-[var(--muted)]" id="intake-helper">
            写清楚发生的事、最难受的地方，以及你通常会怎么做。不必分析自己。
          </p>
        </div>
        <span
          className={`mono-label shrink-0 text-xs ${normalizedLength > MAX_LENGTH ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
        >
          {normalizedLength}/{MAX_LENGTH}
        </span>
      </div>

      <textarea
        aria-describedby="intake-helper intake-error"
        aria-invalid={error ? true : undefined}
        autoComplete="off"
        className="intake-textarea mt-5"
        disabled={pending}
        id="intake"
        maxLength={MAX_LENGTH}
        onChange={(event) => setInput(event.target.value)}
        placeholder="例如：上周他又临时取消了约会。我很生气，却还是说没关系……"
        rows={8}
        value={input}
      />

      <div className="mt-5">
        <p className="text-xs font-medium text-[var(--muted)]">不知道从哪里写，可以借一句开头</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {examples.map((example) => (
            <button
              className="example-prompt"
              disabled={pending}
              key={example.short}
              onClick={() => {
                setInput(example.full);
                setError(null);
              }}
              type="button"
            >
              “{example.short}”
            </button>
          ))}
        </div>
      </div>

      <label className="mt-7 flex cursor-pointer items-start gap-3 border-t hairline pt-6 text-sm leading-6">
        <input
          checked={consented}
          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          disabled={pending}
          onChange={(event) => {
            setConsented(event.target.checked);
            setError(null);
          }}
          type="checkbox"
        />
        <span>
          我理解：这不是心理治疗、诊断或人格测评。接下来出现的读法只是临时假设，我可以随时反驳或退出。
        </span>
      </label>

      <div className="mt-5 min-h-7" id="intake-error">
        {error ? (
          <p className="flex items-start gap-2 text-sm leading-6 text-[var(--accent)]" role="alert">
            <WarningCircleIcon
              aria-hidden="true"
              className="mt-1 shrink-0"
              size={16}
              weight="regular"
            />
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs leading-5 text-[var(--muted)]">
          <LockSimpleIcon aria-hidden="true" size={15} weight="regular" />
          本次内容默认私密，之后可以删除
        </p>
        <button
          className="action-primary relative min-w-44 overflow-hidden"
          disabled={pending || normalizedLength > MAX_LENGTH}
          type="submit"
        >
          {pending ? "正在准备第一问" : "开始显影"}
          {pending ? null : <ArrowRightIcon aria-hidden="true" size={18} weight="regular" />}
          {pending ? <span aria-hidden="true" className="submit-progress" /> : null}
        </button>
      </div>
    </form>
  );
}
