import { ArrowsClockwise, Check } from "@phosphor-icons/react";
import type { AnswerSuggestion } from "./types";

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
      className="mt-4 lg:mt-3"
      aria-labelledby="answer-suggestions-title"
      aria-busy={refreshing}
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h2
          id="answer-suggestions-title"
          className="shrink-0 font-mono text-[0.7rem] tracking-[0.13em] text-[var(--ink)]"
        >
          备选回答
        </h2>
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
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
          {suggestions.map((suggestion, index) => {
            const selected = suggestion.id === selectedId;
            return (
              <button
                key={suggestion.id}
                type="button"
                aria-pressed={selected}
                aria-controls="answer"
                disabled={disabled}
                onClick={() => onSelect(suggestion)}
                className={`group relative min-h-[4.45rem] cursor-pointer border px-3 py-2 pr-10 text-left transition-[border-color,background-color,color] duration-200 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-solid)]"
                }`}
              >
                <span
                  className={`font-mono text-[0.64rem] tracking-[0.14em] ${
                    selected ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-0.5 line-clamp-3 block font-serif text-[0.875rem] leading-[1.4] tracking-[-0.01em] text-[var(--ink)]">
                  {suggestion.content}
                </span>
                {selected ? (
                  <span className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                    <Check aria-hidden="true" size={14} weight="bold" />
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
