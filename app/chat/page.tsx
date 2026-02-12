"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/Layout";

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

// ── Page component ───────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [repoId] = useState<string | null>(null);
  const [sparkle, setSparkle] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      const endpoint = repoId ? "/api/chat" : "/api/assistant-chat";
      const body = repoId
        ? { repoId, question: text }
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

      setMessages((prev) => [
        ...prev,
        { id: `asst-${Date.now()}`, role: "assistant", text: answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
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
            <h1 className="text-2xl font-semibold text-foreground">
              Chat with Code
            </h1>
            <p className="mt-1 text-sm text-muted">
              {repoId
                ? "Ask questions about your uploaded repository."
                : "Upload a repository to chat about code, or ask general questions."}
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
              messages.map((msg) => (
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
                    <MessageContent text={msg.text} />
                  </div>
                </div>
              ))
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
