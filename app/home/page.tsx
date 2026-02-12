"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/Layout";
import { useTheme } from "@/context/ThemeContext";

// ── Constellation easter egg ─────────────────────────────────

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let w = 0;
    let h = 0;

    interface Star {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }

    const stars: Star[] = [];
    const STAR_COUNT = 30;
    const CONNECT_DIST = 120;

    function resize() {
      w = canvas!.offsetWidth;
      h = canvas!.offsetHeight;
      canvas!.width = w;
      canvas!.height = h;
    }

    function init() {
      resize();
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5,
        });
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const isDark = theme === "dark";
      const dotColor = isDark ? "rgba(34,197,94," : "rgba(239,68,68,";
      const lineColor = isDark ? "rgba(34,197,94," : "rgba(239,68,68,";

      // Update & draw stars
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0 || s.x > w) s.vx *= -1;
        if (s.y < 0 || s.y > h) s.vy *= -1;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor + "0.25)";
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = lineColor + alpha + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrame = requestAnimationFrame(draw);
    }

    init();
    draw();

    window.addEventListener("resize", () => { resize(); });

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60"
    />
  );
}

// ── Card variants ────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

// ── Page ─────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <AppLayout>
      <div className="relative p-8">
        {/* Constellation background */}
        <ConstellationCanvas />

        <div className="relative z-10">
          {/* Header */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">
              Welcome to CASSIAN — Code Analysis System for Software Intelligence &amp; Navigation.
            </p>
          </motion.div>

          {/* Stats grid */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Repositories", value: "0", sub: "uploaded" },
              { label: "Files Parsed", value: "0", sub: "across all repos" },
              { label: "Chunks", value: "0", sub: "indexed" },
              { label: "Questions", value: "0", sub: "answered" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                className="rounded-xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-neon/20"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mb-10">
            <motion.h2
              className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              Quick Actions
            </motion.h2>
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
              ].map((action, i) => (
                <motion.a
                  key={action.title}
                  href={action.href}
                  custom={i + 4}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.a>
              ))}
            </div>
          </div>

          {/* System info — fills empty space at bottom */}
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" as const }}
          >
            {/* About card */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/60">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">About CASSIAN</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                <strong className="text-neon">CASSIAN</strong> — Code Analysis System for Software Intelligence &amp; Navigation.
                I help you upload repositories, generate intelligent summaries, and chat with your code in plain English.
              </p>
            </div>

            {/* System status */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon/60">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">System Status</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "AI Engine", status: "Multi-model Smart" },
                  { label: "Auth", status: "Secure Sign-in" },
                  { label: "Theme", status: "Dark / Light" },
                  { label: "Version", status: "v0.1.0" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{item.label}</span>
                    <span className="text-foreground/70">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
