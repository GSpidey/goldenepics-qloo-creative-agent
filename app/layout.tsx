import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoldenEpics · Qloo Creative Agent",
  description: "Find the cultural connection. Turn audience tastes into an evidence-backed creative brief.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
