import test from "node:test";
import assert from "node:assert/strict";
import { summarySchema } from "../scripts/lib/schemas.ts";
import { applyAuthoritativeMetadata } from "../scripts/lib/gemini.ts";

const urduSentence = "یہ ایک آزمائشی عبارت ہے جو صرف خودکار ساختی جانچ کے لیے استعمال ہو رہی ہے۔ ";
const validSummary = {
  youtubeVideoId: "abcdefghijk",
  youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk",
  originalTitle: "Source lecture title",
  urduTitle: "آزمائشی عنوان",
  englishTitle: "Test title",
  slug: "test-title",
  publicationDate: "2026-08-28",
  thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
  shortUrduSummary: urduSentence.repeat(6),
  detailedUrduSummary: urduSentence.repeat(30),
  englishSummary: "This test fixture contains enough text to verify that a well-formed structured response passes validation without representing any real lecture or publishing fake content. ".repeat(2),
  keyPointsUrdu: Array.from({ length: 5 }, (_, index) => `${urduSentence} ${index + 1}`),
  keyPointsEnglish: Array.from({ length: 5 }, (_, index) => `Test point ${index + 1}`),
  topicsUrdu: ["آزمائش"],
  topicsEnglish: ["Testing"],
  keywords: ["test", "schema", "validation"],
  speaker: "Mufti Abdul Raheem",
};

test("valid structured Gemini output passes validation", () => {
  assert.equal(summarySchema.parse(validSummary).slug, "test-title");
});

test("malformed or incomplete AI output is rejected", () => {
  assert.throws(() => summarySchema.parse({ ...validSummary, detailedUrduSummary: "مختصر", keyPointsUrdu: [] }));
});

test("fabricated source identity cannot replace the configured speaker", () => {
  assert.throws(() => summarySchema.parse({ ...validSummary, speaker: "Another speaker" }));
});

test("trusted RSS metadata replaces altered AI source fields", () => {
  const generated = summarySchema.parse({ ...validSummary, originalTitle: "Changed by model" });
  const canonical = applyAuthoritativeMetadata(generated, {
    youtubeVideoId: validSummary.youtubeVideoId,
    youtubeUrl: validSummary.youtubeUrl,
    originalTitle: validSummary.originalTitle,
    publicationDate: validSummary.publicationDate,
    thumbnailUrl: validSummary.thumbnailUrl,
  });
  assert.equal(canonical.originalTitle, validSummary.originalTitle);
});
