import { ArrowsClockwise, Check } from "@phosphor-icons/react";
import type { AnswerSuggestion } from "./types";

const lensLabels = {
  agency: "先看选择",
  conditions: "先看条件",
  integrated: "两边一起",
  uncertain: "保留判断",
} as const;

interface AnswerSuggestionsProps {
  suggestions: AnswerSuggestion[];
  selectedId: string | null;
  refreshing: boolean;
  source: string | undefined;
  disabled?: boolean;
  onSelect: (suggestion: AnswerSuggestion) => void;
  onRefresh: () => void;
}

export function AnswerSuggestions({
  suggestions,
  selectedId,
  refreshing,
  source,
  disabled = false,
  onSelect,
  onRefresh,
}: AnswerSuggestionsProps) {
  const isContextual = source === "deepseek" || source === "ai";

  return (
    <section
      className="mt-3 lg:mt-2.5"
      aria-labelledby="answer-suggestions-title"
      aria-busy={refreshing}
    >
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div>
          <h2 id="answer-suggestions-title" className="text-sm font-medium text-[var(--ink)]">
            哪句话更像你的真实想法
          </h2>
          <p className="mt-0.5 text-[0.7rem] leading-4 text-[var(--muted)]">
            例子只帮助理解，不会写进你的回答。手机上可左右滑动比较。
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={disabled || refreshing}
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 px-1 text-xs text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-55 motion-reduce:transition-none"
        >
          <ArrowsClockwise
            aria-hidden="true"
            size={17}
            className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined}
          />
          {refreshing ? "正在换一组" : "换一组"}
        </button>
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
          {suggestions.map((suggestion, index) => {
            const selected = suggestion.id === selectedId;
            const suggestedTitle = suggestion.title?.trim();
            const title =
              suggestedTitle ||
              (suggestion.lens ? lensLabels[suggestion.lens] : `选项 ${index + 1}`);
            const meta =
              suggestedTitle && suggestion.lens
                ? lensLabels[suggestion.lens]
                : String(index + 1).padStart(2, "0");
            return (
              <button
                key={suggestion.id}
                type="button"
                aria-pressed={selected}
                aria-controls="answer"
                disabled={disabled}
                onClick={() => onSelect(suggestion)}
                className={`group relative min-h-[8.75rem] w-[82vw] max-w-[20rem] shrink-0 snap-start cursor-pointer border px-3 py-3 text-left transition-[border-color,background-color,color,transform] duration-200 active:translate-y-px focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none sm:w-auto sm:max-w-none ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-solid)]"
                }`}
              >
                <span className="flex items-start justify-between gap-3 pr-7">
                  <span className="font-serif text-base leading-tight text-[var(--ink)]">
                    {title}
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[0.62rem] tracking-[0.08em] ${
                      selected ? "text-[var(--accent)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {meta}
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-[1.45] text-[var(--ink)]">
                  {suggestion.content}
                </span>
                {suggestion.example ? (
                  <span className="mt-2 block border-l-2 border-[var(--accent)] bg-[var(--surface)] px-2.5 py-2">
                    <span className="block font-mono text-[0.61rem] tracking-[0.08em] text-[var(--accent)]">
                      放到现实里
                    </span>
                    <span className="mt-0.5 block text-[0.78rem] leading-[1.45] text-[var(--ink)]">
                      {suggestion.example}
                    </span>
                  </span>
                ) : null}
                {selected ? (
                  <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                    <Check aria-hidden="true" size={12} weight="bold" />
                    <span className="sr-only">已选中</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 min-h-[5.15rem] border border-dashed border-[var(--line)] p-3.5 text-sm leading-relaxed text-[var(--muted)]">
          生成中，也可以直接写。
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {refreshing
          ? "正在更新候选回答"
          : isContextual
            ? `已结合前文更新 ${suggestions.length} 个候选回答`
            : `当前有 ${suggestions.length} 个候选回答`}
      </p>
    </section>
  );
}
