import { ArrowRight, CheckCircle, Lightning, Path } from "@phosphor-icons/react/dist/ssr";
import type { AdjacentGrowthMove, GrowthStrength, GrowthTrouble } from "@/components/session/types";

export interface GrowthTransitionReadingProps {
  readonly frictionPoints: readonly GrowthTrouble[];
  readonly strengths: readonly GrowthStrength[];
  readonly transition: AdjacentGrowthMove;
  readonly scopeNote: string;
}

const stepOffsets = ["lg:mt-0", "lg:mt-6", "lg:mt-12"] as const;
const stepTitles = ["看见惯性", "做单变量实验", "带条件改写"] as const;

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function withoutExampleLead(value: string) {
  return value.replace(/^例如(?:[，,:：]\s*)?/u, "");
}

export function GrowthTransitionReadingPanel({
  frictionPoints,
  strengths,
  transition,
  scopeNote,
}: GrowthTransitionReadingProps) {
  return (
    <section
      aria-labelledby="growth-transition-title"
      className="relative isolate overflow-hidden border border-[var(--line-strong)] bg-[#252927] text-[#f2f3f1]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-14 -right-12 size-32 rounded-full border border-[#e58a7d]/40"
      />

      <header className="relative grid gap-5 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end lg:px-10">
        <div className="min-w-0">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-[#e58a7d]">
            FRICTION → LEVER → SHIFT
          </p>
          <h2
            id="growth-transition-title"
            className="mt-3 max-w-4xl font-serif text-[clamp(2rem,4.2vw,3.9rem)] leading-[1.05] text-white"
          >
            哪里容易卡住，怎样换挡
          </h2>
        </div>
        <p className="max-w-md border-l border-white/20 pl-4 text-sm leading-6 text-white/60 lg:justify-self-end">
          麻烦通常不是“性格不好”，而是原本有效的思路，在不合适的场景里用得太久。
        </p>
      </header>

      <div className="relative grid border-t border-white/15 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <section
          aria-labelledby="friction-points-title"
          className="min-w-0 px-5 py-7 sm:px-8 lg:px-10"
        >
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <p className="font-mono text-[0.62rem] tracking-[0.15em] text-[#e58a7d]">
                PRESSURE MAP
              </p>
              <h3 id="friction-points-title" className="mt-2 font-serif text-2xl text-white">
                最容易出现的摩擦
              </h3>
            </div>
            <p className="font-mono text-[0.62rem] tracking-[0.12em] text-white/55">
              {String(frictionPoints.length).padStart(2, "0")} 个高频情境
            </p>
          </div>

          <ol aria-label="容易遇到的纠结、焦虑与麻烦">
            {frictionPoints.map((point, index) => (
              <li
                key={`${point.title}-${point.trigger}`}
                className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] border-b border-white/15 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
              >
                <div className="relative flex flex-col items-center py-6" aria-hidden="true">
                  <span className="font-mono text-[0.65rem] tabular-nums text-[#e58a7d]">
                    {formatIndex(index)}
                  </span>
                  <span className="mt-2 h-full min-h-12 w-px bg-white/20" />
                  <span className="mt-2 size-2 rotate-45 bg-[#e58a7d]" />
                </div>

                <article className="min-w-0 py-6 pl-4 sm:pl-5">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.58fr)] sm:gap-7">
                    <div className="min-w-0">
                      <h4 className="break-words font-serif text-[clamp(1.35rem,2.2vw,1.85rem)] leading-snug text-white">
                        {point.title}
                      </h4>
                      <p className="mt-3 break-words text-sm leading-6 text-white/70">
                        <span className="mr-2 font-mono text-[0.62rem] tracking-[0.12em] text-[#e58a7d]">
                          触发
                        </span>
                        {point.trigger}
                      </p>
                      <p className="mt-3 break-words text-sm leading-6 text-white/80">
                        <span className="mr-2 font-mono text-[0.62rem] tracking-[0.12em] text-white/55">
                          可能的内心拉扯
                        </span>
                        {point.feltExperience}
                      </p>
                    </div>

                    <div className="min-w-0 border-l border-white/15 pl-4">
                      <p className="font-mono text-[0.62rem] tracking-[0.12em] text-white/55">
                        隐性代价
                      </p>
                      <p className="mt-2 break-words text-sm leading-6 text-white/70">
                        {point.hiddenCost}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 break-words bg-white/[0.07] px-4 py-3 text-sm leading-6 text-white/80">
                    <span className="mr-2 font-medium text-[#e58a7d]">例如</span>
                    {withoutExampleLead(point.concreteExample)}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <aside
          aria-labelledby="strength-levers-title"
          className="min-w-0 border-t border-white/15 bg-white/[0.035] px-5 py-7 sm:px-8 lg:border-t-0 lg:border-l lg:px-7"
        >
          <div className="flex items-center gap-3 text-[#e58a7d]">
            <Lightning size={18} weight="fill" aria-hidden="true" />
            <p className="font-mono text-[0.62rem] tracking-[0.15em]">LEVER</p>
          </div>
          <h3 id="strength-levers-title" className="mt-3 font-serif text-2xl text-white">
            你已经有的支点
          </h3>
          <p className="mt-2 text-xs leading-5 text-white/60">
            这些不是安慰，而是能被转移到新场景里的能力。
          </p>

          <ol className="mt-6 border-t border-white/15" aria-label="当前思维方式的优势">
            {strengths.map((strength, index) => (
              <li
                key={`${strength.title}-${strength.bestUse}`}
                className="border-b border-white/15 py-5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[0.62rem] text-[#e58a7d]" aria-hidden="true">
                    {formatIndex(index)}
                  </span>
                  <h4 className="break-words font-serif text-xl leading-snug text-white">
                    {strength.title}
                  </h4>
                </div>
                <p className="mt-3 break-words text-sm leading-6 text-white/70">
                  <span className="mr-2 text-xs text-white/60">能力用法</span>
                  {strength.bestUse}
                </p>
                <p className="mt-3 break-words border-l border-[#e58a7d] pl-3 text-xs leading-5 text-white/65">
                  <span className="mr-1 text-[#e58a7d]">例如</span>
                  {withoutExampleLead(strength.concreteExample)}
                </p>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <section
        aria-labelledby="transition-route-title"
        className="relative min-w-0 border-t border-white/15 bg-[var(--paper-deep)] px-5 py-8 text-[var(--ink)] sm:px-8 sm:py-10 lg:px-10"
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.72fr)_minmax(26rem,1.28fr)] xl:gap-14">
          <div className="min-w-0">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <Path size={19} weight="bold" aria-hidden="true" />
              <p className="font-mono text-[0.62rem] tracking-[0.15em]">SHIFT ROUTE</p>
            </div>
            <h3
              id="transition-route-title"
              className="mt-3 font-serif text-[clamp(1.8rem,3vw,3rem)] leading-tight"
            >
              下一步，不是换人格
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              只给当前惯性增加一种备用动作：当旧方法开始制造代价时，能够切到邻近维度。
            </p>

            <dl className="mt-7 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-y border-[var(--line-strong)] py-5">
              <div className="min-w-0">
                <dt className="font-mono text-[0.6rem] tracking-[0.11em] text-[var(--muted)]">
                  当前支点
                </dt>
                <dd className="mt-1 break-words font-serif text-xl leading-snug">
                  {transition.from}
                </dd>
              </div>
              <ArrowRight className="text-[var(--accent)]" size={20} aria-hidden="true" />
              <div className="min-w-0 text-right">
                <dt className="font-mono text-[0.6rem] tracking-[0.11em] text-[var(--accent)]">
                  练习支点
                </dt>
                <dd className="mt-1 break-words font-serif text-xl leading-snug">
                  {transition.to}
                </dd>
              </div>
            </dl>
          </div>

          <div
            className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
            data-focus-dimension={transition.focusDimension}
          >
            <div className="min-w-0">
              <p className="break-words font-mono text-[0.62rem] tracking-[0.14em] text-[var(--accent)]">
                聚焦维度 · {transition.focusLabel}
              </p>
              <p className="mt-2 break-words font-serif text-2xl leading-snug">
                {transition.moveName}
              </p>
              <p className="mt-4 break-words text-sm leading-7 text-[var(--muted)]">
                {transition.rationale}
              </p>

              <div className="mt-5 border-l-2 border-[var(--accent)] pl-4">
                <p className="text-[0.65rem] text-[var(--muted)]">角色换挡</p>
                <p className="mt-1 break-words text-sm leading-6">{transition.roleShift}</p>
              </div>

              <p className="mt-5 break-words border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
                <span className="mr-2 font-medium text-[var(--accent)]">借用这个视角的代价</span>
                {transition.tradeoff}
              </p>
            </div>

            <div className="border-l border-[var(--line-strong)] pl-4 sm:min-w-40 sm:text-right">
              <p className="text-xs text-[var(--muted)]">练习目标坐标</p>
              <p className="coordinate-type mt-1 whitespace-nowrap text-[clamp(2rem,4vw,3.4rem)] text-[var(--accent)]">
                {transition.targetCode}
              </p>
              {transition.targetName ? (
                <p className="mt-1 max-w-48 break-words font-serif text-lg leading-snug sm:ml-auto">
                  {transition.targetName}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--line-strong)] pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[0.62rem] tracking-[0.14em] text-[var(--accent)]">
                PRACTICE LADDER
              </p>
              <h3 className="mt-2 font-serif text-2xl">把转变练成三个小动作</h3>
            </div>
            <p className="max-w-sm text-xs leading-5 text-[var(--muted)]">
              不要求一次想通；每一步都有例子和完成信号。
            </p>
          </div>

          <ol
            aria-label="思维转轨练习步骤"
            className="relative mt-6 grid min-w-0 gap-5 lg:grid-cols-3 lg:gap-6"
          >
            {transition.steps.map((step, index) => (
              <li
                key={step.instruction}
                className={`relative min-w-0 border-t border-[var(--line-strong)] pt-5 ${
                  stepOffsets[index] ?? stepOffsets[stepOffsets.length - 1]
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center bg-[var(--accent)] font-mono text-[0.62rem] text-[var(--accent-contrast)]">
                    {formatIndex(index)}
                  </span>
                  <h4 className="font-serif text-xl leading-snug">
                    {stepTitles[index] ?? `第 ${index + 1} 步`}
                  </h4>
                </div>
                <p className="mt-4 break-words text-sm leading-6 text-[var(--muted)]">
                  {step.instruction}
                </p>
                <p className="mt-4 break-words bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6">
                  <span className="mr-2 font-medium text-[var(--accent)]">例如</span>
                  {withoutExampleLead(step.concreteExample)}
                </p>
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
                  <CheckCircle
                    className="mt-0.5 shrink-0 text-[var(--accent)]"
                    size={15}
                    weight="fill"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">
                    <span className="mr-1 text-[var(--ink)]">完成信号</span>
                    {step.completionSignal.replace(/^完成信号[：:]\s*/u, "")}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-12 break-words border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
          {scopeNote}
        </p>
      </section>
    </section>
  );
}
