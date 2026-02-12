"use client";

import Starfield from "@/components/Starfield";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import CaspianEasterEgg from "@/components/CaspianEasterEgg";

export default function GlobalVisualLayer() {
  return (
    <>
      <Starfield />
      <ScanlineOverlay />
      <CaspianEasterEgg />
    </>
  );
}
