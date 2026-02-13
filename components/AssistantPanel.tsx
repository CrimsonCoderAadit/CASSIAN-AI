"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TypingText from "@/components/TypingText";

// ── Types ────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// ── Constants ────────────────────────────────────────────────

/** Width of the invisible hover trigger strip on the right edge */
const TRIGGER_WIDTH = 18;

/** Panel width in pixels */
const PANEL_WIDTH = 380;

// ── Component ────────────────────────────────────────────────

export default function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm CASSIAN — I'm here to help you navigate, explore, and understand. Ask me anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestAssistantId, setLatestAssistantId] = useState<string>("welcome");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom on new messages
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

    typingIntervalRef.current = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [latestAssistantId]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // ── Mouse edge detection ─────────────────────────────────

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const nearRightEdge = e.clientX >= window.innerWidth - TRIGGER_WIDTH;
      if (nearRightEdge && !open) {
        setOpen(true);
      }
    },
    [open]
  );

  const handleMouseLeave = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Close when mouse leaves the panel area
  const handlePanelMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      // Only close if mouse actually left toward the left (not into a child)
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect && e.clientX < rect.left) {
        setOpen(false);
      }
    },
    []
  );

  // ── Clear chat ──────────────────────────────────────────

  function handleClear() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: "Hi! I'm CASSIAN — I'm here to help you navigate, explore, and understand. Ask me anything.",
      },
    ]);
    setInput("");
  }

  // ── Send message ─────────────────────────────────────────

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
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
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

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Invisible hover trigger strip */}
      <div
        className="fixed right-0 top-0 z-[60] h-full"
        style={{ width: TRIGGER_WIDTH }}
        onMouseEnter={() => setOpen(true)}
      />

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ x: PANEL_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: PANEL_WIDTH }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            onMouseLeave={handlePanelMouseLeave}
            className="fixed right-0 top-0 z-[55] flex h-full flex-col border-l border-border bg-surface/95 backdrop-blur-md transition-theme"
            style={{ width: PANEL_WIDTH }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-neon animate-pulse" />
                <span className="text-sm font-semibold tracking-wide text-foreground">
                  CASSIAN Assistant
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Clear chat */}
                <button
                  onClick={handleClear}
                  title="Clear chat"
                  className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  title="Close"
                  className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
              {messages.map((msg) => {
                const isLatestAssistant = msg.role === "assistant" && msg.id === latestAssistantId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
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
              })}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-lg bg-surface-hover px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon/60" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-neon/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="flex shrink-0 items-center justify-center rounded-lg bg-neon/15 p-2 text-neon transition-colors hover:bg-neon/25 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Simple markdown-ish renderer ─────────────────────────────

function MessageContent({ text }: { text: string }) {
  // Split into lines, handle bold (**text**) and italic (*text*)
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1" />;

        // Replace **bold** and *italic*
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

        // Detect list items
        const isBullet = /^\s*[-*]\s/.test(line);
        const isNumbered = /^\s*\d+\.\s/.test(line);

        if (isBullet || isNumbered) {
          return (
            <div key={i} className="pl-3">
              {rendered}
            </div>
          );
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
