// Central Anthropic access. ONE place to control model + token budgets so we
// never accidentally burn money. Always the smallest/cheapest model.

export const AI_MODEL = "claude-haiku-4-5-20251001"; // cheapest tier — do not change without reason

// Hard output caps per use case (keep tight — the AI must stay frugal).
export const TOKEN_BUDGET = {
  questions: 500,   // a handful of short questions
  plan: 1500,       // two concise plan versions
  board: 1400,      // sprint/task plan
  chat: 900,        // co-founder chat reply
} as const;

const ENDPOINT = "https://api.anthropic.com/v1/messages";

function headers(apiKey: string) {
  return { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" };
}

/** Force a structured tool call; returns the parsed tool input (or null). */
export async function callTool<T>(opts: {
  apiKey: string; system: string; user: string; maxTokens: number;
  toolName: string; description: string; schema: Record<string, unknown>;
}): Promise<T | null> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(opts.apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      tools: [{ name: opts.toolName, description: opts.description, input_schema: opts.schema }],
      tool_choice: { type: "tool", name: opts.toolName },
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  if (!res.ok) {
    console.error("[ai] tool call failed:", res.status, (await res.text().catch(() => "")).slice(0, 200));
    return null;
  }
  const data = await res.json();
  const toolUse = (data.content ?? []).find((c: { type: string }) => c.type === "tool_use");
  return (toolUse?.input as T) ?? null;
}

/** Plain text completion. */
export async function callText(opts: {
  apiKey: string; system: string; user: string; maxTokens: number;
}): Promise<string | null> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(opts.apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  if (!res.ok) {
    console.error("[ai] text call failed:", res.status);
    return null;
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? null;
}
