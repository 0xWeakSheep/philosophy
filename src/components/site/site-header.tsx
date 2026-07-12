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
        {quiet ? null : (
          <Link className="action-primary ml-1" href="/explore">
            开始
            <ArrowRightIcon aria-hidden="true" size={17} weight="regular" />
          </Link>
        )}
      </div>
    </header>
  );
}
