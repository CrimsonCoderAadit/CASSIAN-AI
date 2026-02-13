"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
}

const STAR_COUNT = 150;
const DRIFT_SPEED = 0.08;

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);

  const createStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.2 + 0.3,
        baseOpacity: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * DRIFT_SPEED,
        vy: (Math.random() - 0.5) * DRIFT_SPEED,
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
      if (starsRef.current.length === 0) {
        createStars(w, h);
      }
    }

    resize();
    if (starsRef.current.length === 0) {
      createStars(w, h);
    }

    const isDark = theme === "dark";
    // Stars are white in dark mode, light gray in light mode
    const starR = isDark ? 255 : 120;
    const starG = isDark ? 255 : 120;
    const starB = isDark ? 255 : 120;

    let frame = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      frame++;
      const stars = starsRef.current;

      for (const s of stars) {
        // Drift
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -2) s.x = w + 2;
        if (s.x > w + 2) s.x = -2;
        if (s.y < -2) s.y = h + 2;
        if (s.y > h + 2) s.y = -2;

        // Twinkle
        const twinkle = Math.sin(frame * s.twinkleSpeed + s.twinkleOffset);
        const opacity = s.baseOpacity + twinkle * 0.2;
        const clampedOpacity = Math.max(0.03, Math.min(0.7, opacity));

        // Core dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starR},${starG},${starB},${clampedOpacity})`;
        ctx.fill();

        // Soft glow halo
        if (clampedOpacity > 0.3) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${starR},${starG},${starB},${clampedOpacity * 0.08})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [theme, createStars]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden="true"
    />
  );
}
