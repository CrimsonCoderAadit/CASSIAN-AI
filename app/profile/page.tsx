"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/Layout";
import { useAppearance, VisualMode } from "@/context/AppearanceContext";

const VISUAL_MODES: {
  id: VisualMode;
  name: string;
  description: string;
  preview: string;
}[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean black/green neon (dark) or white/red (light)",
    preview: "🎨",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Electric purple + cyan, strong neon glow, futuristic terminal",
    preview: "⚡",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Flat UI, soft grayscale, professional dashboard style",
    preview: "✨",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    description: "Deep space, blue + violet accents, floating UI feel",
    preview: "🌌",
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Green terminal glow, code rain, hacker aesthetic",
    preview: "💚",
  },
];

export default function ProfilePage() {
  const {
    visualMode,
    setVisualMode,
    customBackground,
    setCustomBackground,
    backgroundOpacity,
    setBackgroundOpacity,
  } = useAppearance();

  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleApplyBackground() {
    if (uploadPreview) {
      setCustomBackground(uploadPreview);
      setUploadPreview(null);
    }
  }

  function handleResetBackground() {
    setCustomBackground(null);
    setUploadPreview(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadPreview(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <AppLayout>
      <div className="relative flex h-full flex-col overflow-y-auto p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-semibold text-foreground">
            Profile & Customization
          </h1>
          <p className="mt-1 text-sm text-muted">
            Personalize your CASSIAN experience with visual themes and custom backgrounds.
          </p>
        </motion.div>

        {/* Visual Modes Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-foreground">Visual Modes</h2>
          <p className="mt-1 text-xs text-muted">
            Choose a theme that matches your style. Changes apply instantly.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VISUAL_MODES.map((mode) => {
              const isActive = visualMode === mode.id;
              return (
                <motion.button
                  key={mode.id}
                  onClick={() => setVisualMode(mode.id)}
                  className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-neon bg-neon/10"
                      : "border-border bg-surface hover:border-neon/30 hover:bg-surface-hover"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{mode.preview}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{mode.name}</h3>
                      <p className="mt-1 text-xs text-muted">{mode.description}</p>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      className="absolute right-3 top-3"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-neon"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Custom Background Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground">Custom Background</h2>
          <p className="mt-1 text-xs text-muted">
            Upload your own background image to personalize the interface.
          </p>

          <div className="mt-4 space-y-4">
            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface p-8 text-center transition-colors hover:border-neon/30 hover:bg-surface-hover"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-muted">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {uploadPreview && (
              <motion.div
                className="rounded-xl border border-border bg-surface p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="mb-2 text-xs font-medium text-muted">Preview:</p>
                <div className="relative h-40 overflow-hidden rounded-lg">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleApplyBackground}
                    className="flex-1 rounded-lg bg-neon/20 px-4 py-2 text-sm font-semibold text-neon transition-colors hover:bg-neon/30"
                  >
                    Apply Background
                  </button>
                  <button
                    onClick={() => setUploadPreview(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Current Background */}
            {customBackground && !uploadPreview && (
              <motion.div
                className="rounded-xl border border-border bg-surface p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="mb-2 text-xs font-medium text-muted">Current Background:</p>
                <div className="relative h-40 overflow-hidden rounded-lg">
                  <img
                    src={customBackground}
                    alt="Current background"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  onClick={handleResetBackground}
                  className="mt-3 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover"
                >
                  Reset to Default
                </button>
              </motion.div>
            )}

            {/* Background Opacity */}
            {customBackground && (
              <motion.div
                className="rounded-xl border border-border bg-surface p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <label className="block">
                  <span className="text-xs font-medium text-muted">
                    Background Opacity: {Math.round(backgroundOpacity * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={backgroundOpacity}
                    onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                    className="mt-2 w-full accent-neon"
                  />
                </label>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
