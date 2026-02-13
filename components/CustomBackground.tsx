"use client";

import { useAppearance } from "@/context/AppearanceContext";

export default function CustomBackground() {
  const { customBackground, backgroundOpacity } = useAppearance();

  if (!customBackground) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `url(${customBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        opacity: backgroundOpacity,
      }}
    />
  );
}
