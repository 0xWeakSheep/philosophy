import type { InterpretationLayer } from "@/components/session/types";

export interface LayeredResultReadingProps {
  readonly surfacePhenomenon: InterpretationLayer;
  readonly deepStructure: InterpretationLayer;
  readonly realityGround: InterpretationLayer;
  readonly observableExpression: InterpretationLayer;
}

interface ReadingLayer {
  readonly code: string;
  readonly eyebrow: string;
  readonly prompt: string;
  readonly content: InterpretationLayer;
  readonly className: string;
  readonly accentClassName: string;
}

export function LayeredResultReading({
  surfacePhenomenon,
  deepStructure,
  realityGround,
  observableExpression,
}: LayeredResultReadingProps) {
  const layers: readonly ReadingLayer[] = [
    {
      code: "01",
      eyebrow: "表层｜你如何定义问题",
      prompt: "从这次回答的原话开始",
      content: surfacePhenomenon,
      className: "ml-0 sm:mr-[21%] xl:mt-0 xl:mr-0",
      accentClassName: "bg-[var(--line-strong)]",
    },
    {
      code: "02",
      eyebrow: "深层｜可能在保护什么",
      prompt: "一条需要继续核对的价值假设",
      content: deepStructure,
      className: "bg-[var(--paper-deep)] sm:ml-[7%] sm:mr-[14%] xl:mt-8 xl:mr-0 xl:ml-0",
      accentClassName: "bg-[var(--ink)]",
    },
    {
      code: "03",
      eyebrow: "现实｜需要核对的支点",
      prompt: "把解释放回权责、资源与因果",
      content: realityGround,
      className: "bg-[var(--accent-soft)] sm:ml-[14%] sm:mr-[7%] xl:mt-16 xl:mr-0 xl:ml-0",
      accentClassName: "bg-[var(--accent)]",
    },
    {
      code: "04",
      eyebrow: "外显｜别人会看到什么",
      prompt: "判断最终落到行动与关系",
      content: observableExpression,
      className: "sm:ml-[21%] xl:mt-24 xl:ml-0",
      accentClassName: "bg-[var(--accent)]",
    },
  ];

  return (
    <section
      className="relative isolate overflow-hidden border-y border-[var(--line-strong)] bg-[var(--surface)]"
      aria-labelledby="layered-result-reading-title"
    >
      <header className="grid gap-5 px-5 pt-7 pb-6 sm:px-8 sm:pt-9 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:px-10">
        <div>
          <p className="font-mono text-[0.68rem] tracking-[0.13em] text-[var(--accent)]">
            FOUR-LAYER READING · 04
          </p>
          <h2
            id="layered-result-reading-title"
            className="display-type mt-3 text-[clamp(2rem,4.2vw,3.9rem)]"
          >
            把这个结果向下剖开
          </h2>
        </div>
        <p className="max-w-[28rem] border-l border-[var(--line-strong)] pl-4 text-sm leading-6 text-[var(--muted)] lg:justify-self-end">
          同一份回答可以分成四层：你看见什么、想守住什么、依靠什么成立，以及最后怎样行动。
        </p>
      </header>

      <div className="relative border-t border-[var(--line)] px-3 pb-5 sm:px-6 sm:pb-7 lg:px-10">
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-5 left-[2.16rem] w-px bg-[var(--line-strong)] sm:bottom-7 sm:left-[3.72rem] lg:left-[4.72rem] xl:hidden"
        />
        <div
          aria-hidden="true"
          className="absolute top-[27%] bottom-[20%] left-[2.16rem] w-px bg-[var(--accent)] sm:left-[3.72rem] lg:left-[4.72rem] xl:hidden"
        />

        <ol aria-label="结果的四层透视" className="relative xl:grid xl:grid-cols-4 xl:gap-3">
          {layers.map((layer, index) => (
            <li
              key={layer.code}
              data-reading-layer={index + 1}
              className="grid grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[6rem_minmax(0,1fr)] xl:grid-cols-[2.5rem_minmax(0,1fr)] xl:items-start"
            >
              <div className="relative flex justify-center pt-7 sm:pt-8 xl:pt-5">
                <span
                  className={`relative z-10 grid size-7 place-items-center border border-[var(--line-strong)] bg-[var(--paper)] font-mono text-[0.62rem] tabular-nums ${
                    index === layers.length - 1 ? "border-[var(--accent)] text-[var(--accent)]" : ""
                  }`}
                  aria-hidden="true"
                >
                  {layer.code}
                </span>
              </div>

              <article
                className={`relative border-t border-[var(--line)] px-4 py-6 sm:px-6 sm:py-7 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8 xl:block xl:px-5 xl:py-5 ${layer.className}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0 left-0 h-px w-[clamp(2.5rem,8vw,7rem)] ${layer.accentClassName}`}
                />
                <div>
                  <p className="font-serif text-lg leading-snug text-[var(--accent)]">
                    {layer.eyebrow}
                  </p>
                  <p className="mt-1 hidden text-[0.7rem] leading-5 text-[var(--muted)] sm:block">
                    {layer.prompt}
                  </p>
                </div>
                <div className="mt-4 min-w-0 lg:mt-0 xl:mt-4">
                  <h3 className="font-serif text-[clamp(1.35rem,2.3vw,2rem)] leading-[1.3] text-balance">
                    {layer.content.title}
                  </h3>
                  <p className="mt-2 max-w-[58rem] text-sm leading-6 text-[var(--muted)] sm:text-[0.95rem]">
                    {layer.content.summary}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>

        <div
          aria-hidden="true"
          className="ml-[3rem] flex items-center gap-3 pt-4 sm:ml-[6rem] sm:pt-5 xl:ml-0"
        >
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span className="font-mono text-[0.62rem] tracking-[0.12em] text-[var(--accent)]">
            FROM THOUGHT TO ACTION ↗
          </span>
        </div>
      </div>
    </section>
  );
}
