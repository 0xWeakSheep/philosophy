export interface PracticalResultSummaryProps {
  readonly canonicalName: string;
  readonly code: string;
  readonly plainSummary: string;
  readonly teamScenario?: string;
  readonly strengths: readonly string[];
  readonly blindSpots: readonly string[];
  readonly nameExplanation: string;
  readonly verificationQuestion: string;
  readonly scopeNote: string;
  readonly showCapabilityLists?: boolean;
  readonly showVerification?: boolean;
}

interface ReadingListProps {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly string[];
}

function ReadingList({ id, title, description, items }: ReadingListProps) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-serif text-2xl leading-tight">
        {title}
      </h2>
      <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{description}</p>
      <ul className="mt-5 space-y-3">
        {items.slice(0, 3).map((item) => (
          <li
            key={item}
            className="border-l-2 border-[var(--accent)] pl-3 text-sm leading-6 text-[var(--ink)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PracticalResultSummary({
  canonicalName,
  code,
  plainSummary,
  teamScenario,
  strengths,
  blindSpots,
  nameExplanation,
  verificationQuestion,
  scopeNote,
  showCapabilityLists = true,
  showVerification = true,
}: PracticalResultSummaryProps) {
  return (
    <section
      className="relative isolate overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-deep)] text-[var(--ink)]"
      aria-labelledby="practical-result-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[var(--accent)]"
      />

      <header className="grid gap-7 px-5 pt-6 pb-7 sm:px-7 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10 lg:pt-9 lg:pb-10">
        <div className="min-w-0">
          <p className="font-mono text-[0.68rem] tracking-[0.13em] text-[var(--accent)]">
            你在这次议题上的思想姿态
          </p>
          <h1
            id="practical-result-title"
            className="display-type mt-3 max-w-4xl text-[clamp(2.15rem,5vw,4.4rem)]"
          >
            {canonicalName}
          </h1>
          <p className="mt-4 max-w-[52rem] font-serif text-[clamp(1.15rem,2vw,1.55rem)] leading-[1.55] text-[var(--muted)]">
            {plainSummary}
          </p>
        </div>

        <div className="border-l border-[var(--line-strong)] pl-4 lg:min-w-56 lg:border-l-0 lg:pl-0 lg:text-right">
          <p className="text-xs text-[var(--muted)]">世界观坐标</p>
          <p className="coordinate-type mt-1 whitespace-nowrap text-[clamp(2rem,5vw,3.75rem)] text-[var(--accent)]">
            {code}
          </p>
        </div>
      </header>

      <div
        className={`grid border-t border-[var(--line)] ${
          teamScenario ? "lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]" : ""
        }`}
      >
        {teamScenario ? (
          <article className="relative bg-[var(--accent-soft)] px-5 py-7 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
            <p className="text-sm font-medium text-[var(--accent)]">放进团队里，会这样表现</p>
            <p className="mt-4 max-w-4xl font-serif text-[clamp(1.45rem,2.6vw,2.35rem)] leading-[1.42] tracking-[-0.01em]">
              {teamScenario}
            </p>
          </article>
        ) : null}

        <aside
          className={`px-5 py-7 sm:px-7 sm:py-8 lg:py-10 ${
            teamScenario
              ? "border-t border-[var(--line)] lg:border-t-0 lg:border-l lg:px-8"
              : "lg:px-10"
          }`}
        >
          <h2 className="font-serif text-2xl leading-tight">这个名字是什么意思</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{nameExplanation}</p>
        </aside>
      </div>

      {showCapabilityLists ? (
        <div className="grid border-t border-[var(--line)] px-5 sm:grid-cols-2 sm:px-7 lg:px-10">
          <div className="py-7 sm:pr-8 lg:py-9 lg:pr-12">
            <ReadingList
              id="practical-result-strengths"
              title="你可能带来的价值"
              description="这套思路在现实协作中比较有力量的部分。"
              items={strengths}
            />
          </div>
          <div className="border-t border-[var(--line)] py-7 sm:border-t-0 sm:border-l sm:pl-8 lg:py-9 lg:pl-12">
            <ReadingList
              id="practical-result-blind-spots"
              title="你需要警惕的代价"
              description="当这套思路走得太远，最容易忽略的部分。"
              items={blindSpots}
            />
          </div>
        </div>
      ) : null}

      {showVerification ? (
        <footer className="border-t border-[var(--line-strong)] bg-[var(--surface)] px-5 py-6 sm:px-7 lg:px-10 lg:py-7">
          <div className="grid gap-3 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-8">
            <h2 className="text-sm font-medium text-[var(--accent)]">拿一个真实场景验证它</h2>
            <p className="max-w-4xl font-serif text-xl leading-[1.55] sm:text-2xl">
              {verificationQuestion}
            </p>
          </div>
          <p className="mt-5 max-w-4xl border-l border-[var(--line-strong)] pl-3 text-xs leading-5 text-[var(--muted)]">
            {scopeNote}
          </p>
        </footer>
      ) : null}
    </section>
  );
}
