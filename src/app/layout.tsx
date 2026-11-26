import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZecForge — Developer Infrastructure for Shielded Zcash Payments",
  description: "ZecForge: Build, validate, simulate, and integrate shielded Zcash payment workflows with developer-first tools for merchants and applications.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-black text-white antialiased selection:bg-cyan-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
