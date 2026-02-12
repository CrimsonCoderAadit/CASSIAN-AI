import { callGeminiWithFallback } from "@/services/aiSummarizer";
import { getChunks } from "@/services/repoStore";
import type { FileChunk, ChatResponse } from "@/types";

// ── Configuration ───────────────────────────────────────────

/** Maximum chunks to include in the prompt context */
const MAX_CONTEXT_CHUNKS = 20;

/** Maximum total chars of context sent to Gemini (reduced to avoid quota errors) */
const MAX_CONTEXT_CHARS = 40_000;

// ── Rule-based intent detection ─────────────────────────────

interface RuleMatch {
  answer: string;
}

/**
 * Pattern rules checked BEFORE any AI call. If a rule matches,
 * the canned answer is returned instantly — no API call needed.
 */
const RULES: { patterns: RegExp[]; answer: string }[] = [
  // ── Easter egg: Narnia ──────────────────────────────────────
  {
    patterns: [
      /^for narnia[\s!?.]*$/i,
      /^narnia[\s!?.]*$/i,
      /^caspian[\s!?.]*$/i,
      /^aslan[\s!?.]*$/i,
    ],
    answer:
      "I walk the path of knowledge and courage. Every system has its hidden kingdom — explore, and you will discover.",
  },
  // ── Greetings ───────────────────────────────────────────────
  {
    patterns: [
      /^(hi|hello|hey|howdy|yo|hiya|sup|what'?s up)\b/i,
      /^good (morning|afternoon|evening)/i,
    ],
    answer:
      "Hey there! I'm ready to help you understand this codebase. Ask me anything about the code — for example, how a function works, where something is defined, or how the project is structured.",
  },
  {
    patterns: [
      /^(thanks|thank you|thx|ty|cheers)\b/i,
      /^(much appreciated|appreciate it)/i,
    ],
    answer: "You're welcome! Let me know if you have more questions about the code.",
  },
  {
    patterns: [/^help\b/i, /^what can you do/i, /^how do (i|you) use/i],
    answer:
      "I can help you understand this codebase. Try asking things like:\n\n" +
      "- *What does the main entry point do?*\n" +
      "- *How is authentication handled?*\n" +
      "- *What patterns does this project use?*\n" +
      "- *Explain the function `processData`*\n\n" +
      "I'll search through the code and give you a detailed answer.",
  },
  // ── Identity ────────────────────────────────────────────────
  {
    patterns: [
      /what (is|does) cassian/i,
      /what('s| is) cassian/i,
      /what does cassian (stand for|mean)/i,
      /cassian stand for/i,
    ],
    answer:
      "I am **CASSIAN** — **Code Analysis System for Software Intelligence and Navigation**. " +
      "I help you explore, understand, and interact with software systems intelligently.",
  },
  {
    patterns: [
      /^who are you/i,
      /^what are you/i,
      /^tell me about yourself/i,
      /^are you (an? )?ai/i,
    ],
    answer:
      "I am **CASSIAN** — **Code Analysis System for Software Intelligence and Navigation**. " +
      "I help you explore, understand, and interact with software systems intelligently.",
  },
];

/**
 * Check whether the user's message matches a simple rule-based intent.
 * Returns null if no rule matches (meaning AI should handle it).
 */
function matchRule(question: string): RuleMatch | null {
  const trimmed = question.trim();

  // Empty or whitespace-only
  if (trimmed.length === 0) {
    return { answer: "It looks like you sent an empty message. Try typing a question about the codebase!" };
  }

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(trimmed)) {
        console.log(`[chatService] Rule matched: "${trimmed}" → pattern ${pattern}`);
        return { answer: rule.answer };
      }
    }
  }

  return null;
}

// ── Keyword relevance scoring ───────────────────────────────

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((w) => w.length >= 2);
}

function scoreChunk(chunk: FileChunk, queryTokens: string[], rawQuery: string): number {
  const lowerContent = chunk.content.toLowerCase();
  const lowerPath = chunk.filePath.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    const contentMatches = lowerContent.split(token).length - 1;
    score += Math.min(contentMatches, 5);

    if (lowerPath.includes(token)) {
      score += 3;
    }
  }

  const queryLower = rawQuery.toLowerCase().trim();
  if (queryLower.length > 3 && lowerContent.includes(queryLower)) {
    score += 10;
  }

  return score;
}

function selectRelevantChunks(
  chunks: FileChunk[],
  question: string
): FileChunk[] {
  const queryTokens = tokenise(question);

  const scored = chunks.map((chunk) => ({
    chunk,
    score: scoreChunk(chunk, queryTokens, question),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.chunk.filePath.localeCompare(b.chunk.filePath);
  });

  const selected: FileChunk[] = [];
  let totalChars = 0;

  for (const { chunk, score } of scored) {
    if (selected.length >= MAX_CONTEXT_CHUNKS) break;
    if (totalChars + chunk.content.length > MAX_CONTEXT_CHARS) break;
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
 * 1. Check for rule-based matches (no AI call needed)
 * 2. If not a simple intent, retrieve chunks and call Gemini with multi-model fallback
 * 3. Never throws — returns a fallback answer on any error
 */
export async function askQuestion(
  repoId: string,
  question: string
): Promise<ChatResponse> {
  // ── Step 1: Rule-based check ────────────────────────────
  const rule = matchRule(question);
  if (rule) {
    console.log(`[chatService] Returning rule-based response for repoId=${repoId}`);
    return {
      repoId,
      question,
      answer: rule.answer,
      chunksUsed: 0,
      modelUsed: "rule-based",
    };
  }

  // ── Step 2: Retrieve chunks ─────────────────────────────
  const chunks = getChunks(repoId);
  if (!chunks) {
    throw new Error(
      `Repository ${repoId} not found. It may have expired. Please re-upload.`
    );
  }

  // ── Step 3: Select relevant chunks ──────────────────────
  const relevant = selectRelevantChunks(chunks, question);
  console.log(
    `[chatService] Selected ${relevant.length} chunks (${relevant.reduce((s, c) => s + c.content.length, 0)} chars) for question: "${question.slice(0, 80)}..."`
  );

  // ── Step 4: Call Gemini with multi-model fallback ───────
  const prompt = buildChatPrompt(question, relevant);

  const result = await callGeminiWithFallback(
    prompt,
    "I'm unable to reach the AI service right now. Please try again in a moment.",
    { temperature: 0.4, maxOutputTokens: 4096 }
  );

  console.log(`[chatService] AI response from model=${result.model} for repoId=${repoId}`);

  return {
    repoId,
    question,
    answer: result.text,
    chunksUsed: relevant.length,
    modelUsed: result.model,
  };
}
