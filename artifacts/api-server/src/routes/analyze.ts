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

  const systemPrompt = `You are Clario, a real-world message analysis engine.

Your job is to help users understand messages (job offers, scams, announcements, promotions) clearly and safely.

You MUST:
- Be neutral and factual
- Avoid panic language
- Avoid legal claims
- Focus on clarity and structure

Return a JSON object with exactly these fields:

{
  "type": one of exactly ["job offer", "scam risk", "informational", "promotional", "unknown"],
  "riskLevel": one of exactly ["low", "medium", "high"],
  "riskReason": a single short sentence explaining the risk signal (e.g. "Missing company verification details"),
  "observations": an array of concise bullet strings — include both key details found IN the message and any suspicious or missing elements,
  "summary": 2–3 plain human-language sentences explaining what the message is about,
  "clarityAction": one of exactly ["verify source", "proceed cautiously", "safe to engage", "ignore / avoid"],
  "recommendation": a short sentence or two elaborating on the clarityAction — what the user should specifically do next
}

RULES:
- Always return valid JSON, no markdown, no code blocks
- No long paragraphs
- No emotional exaggeration
- Be calm, analytical, and professional
- observations must be an array of strings (can be empty array but ideally 2–5 items)
- For scam risk messages, set clarityAction to "ignore / avoid" and riskLevel to "high"
- For legitimate job offers with no red flags, use clarityAction "safe to engage" or "verify source"`;

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
    const validActions = ["verify source", "proceed cautiously", "safe to engage", "ignore / avoid"];

    const type = validTypes.includes(result.type as string) ? (result.type as string) : "unknown";
    const riskLevel = validRisks.includes(result.riskLevel as string) ? (result.riskLevel as string) : "medium";
    const riskReason = typeof result.riskReason === "string" ? result.riskReason : "";
    const observations = Array.isArray(result.observations) ? result.observations.map(String) : [];
    const summary = typeof result.summary === "string" ? result.summary : "No summary available.";
    const clarityAction = validActions.includes(result.clarityAction as string) ? (result.clarityAction as string) : "proceed cautiously";
    const recommendation = typeof result.recommendation === "string" ? result.recommendation : "Review the message carefully before taking any action.";

    res.json({ type, riskLevel, riskReason, observations, summary, clarityAction, recommendation });
  } catch (err: unknown) {
    req.log.error({ err }, "Error calling OpenAI API");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

export default analyzeRouter;
