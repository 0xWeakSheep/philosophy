import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import Link from "next/link";

import { Brand } from "./brand";

type SiteHeaderProps = {
  quiet?: boolean;
};

export function SiteHeader({ quiet = false }: SiteHeaderProps) {
  return (
    <header
      className={`relative z-50 h-[72px] border-b hairline ${quiet ? "bg-[var(--paper)]" : "bg-[color:color-mix(in_srgb,var(--paper)_88%,transparent)] backdrop-blur-md"}`}
    >
      <div className="site-shell flex h-full items-center justify-between gap-5">
        <Brand compact />
        <nav aria-label="主要导航" className="flex items-center gap-1 sm:gap-3">
          <Link
            className="hidden min-h-11 items-center px-3 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)] md:inline-flex"
            href="/#method"
          >
            它如何工作
          </Link>
          <Link
            className="hidden min-h-11 items-center px-3 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)] md:inline-flex"
            href="/#boundary"
          >
            使用边界
          </Link>
          <Link className="action-primary ml-1" href="/explore">
            开始探索
            <ArrowRightIcon aria-hidden="true" size={17} weight="regular" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
