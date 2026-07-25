import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { analyseResume } from "@/lib/analyse.functions";
import { saveAnalysis } from "@/lib/analysis";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MatchMyResume — Score your resume against any job" },
      {
        name: "description",
        content:
          "Paste a resume and a job description, get a match score, skills gap table, missing keywords, rewritten bullets and a cover letter.",
      },
      { property: "og:title", content: "MatchMyResume — Score your resume against any job" },
      {
        property: "og:description",
        content: "Paste a resume and a job description, get a match score, skills gap table, missing keywords, rewritten bullets and a cover letter.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const analyse = useServerFn(analyseResume);
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = resume.trim().length >= 20 && job.trim().length >= 20;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyse({ data: { resume, job } });
      saveAnalysis(result);
      navigate({ to: "/results" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            Resume screening, mirrored
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            See your resume the way a recruiter reads it.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Drop in your resume and the job description. You get a match score, a skills gap table,
            the keywords you are missing, rewritten bullets and a tailored cover letter.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10">
          <div className="grid gap-5 md:grid-cols-2">
            <PasteField
              label="Resume"
              hint="Plain text works best"
              value={resume}
              onChange={setResume}
              placeholder="Paste your full resume here…"
            />
            <PasteField
              label="Job description"
              hint="Include requirements and responsibilities"
              value={job}
              onChange={setJob}
              placeholder="Paste the job description here…"
            />
          </div>

          {error ? (
            <p className="mt-5 rounded-md border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={!ready || loading}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Analysing…
                </>
              ) : (
                <>
                  Analyse <ArrowRight className="size-4" />
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              Nothing is stored — the analysis lives in this browser session only.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}

function PasteField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="font-mono text-[11px] text-muted-foreground">
          {value.trim() ? `${value.trim().split(/\s+/).length} words` : hint}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 h-80 w-full resize-y rounded-md border border-input bg-background p-4 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
