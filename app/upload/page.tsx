import AppLayout from "@/components/Layout";

export default function UploadPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-foreground">Upload</h1>
          <p className="mt-1 text-sm text-muted">
            Paste a GitHub URL or upload a ZIP file to analyse.
          </p>
        </div>

        {/* Upload area placeholder */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-8 py-20 transition-colors duration-200 hover:border-neon/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-muted"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <p className="text-sm font-medium text-foreground">
            Upload functionality coming soon
          </p>
          <p className="mt-1 text-xs text-muted">
            GitHub URL input and ZIP file upload will appear here
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
