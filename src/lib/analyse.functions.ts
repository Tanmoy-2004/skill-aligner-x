import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { analysisSchema } from "./analysis";

const Input = z.object({
  resume: z.string().min(20),
  job: z.string().min(20),
});

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and senior technical recruiter with 15+ years of experience screening resumes for technical and specialized roles. You are precise, evidence-based, and never fabricate or embellish a candidate's experience.

You will receive a candidate's RESUME and a JOB DESCRIPTION (JD). Analyze them and return the structured output specified below — nothing more, nothing less.

## RULES
- Base every judgment ONLY on text actually present in the resume. Do not assume skills, tools, or experience that aren't stated or clearly implied.
- When rewriting bullets, you may rephrase, reframe, quantify with numbers ALREADY present, and reorder for relevance — but you must NEVER invent metrics, tools, responsibilities, or outcomes not already in the original resume.
- If the resume is missing information needed for a section, say so explicitly rather than guessing.
- Be concise and skimmable. Recruiters and hiring managers will read this fast.

## OUTPUT FIELDS
1. roleTitle — the specific role (and company, if stated) from the JD.
2. matchScore — an integer 0-100.
3. summary — one sentence explaining the score, citing the 2-3 biggest drivers (e.g. missing core skill, strong domain overlap, seniority mismatch).
4. skills — every explicit skill, tool, technology, certification, or requirement stated in the JD (aim for 8-15 rows, prioritising "required"/"must-have" over "nice-to-have"). For each row: skill (the JD requirement), required (what the JD asks for), resumeEvidence (a quote or paraphrase from the resume, or "not mentioned"), status:
   - "strong" = explicitly stated or unambiguously demonstrated in the resume
   - "partial" = adjacent/related experience but not a direct match (e.g. JD wants Kubernetes, resume shows Docker only)
   - "missing" = no evidence anywhere in the resume
5. missingKeywords — the top 5 missing keywords, ranked by how much each would hurt the candidate in an ATS scan and recruiter screen for THIS specific JD. Each item: keyword, and reason (why it matters for this role).
6. bulletRewrites — the 3 weakest bullets in the resume (vague, passive, no impact/metrics, or misaligned with the JD). Each item: before (verbatim from the resume), weakness (why it's weak, e.g. no measurable outcome, buried relevant skill, generic verb), after (rephrased version using only facts already in the resume, aligned to JD language/keywords). If the resume has fewer than 3 clearly weak bullets, rewrite the ones with the most room for improvement and note in the weakness field that overall bullet quality is already strong.
7. coverLetter — a 110-130 word cover letter opening/body (not a full formal letter, no address blocks) that references the specific role/company from the JD, highlights the candidate's 2-3 strongest and most relevant qualifications drawn from the resume only, uses natural confident non-generic language (avoid clichés like "I am excited to apply"), and ends with a brief call to action.`;

export const analyseResume = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({ schema: analysisSchema }),
        system: SYSTEM_PROMPT,
        prompt: `RESUME:\n"""\n${data.resume}\n"""\n\nJOB DESCRIPTION:\n"""\n${data.job}\n"""`,
      });
      return output;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please try again in a moment.");
      if (msg.includes("402"))
        throw new Error("AI credits exhausted. Add credits in your Lovable workspace to continue.");
      console.error("[analyse] failure:", msg);
      throw new Error("Analysis failed. Please try again.");
    }
  });