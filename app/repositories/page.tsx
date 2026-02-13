"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { getProjects } from "@/services/projectStore";
import type { Project } from "@/types";

export default function RepositoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace("/");
    }
  }, [user, loading]);

  useEffect(() => {
    async function loadProjects() {
      if (!user) return;
      try {
        const userProjects = await getProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [user]);

  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-8">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Code Projects
              </h1>
              <p className="mt-1 text-sm text-muted">
                Browse and manage your code projects.
              </p>
            </div>
            <motion.a
              href="/upload"
              className="rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-neon/90"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              New Project
            </motion.a>
          </div>
        </motion.div>

        {/* Loading state */}
        {loadingProjects && (
          <motion.div
            className="flex items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
          </motion.div>
        )}

        {/* Empty state */}
        {!loadingProjects && projects.length === 0 && (
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
              No projects yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Create your first code project to get started
            </p>
            <motion.a
              href="/upload"
              className="mt-5 rounded-lg border border-neon/50 bg-neon/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neon transition-all duration-200 hover:bg-neon/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Project
            </motion.a>
          </motion.div>
        )}

        {/* Projects grid */}
        {!loadingProjects && projects.length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 transition-all hover:border-neon/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                whileHover={{ y: -2 }}
              >
                {/* Source badge */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted">
                    {project.source === "github" ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        Text
                      </>
                    )}
                  </div>
                </div>

                {/* Project name */}
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {project.name}
                </h3>

                {/* Created date */}
                <p className="mb-4 text-xs text-muted">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>

                {/* Open button */}
                <motion.button
                  onClick={() => router.push(`/chat?project=${project.id}`)}
                  className="w-full rounded-lg border border-neon/50 bg-neon/10 py-2 text-sm font-semibold text-neon transition-all hover:bg-neon/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Open Project
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
