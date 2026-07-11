import Link from "next/link";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link
      aria-label="意识形态镜室，返回首页"
      className="inline-flex min-h-11 items-center gap-3 text-[var(--ink)]"
      href="/"
    >
      <span aria-hidden="true" className="brand-glyph">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className={compact ? "hidden text-sm font-semibold sm:block" : "text-sm font-semibold"}>
        意识形态镜室
      </span>
    </Link>
  );
}
