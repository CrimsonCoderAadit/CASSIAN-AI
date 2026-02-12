"use client";

import { motion } from "framer-motion";
import AppLayout from "@/components/Layout";

export default function RepositoriesPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-semibold text-foreground">
            Repositories
          </h1>
          <p className="mt-1 text-sm text-muted">
            Browse and manage your analysed codebases.
          </p>
        </motion.div>

        {/* Empty state */}
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-8 py-20"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
        >
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
          <motion.a
            href="/upload"
            className="mt-5 rounded-lg border border-neon/50 bg-neon/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neon transition-all duration-200 hover:bg-neon/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Upload
          </motion.a>
        </motion.div>

        {/* Tips section — fills empty space */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Tips
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                title: "Supported Sources",
                desc: "Upload public GitHub repos via URL, or any codebase as a ZIP file (up to 50MB).",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/50">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                ),
              },
              {
                title: "What Gets Analysed",
                desc: "I parse source files, chunk them for context, and generate per-file summaries plus an architecture overview.",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/50">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                ),
              },
              {
                title: "Data Retention",
                desc: "Uploaded repo data is stored in-memory and expires after a period. Re-upload if your session has expired.",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/50">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
              },
              {
                title: "Smart Resilience",
                desc: "I use multiple models with automatic fallback, so analysis and chat remain reliable even under heavy load.",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/50">
                    <path d="M12 2v4" />
                    <path d="m6.8 15-3.5 2" />
                    <path d="m20.7 7-3.5 2" />
                    <path d="M6.8 9 3.3 7" />
                    <path d="m20.7 17-3.5-2" />
                    <path d="m9 22 3-8 3 8" />
                    <path d="M8 6h8" />
                    <path d="M12 6v16" />
                  </svg>
                ),
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <div className="mt-0.5 shrink-0">{tip.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
