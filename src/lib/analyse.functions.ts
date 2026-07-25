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