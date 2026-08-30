import { GoogleGenAI } from "@google/genai";
import { summaryJsonSchema, summarySchema, type LectureSummary, type VideoMetadata } from "./schemas.ts";

export const GEMINI_MODEL = "gemini-3.5-flash-lite";

function schemaFor(video: VideoMetadata) {
  const schema = structuredClone(summaryJsonSchema) as any;
  schema.properties.youtubeVideoId.const = video.youtubeVideoId;
  schema.properties.youtubeUrl.const = video.youtubeUrl;
  schema.properties.originalTitle.const = video.originalTitle;
  schema.properties.publicationDate.const = video.publicationDate;
  schema.properties.thumbnailUrl.const = video.thumbnailUrl;
  return schema;
}

function promptFor(video: VideoMetadata) {
  return `You are preparing a faithful lecture summary for an independent public archive.

Carefully analyze the available lecture video. Summarize only statements actually present in the lecture and preserve the speaker's intended meaning. Do not invent facts, Islamic rulings, fatwas, Quranic verses, Hadith references, Arabic quotations, scholars, books, examples, or claims. Do not independently answer religious questions or reinterpret the speaker. Distinguish quoted material from the speaker's own conclusions where possible. If any reference or claim is uncertain, omit it rather than guess.

Write clear, natural, easy-to-read Urdu. Produce a short Urdu summary of approximately 100–200 words and a detailed Urdu summary proportional to the lecture's actual length. Do not pad a short lecture with repetition or invented detail. Include 5–12 useful key points in Urdu, a concise but useful English summary, matching English key points, and accurate topic metadata. Use a respectful tone. The English and Urdu topic arrays should align by index. Create a concise human-readable Latin-character slug. Output only valid structured data conforming to the supplied schema.

Required source metadata (copy these values exactly):
- youtubeVideoId: ${video.youtubeVideoId}
- youtubeUrl: ${video.youtubeUrl}
- originalTitle: ${video.originalTitle}
- publicationDate: ${video.publicationDate}
- thumbnailUrl: ${video.thumbnailUrl}
- speaker: Mufti Abdul Raheem`;
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|quota|resource.exhausted/i.test(message)) return "Gemini quota or rate limit exceeded.";
  if (/401|403|api.?key|permission/i.test(message)) return "Gemini authentication failed. Check GEMINI_API_KEY.";
  return `Gemini request failed: ${message.replace(/[A-Za-z0-9_-]{30,}/g, "[redacted]")}`;
}

function validationDiagnostic(error: unknown) {
  if (error instanceof SyntaxError) return "Gemini returned malformed JSON.";
  if (error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)) {
    return `Structured output rejected: ${error.issues.map((issue: any) => `${issue.path?.join(".") || "root"} (${issue.code || "invalid"})`).join(", ")}`;
  }
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[A-Za-z0-9_-]{30,}/g, "[redacted]");
}

export function applyAuthoritativeMetadata(summary: LectureSummary, video: VideoMetadata): LectureSummary {
  return summarySchema.parse({
    ...summary,
    youtubeVideoId: video.youtubeVideoId,
    youtubeUrl: video.youtubeUrl,
    originalTitle: video.originalTitle,
    publicationDate: video.publicationDate,
    thumbnailUrl: video.thumbnailUrl,
    speaker: "Mufti Abdul Raheem",
  });
}

export async function summarizeVideo(video: VideoMetadata, apiKey: string, attempts = 1): Promise<LectureSummary> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await ai.interactions.create({
        model: GEMINI_MODEL,
        input: [
          { type: "video", uri: video.youtubeUrl },
          { type: "text", text: promptFor(video) + (attempt > 1 ? "\nPrevious output was invalid. Return a corrected JSON object only." : "") },
        ],
        response_format: { type: "text", mime_type: "application/json", schema: schemaFor(video) },
        generation_config: { max_output_tokens: 12000, thinking_level: "low" },
        store: false,
      });
      if (!("output_text" in response) || !response.output_text) throw new Error("Gemini returned no text output.");
      const parsed = summarySchema.parse(JSON.parse(response.output_text));
      const sourceFields = ["youtubeVideoId", "youtubeUrl", "originalTitle", "publicationDate", "thumbnailUrl"] as const;
      const normalizedFields = sourceFields.filter((field) => parsed[field] !== video[field]);
      if (normalizedFields.length) console.warn(`Normalized authoritative RSS fields: ${normalizedFields.join(", ")}`);
      return applyAuthoritativeMetadata(parsed, video);
    } catch (error) {
      lastError = error;
      if (/429|quota|resource.exhausted/i.test(error instanceof Error ? error.message : String(error))) break;
      if (attempt < attempts) {
        console.warn(`${validationDiagnostic(error)} Retrying once.`);
        await new Promise((resolve) => setTimeout(resolve, 15_000));
      }
    }
  }
  throw new Error(safeError(lastError));
}
