"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type VisualMode = "default" | "cyberpunk" | "minimal" | "cosmic" | "matrix";

interface AppearanceContextValue {
  visualMode: VisualMode;
  setVisualMode: (mode: VisualMode) => void;
  customBackground: string | null;
  setCustomBackground: (bg: string | null) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (opacity: number) => void;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  visualMode: "default",
  setVisualMode: () => {},
  customBackground: null,
  setCustomBackground: () => {},
  backgroundOpacity: 0.15,
  setBackgroundOpacity: () => {},
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [visualMode, setVisualModeState] = useState<VisualMode>("default");
  const [customBackground, setCustomBackgroundState] = useState<string | null>(null);
  const [backgroundOpacity, setBackgroundOpacityState] = useState(0.15);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("cassian-visual-mode") as VisualMode;
    const savedBg = localStorage.getItem("cassian-custom-bg");
    const savedOpacity = localStorage.getItem("cassian-bg-opacity");

    if (savedMode && ["default", "cyberpunk", "minimal", "cosmic", "matrix"].includes(savedMode)) {
      setVisualModeState(savedMode);
    }
    if (savedBg) {
      setCustomBackgroundState(savedBg);
    }
    if (savedOpacity) {
      setBackgroundOpacityState(parseFloat(savedOpacity));
    }

    setMounted(true);
  }, []);

  // Apply visual mode to document
  useEffect(() => {
    if (!mounted) return;

    // Remove all mode classes
    document.documentElement.classList.remove(
      "mode-default",
      "mode-cyberpunk",
      "mode-minimal",
      "mode-cosmic",
      "mode-matrix"
    );

    // Add current mode class
    document.documentElement.classList.add(`mode-${visualMode}`);
  }, [visualMode, mounted]);

  const setVisualMode = useCallback((mode: VisualMode) => {
    setVisualModeState(mode);
    localStorage.setItem("cassian-visual-mode", mode);
  }, []);

  const setCustomBackground = useCallback((bg: string | null) => {
    setCustomBackgroundState(bg);
    if (bg) {
      localStorage.setItem("cassian-custom-bg", bg);
    } else {
      localStorage.removeItem("cassian-custom-bg");
    }
  }, []);

  const setBackgroundOpacity = useCallback((opacity: number) => {
    setBackgroundOpacityState(opacity);
    localStorage.setItem("cassian-bg-opacity", opacity.toString());
  }, []);

  return (
    <AppearanceContext.Provider
      value={{
        visualMode,
        setVisualMode,
        customBackground,
        setCustomBackground,
        backgroundOpacity,
        setBackgroundOpacity,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
