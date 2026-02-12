import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FileChunk, FileSummary, RepoSummary } from "@/types";

// ── Gemini client ───────────────────────────────────────────

const apiKey = process.env.GEMINI_API_KEY;

function getModel() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ── Configuration ───────────────────────────────────────────

/** Max chunks to send per batch when summarising files */
const FILE_BATCH_SIZE = 15;

/** Max total chars of chunk content per batch (stay well under Gemini's limit) */
const BATCH_CHAR_LIMIT = 60_000;

/** Max file summaries to feed into the repo-level overview prompt */
const OVERVIEW_SUMMARY_LIMIT = 80;

// ── Helpers ─────────────────────────────────────────────────

/**
 * Call Gemini with a prompt and return the text response.
 * Returns a fallback string on any error so callers never throw.
 */
async function callGemini(
  prompt: string,
  fallback: string
): Promise<string> {
  try {
    const model = getModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });
    const text = result.response.text();
    return text.trim() || fallback;
  } catch (err) {
    console.error("[aiSummarizer] Gemini call failed:", err);
    return fallback;
  }
}

/**
 * Wait for `ms` milliseconds. Used between batches to avoid rate limits.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Group chunks by file ────────────────────────────────────

interface GroupedFile {
  filePath: string;
  language: string;
  chunks: string[];
}

/**
 * Merge chunks back into per-file groups for summarisation.
 */
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

/**
 * Build a prompt that asks Gemini to summarise one or more files in a batch.
 */
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

/**
 * Parse the numbered-list response from Gemini back into FileSummary objects.
 * Falls back to a generic summary if parsing fails for a file.
 */
function parseBatchResponse(
  raw: string,
  batch: GroupedFile[]
): FileSummary[] {
  const summaries: FileSummary[] = [];

  for (const file of batch) {
    // Try to find a line that contains this file path
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

/**
 * Summarise all files in batches and return a flat array of FileSummary.
 */
async function summariseAllFiles(
  groups: GroupedFile[]
): Promise<FileSummary[]> {
  const allSummaries: FileSummary[] = [];

  // Build batches respecting both count and char limits
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

    // Brief pause between batches to avoid rate-limiting
    if (i < batches.length - 1) {
      await sleep(500);
    }
  }

  return allSummaries;
}

// ── Repo-level overview ─────────────────────────────────────

/**
 * Build a prompt that asks Gemini for a high-level project overview.
 */
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

/**
 * Build a prompt for an architecture analysis.
 */
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

/**
 * Generate a complete RepoSummary: per-file summaries + project overview + architecture.
 *
 * This is the main entry point called by the upload route.
 * Fails safely — if Gemini is unreachable the summaries will contain
 * fallback text rather than throwing.
 */
export async function summarizeRepo(
  repoId: string,
  repoName: string,
  chunks: FileChunk[]
): Promise<RepoSummary> {
  const groups = groupChunksByFile(chunks);
  const fileSummaries = await summariseAllFiles(groups);

  // Run overview and architecture prompts in parallel
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
