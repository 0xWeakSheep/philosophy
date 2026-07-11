import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr/ArrowDown";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { QuotesIcon } from "@phosphor-icons/react/dist/ssr/Quotes";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import { DevelopingDemo } from "./developing-demo";

const mirrorQuestions = [
  {
    number: "01",
    name: "场域",
    title: "我默认关系遵守什么规则？",
    detail: "辨认那些从未被说出口，却被当成“本来如此”的秩序。",
  },
  {
    number: "02",
    name: "本体",
    title: "什么对我来说不可退让？",
    detail: "找到一件事为什么不只是重要，而像是在决定什么才是真的。",
  },
  {
    number: "03",
    name: "现象",
    title: "事实怎样被我体验和解释？",
    detail: "把发生的事、感受到的事，以及随后补上的解释暂时分开。",
  },
  {
    number: "04",
    name: "目的",
    title: "我的行动在保护或推动什么？",
    detail: "不急着判断反应对不对，先看它把你带向哪里。",
  },
  {
    number: "W",
    name: "窗",
    title: "问题真的只在我里面吗？",
    detail: "检查权力差、现实约束与被越过的边界，拒绝把一切都内化。",
    window: true,
  },
] as const;

const boundaries = [
  ["不诊断", "不使用临床名称解释你的表达。"],
  ["不定型", "所有读法只绑定这一次议题。"],
  ["可反驳", "每项判断都允许你说不像，或给出反例。"],
  ["有窗户", "现实中的不公与越界不会被改写成你的认知问题。"],
] as const;

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b hairline">
      <div aria-hidden="true" className="hero-grid absolute inset-0 -z-10" />
      <div className="site-shell grid min-h-[calc(100dvh-72px)] items-center gap-12 py-10 lg:grid-cols-12 lg:gap-8 lg:py-12">
        <div className="lg:col-span-6 xl:col-span-7">
          <p className="mono-label mb-5 text-[11px] text-[var(--accent)]">四面镜子，一扇窗</p>
          <h1 className="display-type text-[2.5rem] leading-[1.12] sm:text-[3.4rem] lg:text-[clamp(3.5rem,5.6vw,5.3rem)]">
            <span className="block">你反复遇到的，</span>
            <span className="block">可能是同一个世界</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            带一件反复发生的事进来。看见自己的话，怎样一步步变成一个世界。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="action-primary" href="/explore">
              开始探索
              <ArrowRightIcon aria-hidden="true" size={18} weight="regular" />
            </Link>
            <Link className="action-secondary" href="#method">
              看它如何工作
              <ArrowDownIcon aria-hidden="true" size={17} weight="regular" />
            </Link>
          </div>
        </div>

        <div className="pb-4 lg:col-span-6 lg:pb-0 xl:col-span-5">
          <DevelopingDemo />
        </div>
      </div>
    </section>
  );
}

function EvidenceRail() {
  return (
    <section aria-label="显影步骤" className="border-b hairline">
      <div className="site-shell grid divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {["保留你的原话", "提出竞争读法", "允许你反驳", "带走一个下一问"].map((label, index) => (
          <div className="flex min-h-24 items-center gap-4 py-5 sm:px-5 first:pl-0" key={label}>
            <span className="mono-label text-xs text-[var(--accent)]">0{index + 1}</span>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Method() {
  return (
    <section className="py-24 sm:py-32" id="method">
      <div className="site-shell">
        <div className="max-w-4xl">
          <p className="mono-label text-xs text-[var(--accent)]">显影方式</p>
          <h2 className="display-type mt-8 text-[clamp(2.5rem,5.3vw,5rem)] leading-[1.12]">
            不是给你一个答案，
            <span className="text-[var(--muted)]">而是把答案如何形成，摆到光下。</span>
          </h2>
        </div>

        <div className="mt-20 border-t hairline">
          <article className="grid gap-5 border-b hairline py-9 md:grid-cols-12 md:items-baseline">
            <span className="mono-label text-xs text-[var(--accent)] md:col-span-2">A · 停词</span>
            <h3 className="display-type text-3xl md:col-span-4 md:text-4xl">先停在一个词上</h3>
            <p className="max-w-xl text-base leading-8 text-[var(--muted)] md:col-span-5 md:col-start-8">
              “应该”“成熟”“正常”“一直”不是语言毛边。它们常常藏着一条还没被检验的世界规则。
            </p>
          </article>
          <article className="grid gap-5 border-b hairline py-9 md:grid-cols-12 md:items-baseline">
            <span className="mono-label text-xs text-[var(--accent)] md:col-span-2 md:col-start-2">
              B · 分光
            </span>
            <h3 className="display-type text-3xl md:col-span-4 md:text-4xl">让两种读法并排</h3>
            <p className="max-w-xl text-base leading-8 text-[var(--muted)] md:col-span-5 md:col-start-8">
              你可能在保护一条真实边界，也可能在用某个标准压平自己的感受。系统不替你抢答。
            </p>
          </article>
          <article className="grid gap-5 border-b hairline py-9 md:grid-cols-12 md:items-baseline">
            <span className="mono-label text-xs text-[var(--accent)] md:col-span-2 md:col-start-3">
              C · 修正
            </span>
            <h3 className="display-type text-3xl md:col-span-4 md:text-4xl">最后由你改写</h3>
            <p className="max-w-xl text-base leading-8 text-[var(--muted)] md:col-span-5 md:col-start-8">
              像你、不像、只在这里成立，或你有反例。一个判断只有容得下修正，才值得被留下。
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function MirrorsAndWindow() {
  return (
    <section className="bg-paper-deep py-24 sm:py-32">
      <div className="site-shell">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
          <div className="lg:sticky lg:top-8 lg:col-span-5">
            <p className="mono-label text-xs text-[var(--accent)]">意义结构</p>
            <h2 className="display-type mt-8 text-5xl leading-[1.1] sm:text-7xl">
              四面镜子
              <span className="block text-[var(--accent)]">一扇窗</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-[var(--muted)]">
              镜子观察意义如何被组织。窗提醒我们，有些问题确实来自外面的世界。
            </p>
            <div aria-hidden="true" className="mirror-field mt-12">
              <span className="mirror-pane" />
              <span className="mirror-pane" />
              <span className="mirror-pane" />
              <span className="mirror-pane" />
              <span className="mirror-window" />
            </div>
          </div>

          <div className="border-t hairline lg:col-span-6 lg:col-start-7 lg:mt-24">
            {mirrorQuestions.map((item) => (
              <article
                className={`grid gap-3 border-b hairline py-7 sm:grid-cols-[4rem_1fr] sm:gap-6 ${"window" in item ? "text-[var(--accent)]" : ""}`}
                key={item.name}
              >
                <div className="flex items-baseline justify-between sm:block">
                  <span className="mono-label text-xs">{item.number}</span>
                  <span className="text-xs sm:mt-2 sm:block">{item.name}</span>
                </div>
                <div>
                  <h3 className="display-type text-2xl tracking-[-0.025em] sm:text-3xl">
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 max-w-xl text-sm leading-7 ${"window" in item ? "text-[color:color-mix(in_srgb,var(--accent)_72%,var(--ink))]" : "text-[var(--muted)]"}`}
                  >
                    {item.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Boundary() {
  return (
    <section className="bg-ink py-24 sm:py-32" id="boundary">
      <div className="site-shell">
        <div className="max-w-3xl">
          <p className="mono-label text-xs text-[var(--accent-on-ink)]">可信边界</p>
          <h2 className="display-type mt-8 text-[clamp(2.7rem,5vw,4.8rem)] leading-[1.12]">
            工具的边界，
            <span className="block text-[color:color-mix(in_srgb,var(--ink-inverse)_55%,transparent)]">
              是它可信的一部分。
            </span>
          </h2>
        </div>

        <div className="mt-16 grid border-t border-[color:color-mix(in_srgb,var(--ink-inverse)_20%,transparent)] sm:grid-cols-2">
          {boundaries.map(([title, detail], index) => (
            <article
              className={`min-h-48 border-b border-[color:color-mix(in_srgb,var(--ink-inverse)_20%,transparent)] py-7 sm:p-8 ${index % 2 === 0 ? "sm:border-r" : ""}`}
              key={title}
            >
              <CheckIcon
                aria-hidden="true"
                className="text-[var(--accent-on-ink)]"
                size={20}
                weight="regular"
              />
              <h3 className="mt-7 text-lg font-semibold">{title}</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-[color:color-mix(in_srgb,var(--ink-inverse)_62%,transparent)]">
                {detail}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-7 text-[color:color-mix(in_srgb,var(--ink-inverse)_58%,transparent)]">
          它不是心理治疗、人格测评或危机支持。如果你正面临即时危险或自伤风险，请优先联系当地急救、危机热线或一位可信任的人。
        </p>
      </div>
    </section>
  );
}

function FinalInvitation() {
  return (
    <section className="border-b hairline py-24 sm:py-32">
      <div className="site-shell grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <QuotesIcon
            aria-hidden="true"
            className="text-[var(--accent)]"
            size={32}
            weight="light"
          />
          <h2 className="display-type mt-7 text-[clamp(2.8rem,6vw,6rem)] leading-[1.06]">
            先不解决它。
            <span className="block text-[var(--muted)]">先看清它由什么组成。</span>
          </h2>
        </div>
        <div className="lg:col-span-3 lg:col-start-10 lg:pb-2">
          <p className="mb-6 text-sm leading-7 text-[var(--muted)]">
            大约 5 到 10 分钟。无需哲学知识，也不会得到一个人格标签。
          </p>
          <Link className="action-primary w-full sm:w-auto lg:w-full" href="/explore">
            开始探索
            <ArrowRightIcon aria-hidden="true" size={18} weight="regular" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <EvidenceRail />
        <Method />
        <MirrorsAndWindow />
        <Boundary />
        <FinalInvitation />
      </main>
      <SiteFooter />
    </>
  );
}
