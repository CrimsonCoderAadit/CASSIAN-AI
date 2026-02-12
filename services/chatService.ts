import { GoogleGenerativeAI } from "@google/generative-ai";
import { getChunks } from "@/services/repoStore";
import type { FileChunk, ChatResponse } from "@/types";

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

/** Maximum chunks to include in the prompt context */
const MAX_CONTEXT_CHUNKS = 30;

/** Maximum total chars of context sent to Gemini */
const MAX_CONTEXT_CHARS = 60_000;

// ── Keyword relevance scoring ───────────────────────────────

/**
 * Tokenise a string into lowercase alphanumeric words (>= 2 chars).
 */
function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((w) => w.length >= 2);
}

/**
 * Score a chunk's relevance to the user's question using keyword overlap.
 *
 * Scoring factors:
 * 1. Keyword matches in content (weighted 1)
 * 2. Keyword matches in file path (weighted 3 — path matches are stronger)
 * 3. Bonus for exact multi-word substring match
 */
function scoreChunk(chunk: FileChunk, queryTokens: string[], rawQuery: string): number {
  const lowerContent = chunk.content.toLowerCase();
  const lowerPath = chunk.filePath.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    // Content matches
    const contentMatches = lowerContent.split(token).length - 1;
    score += Math.min(contentMatches, 5); // cap per-token to avoid one keyword dominating

    // Path matches (weighted higher)
    if (lowerPath.includes(token)) {
      score += 3;
    }
  }

  // Bonus for exact substring (multi-word phrases)
  const queryLower = rawQuery.toLowerCase().trim();
  if (queryLower.length > 3 && lowerContent.includes(queryLower)) {
    score += 10;
  }

  return score;
}

/**
 * Select the most relevant chunks for a given question.
 * Returns chunks sorted by relevance, capped by count and char limits.
 */
function selectRelevantChunks(
  chunks: FileChunk[],
  question: string
): FileChunk[] {
  const queryTokens = tokenise(question);

  // Score all chunks
  const scored = chunks.map((chunk) => ({
    chunk,
    score: scoreChunk(chunk, queryTokens, question),
  }));

  // Sort by score descending, then by file path for stability
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.chunk.filePath.localeCompare(b.chunk.filePath);
  });

  // Take top chunks within limits
  const selected: FileChunk[] = [];
  let totalChars = 0;

  for (const { chunk, score } of scored) {
    if (selected.length >= MAX_CONTEXT_CHUNKS) break;
    if (totalChars + chunk.content.length > MAX_CONTEXT_CHARS) break;

    // Only include chunks with at least some relevance,
    // but always include at least 5 chunks for context even if low-scoring
    if (score === 0 && selected.length >= 5) break;

    selected.push(chunk);
    totalChars += chunk.content.length;
  }

  return selected;
}

// ── Prompt building ─────────────────────────────────────────

function buildChatPrompt(question: string, context: FileChunk[]): string {
  const fileBlocks = context
    .map(
      (c) =>
        `### ${c.filePath} (chunk ${c.chunkIndex}, ${c.language})\n\`\`\`${c.language}\n${c.content}\n\`\`\``
    )
    .join("\n\n");

  return `You are an expert software engineer helping a developer understand a codebase.

You have access to the following source code excerpts from the repository:

${fileBlocks}

---

The developer asks:
"${question}"

Provide a clear, technically accurate answer based ONLY on the code shown above.
- Reference specific file paths and function/class names when relevant.
- If the code above does not contain enough information to fully answer, say so honestly.
- Use markdown formatting for readability.
- Be concise but thorough.`;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Answer a question about a previously uploaded repository.
 *
 * Retrieves stored chunks, selects the most relevant ones,
 * sends them with the question to Gemini, and returns the answer.
 *
 * Throws if the repoId is not found in the store.
 * Returns a fallback answer (not throw) if Gemini fails.
 */
export async function askQuestion(
  repoId: string,
  question: string
): Promise<ChatResponse> {
  // Retrieve chunks from in-memory store
  const chunks = getChunks(repoId);
  if (!chunks) {
    throw new Error(
      `Repository ${repoId} not found. It may have expired. Please re-upload.`
    );
  }

  // Select most relevant chunks
  const relevant = selectRelevantChunks(chunks, question);

  // Build prompt and call Gemini
  const prompt = buildChatPrompt(question, relevant);

  let answer: string;
  try {
    const model = getModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });
    answer = result.response.text().trim();

    if (!answer) {
      answer = "I could not generate an answer. Please try rephrasing your question.";
    }
  } catch (err) {
    console.error("[chatService] Gemini call failed:", err);
    answer =
      "I'm unable to reach the AI service right now. Please try again in a moment.";
  }

  return {
    repoId,
    question,
    answer,
    chunksUsed: relevant.length,
  };
}
