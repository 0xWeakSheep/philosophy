import { ArrowDownRight, Check, Quotes } from "@phosphor-icons/react/dist/ssr";
import type { BreakthroughClosure } from "@/components/session/types";

interface BreakthroughPlanProps {
  breakthrough: BreakthroughClosure;
}

const actionNumbers = ["01", "02", "03"] as const;

export function BreakthroughPlan({ breakthrough }: BreakthroughPlanProps) {
  return (
    <section
      aria-labelledby="breakthrough-title"
      className="relative isolate overflow-hidden bg-[#252927] px-5 py-7 text-[#f2f3f1] sm:px-8 sm:py-9 lg:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 top-5 size-36 rounded-full border border-[var(--accent)]/50"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#e58a7d]">
            BREAKTHROUGH
          </span>
          <span className="h-px w-7 bg-[var(--accent)]" />
          <span className="text-xs text-white/60">只处理这次命题</span>
        </div>
        <p className="font-mono text-[10px] tracking-[0.12em] text-white/60">
          {breakthrough.focusLabel} · {breakthrough.moveName}
        </p>
      </div>

      <div className="relative grid gap-9 pt-7 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
        <div>
          <div className="flex items-center gap-2 text-[#e58a7d]">
            <Quotes size={17} weight="fill" aria-hidden="true" />
            <p className="font-mono text-[10px] tracking-[0.15em]">先反驳一句</p>
          </div>
          <h2
            id="breakthrough-title"
            className="mt-4 max-w-xl font-serif text-[clamp(1.75rem,3.3vw,3.35rem)] leading-[1.08] text-white"
          >
            {breakthrough.directRebuttal.statement}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/65">
            {breakthrough.directRebuttal.reasoning}
          </p>

          <div className="mt-7 border-l-2 border-[var(--accent)] pl-4">
            <p className="font-mono text-[10px] tracking-[0.14em] text-white/45">改写命题</p>
            <p className="mt-2 font-serif text-xl leading-snug text-white/90">
              {breakthrough.reframe.to}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] text-[#e58a7d]">
                MINIMUM EXPERIMENT
              </p>
              <p className="mt-2 font-serif text-2xl text-white">一次最小破局</p>
            </div>
            <ArrowDownRight className="text-[var(--accent)]" size={26} aria-hidden="true" />
          </div>

          <ol className="mt-5 border-t border-white/15">
            {breakthrough.actions.map((action, index) => (
              <li
                key={action.kind}
                className="grid gap-2 border-b border-white/15 py-4 sm:grid-cols-[2.5rem_8rem_1fr] sm:gap-3"
              >
                <span className="font-mono text-xs text-[#e58a7d]">{actionNumbers[index]}</span>
                <p className="font-serif text-lg text-white">{action.title}</p>
                <div>
                  <p className="text-sm leading-6 text-white/75">{action.instruction}</p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-white/45">
                    <Check className="mt-0.5 shrink-0" size={13} aria-hidden="true" />
                    {action.completionSignal.replace(/^完成信号：/u, "")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <details className="relative mt-7 border-t border-white/15 pt-4 text-xs text-white/55">
        <summary className="min-h-8 cursor-pointer list-none font-mono tracking-[0.12em] text-white/70 [&::-webkit-details-marker]:hidden">
          这份方案在什么情况下失效？ ＋
        </summary>
        <div className="mt-3 grid gap-3 leading-5 sm:grid-cols-3">
          <p>{breakthrough.uncertaintyBoundary.supported}</p>
          <p>{breakthrough.uncertaintyBoundary.unknown}</p>
          <p>{breakthrough.uncertaintyBoundary.wouldChangeReading}</p>
        </div>
        {breakthrough.directRebuttal.source ? (
          <p className="mt-3 text-white/35">
            知识库依据：{breakthrough.directRebuttal.source.title}
          </p>
        ) : null}
      </details>
    </section>
  );
}
