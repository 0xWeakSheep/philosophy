import Link from "next/link";

import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="border-t hairline py-8">
      <div className="site-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Brand />
        <p className="max-w-lg text-sm leading-6 text-[var(--muted)]">
          一件私密、可撤回的思想实验。它不诊断，也不替你作决定。
        </p>
        <Link
          className="inline-flex min-h-11 items-center text-sm font-medium underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--accent)]"
          href="/explore"
        >
          开始探索
        </Link>
      </div>
    </footer>
  );
}
