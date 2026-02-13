"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/Layout";
import TypingText from "@/components/TypingText";
import { useAuth } from "@/context/AuthContext";
import { getProjects, getProjectById } from "@/services/projectStore";
import type { Project } from "@/types";

// ── Types ────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// ── Sparkle easter egg (appears when user types "caspian") ───

function CaspianSparkle({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-neon"
            initial={{
              x: `${30 + Math.random() * 40}%`,
              y: `${30 + Math.random() * 40}%`,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: `${10 + Math.random() * 80}%`,
              y: `${10 + Math.random() * 80}%`,
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.1,
              ease: "easeOut" as const,
            }}
            style={{
              boxShadow: "0 0 6px rgba(var(--accent-rgb), 0.6)",
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Markdown-ish renderer ────────────────────────────────────

function MessageContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1" />;

        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="font-semibold text-neon">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
            return <em key={j}>{part.slice(1, -1)}</em>;
          }
          return <span key={j}>{part}</span>;
        });

        const isBullet = /^\s*[-*]\s/.test(line);
        const isNumbered = /^\s*\d+\.\s/.test(line);
        if (isBullet || isNumbered) {
          return <div key={i} className="pl-3">{rendered}</div>;
        }

        return <div key={i}>{rendered}</div>;
      })}
    </div>
  );
}

// ── Message content with typing animation ────────────────────

function MessageContentTyping({ text }: { text: string }) {
  return <TypingText text={text} speed={60} className="inline-block" />;
}

// ── Page component ───────────────────────────────────────────

function ChatPageContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load projects on mount
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

  // Load project from URL parameter
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (!projectId) {
      setSelectedProject(null);
      return;
    }

    async function loadProject(id: string) {
      try {
        const project = await getProjectById(id);
        if (project) {
          setSelectedProject(project);
        } else {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error("Failed to load project:", error);
        setSelectedProject(null);
      }
    }
    loadProject(projectId);
  }, [searchParams]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-scroll during typing animation
  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    if (latestAssistantId) {
      typingIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [latestAssistantId]);

  // Caspian sparkle easter egg
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.toLowerCase().includes("caspian") && !sparkle) {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 1500);
    }
  }, [sparkle]);

  function handleClear() {
    setMessages([]);
    setInput("");
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const endpoint = selectedProject ? "/api/chat" : "/api/assistant-chat";
      const body = selectedProject
        ? { repoId: selectedProject.id, question: text }
        : { question: text };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      const answer =
        json.success && json.data?.answer
          ? json.data.answer
          : "Sorry, I couldn't get a response. Try again in a moment.";

      const assistantId = `asst-${Date.now()}`;
      setLatestAssistantId(assistantId);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: answer },
      ]);
    } catch {
      const errorId = `err-${Date.now()}`;
      setLatestAssistantId(errorId);
      setMessages((prev) => [
        ...prev,
        {
          id: errorId,
          role: "assistant",
          text: "Something went wrong reaching the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace("/");
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
      </div>
    );
  }

  if (!user) return null;

  // Show project selector if no project is selected
  if (!selectedProject) {
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
              Chat with Code
            </h1>
            <p className="mt-1 text-sm text-muted">
              Select a project to chat about your code
            </p>
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
                Create your first code project to start chatting
              </p>
              <motion.a
                href="/upload"
                className="mt-5 rounded-lg bg-neon px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-neon/90"
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
                <motion.button
                  key={project.id}
                  onClick={() => router.push(`/chat?project=${project.id}`)}
                  className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 text-left transition-all hover:border-neon/30"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                >
                  {/* Source badge */}
                  <div className="mb-3 flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted w-fit">
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

                  {/* Project name */}
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {project.name}
                  </h3>

                  {/* Created date */}
                  <p className="text-xs text-muted">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative flex h-full flex-col p-8">
        {/* Sparkle overlay */}
        <CaspianSparkle active={sparkle} />

        {/* Header with clear button */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {selectedProject.name}
              </h1>
              <motion.button
                onClick={() => router.push("/chat")}
                className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-neon/30 hover:text-foreground"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Change Project
              </motion.button>
            </div>
            <p className="mt-1 text-sm text-muted">
              Ask questions about your code
            </p>
          </div>
          {hasMessages && (
            <motion.button
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-neon/30 hover:text-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
              Clear
            </motion.button>
          )}
        </motion.div>

        {/* Chat area */}
        <motion.div
          className="flex flex-1 flex-col rounded-xl border border-border bg-surface overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
        >
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          >
            {!hasMessages ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-hover">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neon/60"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Start a conversation
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted">
                  Ask about your codebase, or try general questions. Type &quot;caspian&quot; for a surprise.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {[
                    "What does this project do?",
                    "How is the code structured?",
                    "What is CASSIAN?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-neon/30 hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isLatestAssistant = msg.role === "assistant" && msg.id === latestAssistantId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-neon/15 text-foreground"
                          : "bg-surface-hover text-foreground"
                      }`}
                    >
                      {isLatestAssistant ? (
                        <MessageContentTyping text={msg.text} />
                      ) : (
                        <MessageContent text={msg.text} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl bg-surface-hover px-4 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon/60" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon/60" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon/60" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Input */}
        <motion.div
          className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the codebase..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-neon/20 px-4 py-2 text-xs font-semibold text-neon transition-all duration-200 hover:bg-neon/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Send
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
