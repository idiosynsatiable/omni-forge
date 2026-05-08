import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Omni-Forge Phase 3 — Autonomous Foundry",
  description: "Autonomous deployment, revenue intelligence, and TemplateForge validation command center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
