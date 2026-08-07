import { callAnthropic, AiProviderError } from "./anthropic";

// Tries providers in ranked order. Only Anthropic is wired up today — this
// is the one place to add OpenAI/Gemini later without touching any of the
// code that calls draftWithAi().
export async function draftWithAi(prompt: string): Promise<{ text: string; provider: string }> {
  const providers: { name: string; call: (p: string) => Promise<string> }[] = [
    { name: "anthropic", call: callAnthropic },
    // { name: "openai", call: callOpenAi },
    // { name: "gemini", call: callGemini },
  ];

  const failures: string[] = [];

  for (const provider of providers) {
    try {
      const text = await provider.call(prompt);
      return { text, provider: provider.name };
    } catch (err) {
      const message = err instanceof AiProviderError ? err.message : String(err);
      failures.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(`All AI providers failed — ${failures.join(" | ")}`);
}

// Strips ```json fences if the model wraps its output despite instructions.
export function parseAiJson<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
