import AppLayout from "@/components/Layout";

export default function RepositoriesPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-foreground">
            Repositories
          </h1>
          <p className="mt-1 text-sm text-muted">
            Browse and manage your analysed codebases.
          </p>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-8 py-20">
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
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm font-medium text-foreground">
            No repositories yet
          </p>
          <p className="mt-1 text-xs text-muted">
            Upload a repository to see it listed here
          </p>
          <a
            href="/upload"
            className="mt-5 rounded-lg border border-neon/50 bg-neon/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neon transition-all duration-200 hover:bg-neon/20"
          >
            Upload
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
