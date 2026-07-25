import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { analysisSchema } from "./analysis";

const Input = z.object({
  resume: z.string().min(20),
  job: z.string().min(20),
});

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
        system:
          "You are a senior technical recruiter and resume editor. Compare a resume against a job description. Be specific, evidence-based and concise. matchScore is 0-100. Provide 6-10 skill rows covering the most important requirements, 5-12 missing ATS keywords (only ones truly absent from the resume), 3-5 bullet rewrites that quantify impact and mirror the job language, and a 180-250 word cover letter in the candidate's voice with no placeholders other than [Company] if the company is unknown.",
        prompt: `JOB DESCRIPTION:\n${data.job}\n\nRESUME:\n${data.resume}`,
      });
      return output;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please try again in a moment.");
      if (msg.includes("402"))
        throw new Error("AI credits exhausted. Add credits in your Lovable workspace to continue.");
      throw new Error("Analysis failed. Please try again.");
    }
  });