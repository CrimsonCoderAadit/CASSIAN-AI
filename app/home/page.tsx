import AppLayout from "@/components/Layout";

export default function HomePage() {
  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Upload a repository to get started with AI-powered analysis.
          </p>
        </div>

        {/* Stats grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Repositories", value: "0", sub: "uploaded" },
            { label: "Files Parsed", value: "0", sub: "across all repos" },
            { label: "Chunks", value: "0", sub: "indexed" },
            { label: "Questions", value: "0", sub: "answered" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-neon/20"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Upload Repository",
                description: "Paste a GitHub URL or upload a ZIP file",
                href: "/upload",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                ),
              },
              {
                title: "View Repositories",
                description: "Browse previously analysed codebases",
                href: "/repositories",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
              {
                title: "Chat with Code",
                description: "Ask questions about any uploaded repo",
                href: "/chat",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
            ].map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-neon/30 hover:bg-surface-hover"
              >
                <span className="mt-0.5 text-muted transition-colors duration-200 group-hover:text-neon">
                  {action.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {action.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {action.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
