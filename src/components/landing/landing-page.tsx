import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import { DevelopingDemo } from "./developing-demo";

const axes = [
  ["01", "场域", "原因从哪开始"],
  ["02", "本体", "什么才算真实"],
  ["03", "现象", "怎样相信所见"],
  ["04", "目的", "先改变哪一边"],
] as const;

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b hairline">
      <div aria-hidden="true" className="hero-grid absolute inset-0 -z-10" />
      <div className="site-shell grid min-h-[calc(100dvh-64px)] items-center gap-10 py-9 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <p className="mono-label mb-5 text-[10px] text-[var(--accent)]">世界观角色生成器</p>
          <h1 className="display-type text-[clamp(3.2rem,6.4vw,6.5rem)]">
            <span className="block">四个问题，</span>
            <span className="display-outline block">生成你的</span>
            <span className="block">思想角色。</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg">
            得到一个称号、一种临时主义，以及一幅由四条思维轴共同生成的角色画像。
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link className="action-primary" href="/explore">
              生成我的思想角色
              <ArrowRightIcon aria-hidden="true" size={18} />
            </Link>
            <span className="mono-label text-[10px] text-[var(--muted)]">约 5 分钟 · 可分享</span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <DevelopingDemo />
        </div>
      </div>
    </section>
  );
}

function CoordinateSystem() {
  return (
    <section className="bg-paper-deep py-16 sm:py-20" id="method">
      <div className="site-shell grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-6">
          <p className="coordinate-type text-[clamp(3.6rem,8vw,8rem)] leading-none text-[var(--accent)]">
            4⁴
          </p>
          <h2 className="display-type mt-4 text-[clamp(2.5rem,4.8vw,4.8rem)]">
            16 个角色，256 种画像
          </h2>
          <p className="mt-4 text-sm text-[var(--muted)]" id="boundary">
            每次只描述一个议题。换个问题，角色也可以变。
          </p>
        </div>

        <ol className="border-t border-[var(--line-strong)] lg:col-span-5 lg:col-start-8">
          {axes.map(([number, label, prompt]) => (
            <li
              className="grid grid-cols-[2.5rem_4.5rem_1fr] items-center border-b border-[var(--line)] py-4"
              key={label}
            >
              <span className="mono-label text-[9px] text-[var(--accent)]">{number}</span>
              <strong className="font-serif font-normal">{label}</strong>
              <span className="text-sm text-[var(--muted)]">{prompt}</span>
            </li>
          ))}
        </ol>
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
        <CoordinateSystem />
      </main>
      <SiteFooter />
    </>
  );
}
