import { z } from "zod";

export const videoMetadataSchema = z.object({
  youtubeVideoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  youtubeUrl: z.url().refine((url) => /(?:youtube\.com\/watch|youtu\.be\/)/.test(url), "Must be a YouTube watch URL"),
  originalTitle: z.string().min(1).max(300),
  publicationDate: z.iso.date(),
  thumbnailUrl: z.url(),
});

const safeText = z.string().min(1).refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value), "Contains control characters");

export const summarySchema = videoMetadataSchema.extend({
  urduTitle: safeText.max(220),
  englishTitle: safeText.max(220),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  shortUrduSummary: safeText.min(250).max(4000),
  detailedUrduSummary: safeText.min(1000).max(18000),
  englishSummary: safeText.min(150).max(5000),
  keyPointsUrdu: z.array(safeText).min(5).max(12),
  keyPointsEnglish: z.array(safeText).min(5).max(12),
  topicsUrdu: z.array(safeText).min(1).max(8),
  topicsEnglish: z.array(safeText).min(1).max(8),
  keywords: z.array(safeText).min(3).max(20),
  speaker: z.literal("Mufti Abdul Raheem"),
});

export type VideoMetadata = z.infer<typeof videoMetadataSchema>;
export type LectureSummary = z.infer<typeof summarySchema>;

export const summaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "youtubeVideoId", "youtubeUrl", "originalTitle", "urduTitle", "englishTitle", "slug",
    "publicationDate", "thumbnailUrl", "shortUrduSummary", "detailedUrduSummary", "englishSummary",
    "keyPointsUrdu", "keyPointsEnglish", "topicsUrdu", "topicsEnglish", "keywords", "speaker",
  ],
  properties: {
    youtubeVideoId: { type: "string" },
    youtubeUrl: { type: "string" },
    originalTitle: { type: "string" },
    urduTitle: { type: "string", minLength: 1, maxLength: 220 },
    englishTitle: { type: "string", minLength: 1, maxLength: 220 },
    slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    publicationDate: { type: "string", format: "date" },
    thumbnailUrl: { type: "string" },
    shortUrduSummary: { type: "string", minLength: 250, maxLength: 4000 },
    detailedUrduSummary: { type: "string", minLength: 1000, maxLength: 18000 },
    englishSummary: { type: "string", minLength: 150, maxLength: 5000 },
    keyPointsUrdu: { type: "array", minItems: 5, maxItems: 12, items: { type: "string" } },
    keyPointsEnglish: { type: "array", minItems: 5, maxItems: 12, items: { type: "string" } },
    topicsUrdu: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
    topicsEnglish: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
    keywords: { type: "array", minItems: 3, maxItems: 20, items: { type: "string" } },
    speaker: { type: "string", const: "Mufti Abdul Raheem" },
  },
} as const;
