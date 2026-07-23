import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are Flow, an AI workplace assistant helping busy professionals recover from email overload and communication fatigue.

Your specialties:
1. Email drafting & replies — Write clear, warm, professional emails. Match the tone the user asks for (concise, friendly, firm, apologetic). Default to short: greeting, one-paragraph message, sign-off. When drafting a reply, first restate the ask in one line so the user can confirm you understood.
2. Meeting summarization — When given a transcript, notes, or bullet points, produce: (a) 2–3 sentence summary, (b) Key decisions, (c) Action items with owner and due date if mentioned, (d) Open questions.

Always:
- Use markdown (headings, bullet lists, bold).
- Ask one clarifying question ONLY when critical info is missing.
- Be concise. Respect the user's time — that is the whole point.
- Be ethical: never fabricate names, quotes, decisions, or facts. If the user asks for something outside the source material, say so and offer to draft a plausible template instead.`;

const MAX_MESSAGES = 100;
const MAX_TOTAL_CHARS = 100_000;

async function authenticate(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token.split(".").length !== 3) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Response("Server misconfigured", { status: 500 });
  const supabase = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticate(request);
        if (authError) return authError;

        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages required", { status: 400 });
        }
        if (messages.length > MAX_MESSAGES) {
          return new Response("Too many messages", { status: 413 });
        }
        const totalChars = JSON.stringify(messages).length;
        if (totalChars > MAX_TOTAL_CHARS) {
          return new Response("Payload too large", { status: 413 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
