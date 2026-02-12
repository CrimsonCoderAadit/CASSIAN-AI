import AppLayout from "@/components/Layout";

export default function ChatPage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Chat with Code
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ask questions about any uploaded repository.
          </p>
        </div>

        {/* Chat area placeholder */}
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border bg-surface">
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm font-medium text-foreground">
            Chat interface coming soon
          </p>
          <p className="mt-1 text-xs text-muted">
            Upload a repository first, then chat about its code here
          </p>
        </div>

        {/* Input placeholder */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <input
            type="text"
            placeholder="Ask a question about the codebase..."
            disabled
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            disabled
            className="rounded-lg bg-neon/20 px-4 py-2 text-xs font-semibold text-neon transition-all duration-200 hover:bg-neon/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
