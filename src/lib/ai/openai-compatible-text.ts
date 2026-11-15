import OpenAI from "openai";
import { z } from "zod";
import { antwortSchemaBasis } from "./schema";
import { systemPrompt, userPrompt } from "./prompt";
import type { AiTextProvider, CopyRequest } from "./provider";

/** Ein Adapter für jeden OpenAI-kompatiblen Endpunkt: OpenRouter, OpenAI, Ollama, LM Studio … */
export class OpenAiCompatibleTextProvider implements AiTextProvider {
  name = "openai-compatible";
  modell: string;
  private client: OpenAI;
  private jsonSchemaUnterstuetzt = true;

  constructor() {
    const { AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_APP_URL, AI_APP_NAME } = process.env;
    if (!AI_MODEL) throw new Error("AI_MODEL ist nicht gesetzt.");
    this.modell = AI_MODEL;
    this.client = new OpenAI({
      baseURL: AI_BASE_URL,
      apiKey: AI_API_KEY || "nicht-gesetzt",
      // Optionale OpenRouter-Attribution; andere Anbieter ignorieren die Header.
      defaultHeaders: { ...(AI_APP_URL && { "HTTP-Referer": AI_APP_URL }), ...(AI_APP_NAME && { "X-Title": AI_APP_NAME }) },
      timeout: 60_000,
    });
  }

  async generate(req: CopyRequest, { feedback }: { versuch: number; feedback?: string }) {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt(req) },
      { role: "user", content: userPrompt(req) },
    ];
    if (feedback) {
      messages.push({ role: "user", content: `Deine letzte Antwort war ungültig:\n${feedback}\nAntworte erneut ausschließlich mit gültigem JSON nach den Regeln.` });
    }

    const jsonSchema = z.toJSONSchema(antwortSchemaBasis(req.slots)) as Record<string, unknown>;
    const anfrage = (format: OpenAI.Chat.ChatCompletionCreateParams["response_format"]) =>
      this.client.chat.completions.create({ model: this.modell, messages, temperature: 0.8, response_format: format });

    try {
      if (this.jsonSchemaUnterstuetzt) {
        const res = await anfrage({ type: "json_schema", json_schema: { name: "werbetexte", strict: true, schema: jsonSchema } });
        return res.choices[0]?.message?.content ?? "";
      }
    } catch (e) {
      // Manche Modelle kennen kein json_schema – dann JSON-Modus; Zod bleibt die maßgebliche Prüfung.
      if (!(e instanceof OpenAI.APIError) || e.status !== 400) throw e;
      this.jsonSchemaUnterstuetzt = false;
    }
    const res = await anfrage({ type: "json_object" });
    return res.choices[0]?.message?.content ?? "";
  }
}
