import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
            M
          </span>
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            MatchMyResume
          </span>
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Resume · Job fit
        </span>
      </div>
    </header>
  );
}