import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="paper-grain grid min-h-[100dvh] place-items-center bg-[var(--paper)] px-5 text-[var(--ink)]"
    >
      <div className="max-w-xl border-l-2 border-[var(--accent)] pl-6">
        <h1 className="font-serif text-4xl leading-tight sm:text-6xl">这里没有内容</h1>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
        >
          <ArrowLeftIcon aria-hidden="true" size={17} /> 返回首页
        </Link>
      </div>
    </main>
  );
}
