import React from "react";

/**
 * The web build is the app itself, not a marketing preview. Keep this wrapper
 * so the root layout stays stable, but never place the UI inside an artificial
 * phone shell. Real phones and landscape browsers should own the full viewport.
 */
export function AppViewportFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
