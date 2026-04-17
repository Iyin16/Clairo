import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const analyzeRouter = Router();

analyzeRouter.post("/analyze", async (req, res) => {
  const { input } = req.body as { input?: string };

  if (!input || typeof input !== "string" || input.trim().length === 0) {
    res.status(400).json({ error: "Input is required and must be a non-empty string." });
    return;
  }

  const trimmed = input.trim();

  const systemPrompt = `You are Clario, an expert message analyst. Analyze the provided message and return a JSON object with exactly these fields:

- "type": one of exactly ["job offer", "scam risk", "informational", "promotional", "unknown"]
- "riskLevel": one of exactly ["low", "medium", "high"]
- "missingInfo": an array of strings listing missing important details (can be empty array if nothing missing)
- "summary": a 1-3 sentence plain-language explanation of what the message is about
- "recommendation": a clear, concrete, safe next step the user should take

Rules:
- If the message is suspicious, misleading, or shows signs of fraud/phishing, set riskLevel to "high" and type to "scam risk"
- If it's a legitimate job posting but has red flags, use riskLevel "medium"
- Return ONLY valid JSON, no explanation, no markdown, no code blocks.`;

  const userPrompt = `Analyze this message:\n\n${trimmed}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      req.log.error({ rawContent }, "Failed to parse OpenAI JSON response");
      res.status(500).json({ error: "Failed to parse analysis result." });
      return;
    }

    const result = parsed as Record<string, unknown>;

    const validTypes = ["job offer", "scam risk", "informational", "promotional", "unknown"];
    const validRisks = ["low", "medium", "high"];

    const type = validTypes.includes(result.type as string) ? (result.type as string) : "unknown";
    const riskLevel = validRisks.includes(result.riskLevel as string) ? (result.riskLevel as string) : "medium";
    const missingInfo = Array.isArray(result.missingInfo) ? result.missingInfo.map(String) : [];
    const summary = typeof result.summary === "string" ? result.summary : "No summary available.";
    const recommendation = typeof result.recommendation === "string" ? result.recommendation : "Review the message carefully before taking any action.";

    res.json({ type, riskLevel, missingInfo, summary, recommendation });
  } catch (err: unknown) {
    req.log.error({ err }, "Error calling OpenAI API");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

export default analyzeRouter;
