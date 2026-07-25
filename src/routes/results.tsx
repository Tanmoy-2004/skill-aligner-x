import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { loadAnalysis, type Analysis } from "@/lib/analysis";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Your match report — MatchMyResume" },
      {
        name: "description",
        content:
          "Match score, skills comparison, missing keywords, bullet rewrites and a tailored cover letter for your target role.",
      },
      { property: "og:title", content: "Your match report — MatchMyResume" },
      {
        property: "og:description",
        content: "Match score, skills gap, missing keywords and rewritten bullets.",
      },
    ],
  }),
  component: Results,
});

function Results() {
  const navigate = useNavigate();
  const [data, setData] = useState<Analysis | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const a = loadAnalysis();
    setData(a);
    setChecked(true);
    if (!a) navigate({ to: "/" });
  }, [navigate]);

  if (!checked || !data) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="mx-auto max-w-6xl px-6 py-20 text-sm text-muted-foreground">
          Loading your report…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> New analysis
        </Link>

        <section className="mt-6 grid gap-6 rounded-xl border border-border bg-card p-8 shadow-card md:grid-cols-[auto_1fr] md:items-center">
          <Dial value={Math.round(data.matchScore)} />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {data.roleTitle || "Match report"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {data.summary}
            </p>
          </div>
        </section>

        <Section title="Skills comparison">
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-left">
                  <Th>Skill</Th>
                  <Th>Job requires</Th>
                  <Th>Your resume</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {data.skills.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-semibold text-foreground">{s.skill}</td>
                    <td className="px-5 py-4 text-muted-foreground">{s.required}</td>
                    <td className="px-5 py-4 text-muted-foreground">{s.resumeEvidence || "—"}</td>
                    <td className="px-5 py-4">
                      <StatusChip status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {data.missingKeywords.length > 0 && (
          <Section title="Top missing keywords">
            <div className="flex flex-wrap gap-2">
              {data.missingKeywords.map((k) => (
                <span
                  key={k.keyword}
                  className="rounded-full border border-destructive/25 bg-destructive-soft px-3.5 py-1.5 text-sm font-medium text-destructive"
                >
                  {k.keyword}
                </span>
              ))}
            </div>
            <ol className="mt-4 space-y-2">
              {data.missingKeywords.map((k, i) => (
                <li key={k.keyword} className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-mono text-xs text-destructive">{i + 1}.</span>{" "}
                  <span className="font-semibold text-foreground">{k.keyword}</span> — {k.reason}
                </li>
              ))}
            </ol>
          </Section>
        )}

        <Section title="Weakest bullet rewrites">
          <div className="space-y-4">
            {data.bulletRewrites.map((b, i) => (
              <div
                key={i}
                className="grid gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card md:grid-cols-2"
              >
                <div className="bg-card p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Before
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.before}</p>
                  {b.weakness && (
                    <p className="mt-3 text-xs leading-relaxed text-destructive">{b.weakness}</p>
                  )}
                </div>
                <div className="bg-primary-soft/60 p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-foreground">
                    After
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                    {b.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Cover letter">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <CopyButton text={data.coverLetter} />
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">
              {data.coverLetter}
            </p>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </th>
  );
}

function StatusChip({ status }: { status: "strong" | "partial" | "missing" }) {
  const styles = {
    strong: "border-primary/30 bg-primary-soft text-accent-foreground",
    partial: "border-warning/40 bg-warning/10 text-warning",
    missing: "border-destructive/25 bg-destructive-soft text-destructive",
  }[status];
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles}`}>
      {status}
    </span>
  );
}

function Dial({ value }: { value: number }) {
  const r = 66;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShown(value), 80);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="relative size-44 shrink-0">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tracking-tight text-foreground">{value}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Match
        </span>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy cover letter"}
    </button>
  );
}