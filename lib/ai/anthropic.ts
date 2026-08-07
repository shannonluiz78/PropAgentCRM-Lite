// All Anthropic-specific request/response handling lives in this one file.
// If OpenAI or Gemini get added later as fallbacks, each gets its own file
// in this same shape, and lib/ai/agent.ts tries them in order — nothing
// outside this folder needs to know which provider actually served a call.

export class AiProviderError extends Error {
  constructor(
    message: string,
    public provider: string
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiProviderError("ANTHROPIC_API_KEY is not configured", "anthropic");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AiProviderError(
      `Anthropic API returned ${response.status}: ${body.slice(0, 300)}`,
      "anthropic"
    );
  }

  const data = await response.json();
  const text = data?.content
    ?.filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n");

  if (!text) {
    throw new AiProviderError("Anthropic API returned no text content", "anthropic");
  }

  return text;
}
