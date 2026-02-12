"use client";

import { motion } from "framer-motion";
import AppLayout from "@/components/Layout";

export default function UploadPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-semibold text-foreground">Upload</h1>
          <p className="mt-1 text-sm text-muted">
            Paste a GitHub URL or upload a ZIP file to analyse.
          </p>
        </motion.div>

        {/* Upload area */}
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-8 py-20 transition-colors duration-200 hover:border-neon/30"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
          whileHover={{ borderColor: "var(--accent)", transition: { duration: 0.2 } }}
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
        </motion.div>

        {/* How it works — fills empty space */}
        <motion.div
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
        >
          {[
            {
              step: "1",
              title: "Provide Source",
              desc: "Paste a public GitHub URL or drag & drop a ZIP archive of your codebase.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/50">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              ),
            },
            {
              step: "2",
              title: "AI Analysis",
              desc: "I parse every file, chunk the code, and generate per-file summaries with intelligent analysis.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/50">
                  <path d="M12 20h9" />
                  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                </svg>
              ),
            },
            {
              step: "3",
              title: "Chat with Code",
              desc: "Ask questions in plain English and get answers referencing specific files and functions.",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/50">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neon/20 bg-neon/5 text-[11px] font-bold text-neon">
                  {item.step}
                </div>
                {item.icon}
              </div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </AppLayout>
  );
}
