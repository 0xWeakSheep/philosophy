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
    short: "努力与起点",
    full: "两个人付出相近的努力，却因为起点和资源不同，得到完全不同的机会。我仍觉得人该为自己的选择负责，但把结果只归因于努力，也不诚实。",
  },
  {
    short: "AI 作品的价值",
    full: "一幅作品确实让我受到触动，但得知它完全由 AI 生成后，我立刻觉得它少了什么。我不确定价值来自作品产生的效果，还是创作者的意图与经验。",
  },
  {
    short: "规则相同就公平吗",
    full: "一项规则得到多数人同意，也对所有人使用同一标准，但它持续让起点更低的人承担更多成本。我不确定它还能不能算公平。",
  },
  {
    short: "AI 会替代程序员吗",
    full: "AI 写代码越来越快，我担心程序员积累多年的经验会迅速失去价值。工具确实提高了效率，但我不确定这种焦虑来自真实的岗位变化，还是来自不断被放大的竞争叙事。",
  },
  {
    short: "一直学习才不会落后吗",
    full: "新工具和新概念每天都在出现，我一停下来就担心自己会落后。但如果所有人都被迫持续追赶，问题也许不只是个人是否努力，而是工作如何分配安全感和淘汰成本。",
  },
  {
    short: "算法比我更懂自己吗",
    full: "推荐算法常常比朋友更快猜中我想看什么，这让我觉得方便，也让我不安。我不确定它是在理解我的偏好，还是在不断缩小我能够遇见的世界。",
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
      setError(`至少写 ${MIN_LENGTH} 个字。`);
      return;
    }
    if (!consented) {
      setError("请先确认使用边界。");
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
        throw new Error(readApiError(data) ?? "暂时无法开始，请重试。");
      }

      const sessionId = readSessionId(data);
      if (!sessionId) {
        throw new Error("会话创建失败，请重试。");
      }

      router.push(`/session/${encodeURIComponent(sessionId)}`);
    } catch (caught) {
      setPending(false);
      setError(caught instanceof Error ? caught.message : "连接中断，请重试。");
    }
  }

  return (
    <form className="relative" noValidate onSubmit={handleSubmit}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <label className="block text-base font-semibold" htmlFor="intake">
            你的判断
          </label>
          <p className="max-w-xl text-sm leading-6 text-[var(--muted)]" id="intake-helper">
            写下判断和犹豫。不必先选唯心或唯物。
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
        placeholder="例如：我相信努力能改变处境，但相近的付出为何会得到不同结果……"
        rows={6}
        value={input}
      />

      <div className="mt-5">
        <p className="text-xs font-medium text-[var(--muted)]">没有头绪？选一个再改</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
        <span>我理解：这不是人格测试，只描述这个问题里的解释顺序；我可以反驳、退出或删除。</span>
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
          私密 · 可删除
        </p>
        <button
          className="action-primary relative min-w-44 overflow-hidden"
          disabled={pending || normalizedLength > MAX_LENGTH}
          type="submit"
        >
          {pending ? "准备中" : "开始显影"}
          {pending ? null : <ArrowRightIcon aria-hidden="true" size={18} weight="regular" />}
          {pending ? <span aria-hidden="true" className="submit-progress" /> : null}
        </button>
      </div>
    </form>
  );
}
