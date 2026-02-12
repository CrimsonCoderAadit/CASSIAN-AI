import { NextRequest, NextResponse } from "next/server";
import { askQuestion } from "@/services/chatService";
import type { ApiResponse, ChatRequest, ChatResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ChatResponse>>> {
  try {
    const body = (await request.json()) as Partial<ChatRequest>;

    // ── Validate input ──────────────────────────────────────
    if (!body.repoId || typeof body.repoId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid `repoId` field" },
        { status: 400 }
      );
    }

    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid `question` field" },
        { status: 400 }
      );
    }

    const question = body.question.trim();
    if (question.length === 0) {
      return NextResponse.json(
        { success: false, error: "Question cannot be empty" },
        { status: 400 }
      );
    }

    if (question.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Question exceeds 2000 character limit" },
        { status: 400 }
      );
    }

    // ── Ask the question ────────────────────────────────────
    const result = await askQuestion(body.repoId, question);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during chat";

    // Use 404 for "repo not found" errors, 500 for everything else
    const status = message.includes("not found") ? 404 : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
