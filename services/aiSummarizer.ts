import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FileChunk, FileSummary, RepoSummary } from "@/types";

// ── Gemini multi-model engine ─────────────────────────────────

const apiKey = process.env.GEMINI_API_KEY;

/**
 * Ordered list of Gemini models to try. If the first model fails,
 * the next one is attempted, and so on.
 */
const MODEL_CASCADE = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;

/** Result returned by the multi-model caller */
export interface GeminiResult {
  text: string;
  model: string;
}

/**
 * Sleep for `ms` milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Gemini with automatic model fallback and one retry per model.
 *
 * Tries each model in MODEL_CASCADE. For each model it makes up to 2
 * attempts (initial + one retry with exponential backoff).
 * Returns the first successful response.
 *
 * If all models fail, returns the fallback string.
 */
export async function callGeminiWithFallback(
  prompt: string,
  fallback: string,
  opts: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<GeminiResult> {
  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY is not set");
    return { text: fallback, model: "fallback" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const temperature = opts.temperature ?? 0.3;
  const maxOutputTokens = opts.maxOutputTokens ?? 2048;

  for (const modelName of MODEL_CASCADE) {
    const model = genAI.getGenerativeModel({ model: modelName });

    // Up to 2 attempts per model (initial + 1 retry)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          const backoff = 1000 * Math.pow(2, attempt);
          console.log(`[gemini] Retrying ${modelName} after ${backoff}ms (attempt ${attempt + 1})`);
          await sleep(backoff);
        }

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens },
        });

        const text = result.response.text().trim();
        if (text) {
          console.log(`[gemini] Success with model=${modelName} (attempt ${attempt + 1})`);
          return { text, model: modelName };
        }

        // Empty response — treat as failure, try next attempt/model
        console.warn(`[gemini] Empty response from ${modelName} (attempt ${attempt + 1})`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[gemini] ${modelName} attempt ${attempt + 1} failed: ${errMsg}`);

        // If it's a non-retryable error (e.g. invalid API key), break out of retries
        if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("PERMISSION_DENIED")) {
          console.error("[gemini] Non-retryable error, aborting all models");
          return { text: fallback, model: "fallback" };
        }
      }
    }

    console.warn(`[gemini] All attempts exhausted for ${modelName}, trying next model`);
  }

  console.error("[gemini] All models exhausted. Using fallback.");
  return { text: fallback, model: "fallback" };
}

/**
 * Simplified wrapper matching the old `callGemini` signature for backwards compatibility.
 * Returns just the text string.
 */
async function callGemini(prompt: string, fallback: string): Promise<string> {
  const result = await callGeminiWithFallback(prompt, fallback);
  return result.text;
}

// ── Configuration ───────────────────────────────────────────

const FILE_BATCH_SIZE = 15;
const BATCH_CHAR_LIMIT = 60_000;
const OVERVIEW_SUMMARY_LIMIT = 80;

// ── Group chunks by file ────────────────────────────────────

interface GroupedFile {
  filePath: string;
  language: string;
  chunks: string[];
}

function groupChunksByFile(chunks: FileChunk[]): GroupedFile[] {
  const map = new Map<string, GroupedFile>();

  for (const chunk of chunks) {
    let group = map.get(chunk.filePath);
    if (!group) {
      group = { filePath: chunk.filePath, language: chunk.language, chunks: [] };
      map.set(chunk.filePath, group);
    }
    group.chunks.push(chunk.content);
  }

  return Array.from(map.values());
}

// ── File-level summaries ────────────────────────────────────

function buildFileBatchPrompt(batch: GroupedFile[]): string {
  const fileBlocks = batch
    .map((f) => {
      const content = f.chunks.join("\n");
      return `### File: ${f.filePath} (${f.language})\n\`\`\`${f.language}\n${content}\n\`\`\``;
    })
    .join("\n\n");

  return `You are a senior software engineer analysing a codebase.

For EACH file below, produce a concise technical summary (2-4 sentences).
Focus on: purpose, key exports/functions, dependencies, and patterns used.

Return your answer as a numbered list in this exact format (one entry per file, no extra text):
1. **<file path>**: <summary>
2. **<file path>**: <summary>
...

${fileBlocks}`;
}

function parseBatchResponse(
  raw: string,
  batch: GroupedFile[]
): FileSummary[] {
  const summaries: FileSummary[] = [];

  for (const file of batch) {
    const escaped = file.filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\*\\*${escaped}\\*\\*:\\s*(.+)`, "i");
    const match = raw.match(re);

    summaries.push({
      filePath: file.filePath,
      language: file.language,
      summary: match?.[1]?.trim() || `Source file at ${file.filePath}`,
    });
  }

  return summaries;
}

async function summariseAllFiles(
  groups: GroupedFile[]
): Promise<FileSummary[]> {
  const allSummaries: FileSummary[] = [];

  const batches: GroupedFile[][] = [];
  let currentBatch: GroupedFile[] = [];
  let currentChars = 0;

  for (const group of groups) {
    const groupChars = group.chunks.reduce((sum, c) => sum + c.length, 0);

    if (
      currentBatch.length >= FILE_BATCH_SIZE ||
      (currentBatch.length > 0 && currentChars + groupChars > BATCH_CHAR_LIMIT)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(group);
    currentChars += groupChars;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const prompt = buildFileBatchPrompt(batch);
    const raw = await callGemini(
      prompt,
      batch.map((f) => `**${f.filePath}**: Source file`).join("\n")
    );

    const parsed = parseBatchResponse(raw, batch);
    allSummaries.push(...parsed);

    if (i < batches.length - 1) {
      await sleep(500);
    }
  }

  return allSummaries;
}

// ── Repo-level overview ─────────────────────────────────────

function buildOverviewPrompt(
  repoName: string,
  fileSummaries: FileSummary[]
): string {
  const limited = fileSummaries.slice(0, OVERVIEW_SUMMARY_LIMIT);
  const listing = limited
    .map((s) => `- **${s.filePath}** (${s.language}): ${s.summary}`)
    .join("\n");

  return `You are a senior software architect analysing a repository named "${repoName}".

Below is a list of files and their summaries:

${listing}

Provide a concise project overview in 3-5 sentences. Cover:
- What the project does
- The primary language(s) and framework(s)
- How the code is organised (major modules/layers)

Be technical but clear. Do not list individual files.`;
}

function buildArchitecturePrompt(
  repoName: string,
  fileSummaries: FileSummary[]
): string {
  const limited = fileSummaries.slice(0, OVERVIEW_SUMMARY_LIMIT);
  const listing = limited
    .map((s) => `- ${s.filePath} (${s.language}): ${s.summary}`)
    .join("\n");

  return `You are a senior software architect analysing the architecture of "${repoName}".

File summaries:
${listing}

Produce a concise architecture overview (4-8 sentences) covering:
- System layers (frontend, backend, data, infrastructure)
- Key design patterns (MVC, microservices, event-driven, etc.)
- Data flow between major components
- Entry points and external interfaces

Be specific to this codebase. Do not list every file.`;
}

// ── Public API ──────────────────────────────────────────────

export async function summarizeRepo(
  repoId: string,
  repoName: string,
  chunks: FileChunk[]
): Promise<RepoSummary> {
  const groups = groupChunksByFile(chunks);
  const fileSummaries = await summariseAllFiles(groups);

  const [overview, architecture] = await Promise.all([
    callGemini(
      buildOverviewPrompt(repoName, fileSummaries),
      `${repoName} is a software project with ${groups.length} source files.`
    ),
    callGemini(
      buildArchitecturePrompt(repoName, fileSummaries),
      `The architecture of ${repoName} could not be determined.`
    ),
  ]);

  return {
    repoId,
    overview,
    architecture,
    fileSummaries,
    generatedAt: new Date().toISOString(),
  };
}
