import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ZecForge — Developer Workbench for Shielded Zcash Payments",
  description: "ZecForge: Build. Test. Verify. Shield. Open-source developer workbench for building, testing, and validating shielded Zcash merchant payment integrations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased selection:bg-primary-500/30 selection:text-primary-200">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

