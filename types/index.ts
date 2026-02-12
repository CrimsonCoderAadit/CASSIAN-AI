// ──────────────────────────────────────────────
// Shared types for ZENITH2026
// ──────────────────────────────────────────────

/** Supported ingestion sources */
export type UploadSource = "github" | "zip";

/** Metadata about an uploaded repository */
export interface RepoMetadata {
  id: string;
  name: string;
  source: UploadSource;
  uploadedAt: string; // ISO-8601
  totalFiles: number;
}

/** A single parsed file from the repository */
export interface ParsedFile {
  path: string;
  extension: string;
  language: string;
  content: string;
  sizeBytes: number;
}

/** A chunk of a file, sized for AI context windows */
export interface FileChunk {
  filePath: string;
  chunkIndex: number;
  language: string;
  content: string;
}

/** AI-generated summary for a single file */
export interface FileSummary {
  filePath: string;
  summary: string;
  language: string;
}

/** AI-generated summary for the entire repository */
export interface RepoSummary {
  repoId: string;
  overview: string;
  architecture: string;
  fileSummaries: FileSummary[];
  generatedAt: string; // ISO-8601
}

/** Response payload from the /api/upload endpoint */
export interface UploadResult {
  repoId: string;
  repoName: string;
  source: UploadSource;
  fileCount: number;
  chunkCount: number;
  files: string[];
  repoSummary: string;
  architecture: string;
}

/** Request body for the /api/chat endpoint */
export interface ChatRequest {
  repoId: string;
  question: string;
}

/** Response payload from the /api/chat endpoint */
export interface ChatResponse {
  repoId: string;
  question: string;
  answer: string;
  chunksUsed: number;
}

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
