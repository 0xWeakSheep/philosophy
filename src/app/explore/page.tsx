import type { Metadata } from "next";

import { IntakeForm } from "@/components/intake/intake-form";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "带一个判断进来",
  description: "写下一个具体的世界观判断，看看观念、选择、条件与结构如何进入你的解释。",
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
            <p className="mono-label text-[11px] text-[var(--accent)]">原判断</p>
            <h1 className="display-type mt-5 text-[clamp(2.7rem,5vw,4.8rem)] leading-[1.08]">
              写下一个正在犹豫的判断
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-[var(--muted)]">
              具体到一件事：你的判断，以及让你迟疑的地方。
            </p>

            <p className="mt-10 max-w-sm text-xs leading-6 text-[var(--muted)]">
              即时危险请先联系急救或可信任的人。
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
