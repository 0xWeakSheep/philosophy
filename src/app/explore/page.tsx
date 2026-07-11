import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import type { Metadata } from "next";
import Link from "next/link";

import { IntakeForm } from "@/components/intake/intake-form";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "带一件事进来",
  description: "写下一件反复发生的关系困境，从一句具体的话开始显影。",
};

export default function ExplorePage() {
  return (
    <>
      <SiteHeader quiet />
      <main
        className="relative isolate min-h-[calc(100dvh-72px)] overflow-hidden"
        id="main-content"
      >
        <div aria-hidden="true" className="hero-grid absolute inset-0 -z-10 opacity-40" />
        <div className="site-shell grid gap-12 py-10 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <section className="lg:col-span-4">
            <Link
              className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              href="/"
            >
              <ArrowLeftIcon aria-hidden="true" size={17} weight="regular" />
              返回首页
            </Link>
            <p className="mono-label mt-12 text-[11px] text-[var(--accent)]">第一面镜子 · 原句</p>
            <h1 className="display-type mt-5 text-[clamp(2.7rem,5vw,4.8rem)] leading-[1.08]">
              带一件反复发生的事进来
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-[var(--muted)]">
              不用写得正确，也不用先想通。具体比完整重要，真实比漂亮重要。
            </p>

            <ol className="mt-12 border-t hairline">
              {[
                ["01", "发生了什么"],
                ["02", "最难受的是什么"],
                ["03", "你通常怎么做"],
              ].map(([number, label]) => (
                <li
                  className="grid grid-cols-[3rem_1fr] border-b hairline py-4 text-sm"
                  key={number}
                >
                  <span className="mono-label text-xs text-[var(--accent)]">{number}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>

            <p className="mt-8 text-xs leading-6 text-[var(--muted)]">
              如果你正面临即时危险或自伤风险，请先联系当地急救、危机热线或一位可信任的人。本工具不适合处理紧急情况。
            </p>
          </section>

          <section className="border border-[var(--line-strong)] bg-[var(--paper)] p-5 shadow-[0_2rem_6rem_rgb(35_38_37_/_7%)] sm:p-8 lg:col-span-7 lg:col-start-6 lg:p-10">
            <IntakeForm />
          </section>
        </div>
      </main>
    </>
  );
}
