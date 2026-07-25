import { z } from "zod";

export const analysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  roleTitle: z.string(),
  skills: z.array(
    z.object({
      skill: z.string(),
      required: z.string(),
      resumeEvidence: z.string(),
      status: z.enum(["strong", "partial", "missing"]),
    }),
  ),
  missingKeywords: z.array(z.string()),
  bulletRewrites: z.array(z.object({ before: z.string(), after: z.string() })),
  coverLetter: z.string(),
});

export type Analysis = z.infer<typeof analysisSchema>;

const KEY = "mmr:analysis";

export function saveAnalysis(a: Analysis) {
  sessionStorage.setItem(KEY, JSON.stringify(a));
}

export function loadAnalysis(): Analysis | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Analysis) : null;
  } catch {
    return null;
  }
}