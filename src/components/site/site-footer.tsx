import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="border-t hairline py-8">
      <div className="site-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Brand />
        <p className="text-xs text-[var(--muted)]">私密 · 可撤回 · 非人格测试</p>
      </div>
    </footer>
  );
}
