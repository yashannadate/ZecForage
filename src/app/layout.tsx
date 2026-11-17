import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ZecPayKit — Shielded Zcash Payment Integration Testbench",
  description: "Testbench and developer suite for testing shielded Zcash merchant checkout integrations, ZIP-321 invoices, address validation, and webhook reconciliations.",
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

