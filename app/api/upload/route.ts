import { NextRequest, NextResponse } from "next/server";
import { loadRepo, cleanupRepo } from "@/services/repoLoader";
import { listFiles, parseFiles, chunkFiles } from "@/services/fileParser";
import { summarizeRepo } from "@/services/aiSummarizer";
import { saveRepo } from "@/services/repoStore";
import type { ApiResponse, UploadResult, UploadSource } from "@/types";

/**
 * Full pipeline: load → list → parse → chunk → summarise.
 */
async function processRepo(
  source: UploadSource,
  payload: string | Buffer,
  fileName?: string
): Promise<{ result: UploadResult; localPath: string }> {
  const loaded = await loadRepo(source, payload, fileName);
  const files = await listFiles(loaded.localPath);
  const parsed = await parseFiles(loaded.localPath);
  const chunks = await chunkFiles(parsed);

  // AI summarisation (fails safely — returns fallback text on error)
  const summary = await summarizeRepo(loaded.repoId, loaded.repoName, chunks);

  // Persist chunks + summary in memory so /api/chat can use them
  saveRepo(loaded.repoId, loaded.repoName, chunks, summary);

  return {
    localPath: loaded.localPath,
    result: {
      repoId: loaded.repoId,
      repoName: loaded.repoName,
      source,
      fileCount: files.length,
      chunkCount: chunks.length,
      files,
      repoSummary: summary.overview,
      architecture: summary.architecture,
    },
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UploadResult>>> {
  let localPath: string | null = null;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    // ── GitHub URL (JSON body) ──────────────────────────────
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { github_url?: string };

      if (!body.github_url || typeof body.github_url !== "string") {
        return NextResponse.json(
          { success: false, error: "Missing or invalid `github_url` field" },
          { status: 400 }
        );
      }

      const { result, localPath: lp } = await processRepo(
        "github",
        body.github_url
      );
      localPath = lp;

      return NextResponse.json({ success: true, data: result });
    }

    // ── ZIP upload (multipart form-data) ────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { success: false, error: "Missing `file` field in form data" },
          { status: 400 }
        );
      }

      const fileName = file instanceof File ? file.name : "upload.zip";

      if (!fileName.toLowerCase().endsWith(".zip")) {
        return NextResponse.json(
          { success: false, error: "Only .zip files are accepted" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { result, localPath: lp } = await processRepo(
        "zip",
        buffer,
        fileName
      );
      localPath = lp;

      return NextResponse.json({ success: true, data: result });
    }

    // ── Unsupported content type ────────────────────────────
    return NextResponse.json(
      {
        success: false,
        error:
          "Unsupported Content-Type. Send JSON with `github_url` or multipart form-data with a `file` field.",
      },
      { status: 415 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during upload";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  } finally {
    if (localPath) {
      await cleanupRepo(localPath).catch(() => {});
    }
  }
}
