import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const lectures = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/lectures" }),
  schema: z.object({
    youtubeVideoId: z.string().min(6),
    youtubeUrl: z.url(),
    originalTitle: z.string().min(1),
    urduTitle: z.string().min(1),
    englishTitle: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    publicationDate: z.coerce.date(),
    thumbnailUrl: z.url(),
    shortUrduSummary: z.string().min(1),
    detailedUrduSummary: z.string().min(1),
    englishSummary: z.string().min(1),
    keyPointsUrdu: z.array(z.string()).min(1),
    keyPointsEnglish: z.array(z.string()).min(1),
    topicsUrdu: z.array(z.string()).min(1),
    topicsEnglish: z.array(z.string()).min(1),
    keywords: z.array(z.string()),
    speaker: z.literal("Mufti Abdul Raheem"),
    generatedAt: z.coerce.date(),
    aiAssisted: z.literal(true),
    draft: z.boolean().default(false),
  }),
});

export const collections = { lectures };
