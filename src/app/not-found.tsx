import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="paper-grain grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5 text-[var(--ink)]"
    >
      <div className="max-w-xl border-l-2 border-[var(--accent)] pl-6">
        <p className="font-mono text-xs tracking-[0.14em] text-[var(--accent)]">镜面之外</p>
        <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">这里没有可显影的内容</h1>
        <p className="mt-5 leading-relaxed text-[var(--muted)]">
          这个地址不存在，或者对应的页面已经移动。你可以回到入口，带一件真实发生过的事重新开始。
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
        >
          <ArrowLeftIcon aria-hidden="true" size={17} /> 返回首页
        </Link>
      </div>
    </main>
  );
}
