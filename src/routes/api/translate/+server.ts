import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "$env/dynamic/private";
import type { RequestEvent } from "@sveltejs/kit";

function getOpenAIClient() {
  return createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

export async function POST({ request }: RequestEvent) {
  const { text, sourceLang, targetLang } = await request.json();

  if (!text || !targetLang) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const openai = getOpenAIClient();

  const isAutoDetect = sourceLang === "auto";

  const systemPrompt = `You are a professional translator. Translate text accurately and naturally.
Preserve formatting, tone, and style.
Return ONLY the translated text — no explanations, no comments.
${isAutoDetect ? 'First line: "Detected: <language name>", then a blank line, then the translation.' : ""}`;

  const userPrompt = `Translate the following text from ${isAutoDetect ? "auto-detected language" : sourceLang} to ${targetLang}:\n\n${text}`;

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2000,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
