import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aira — Your Board Exam Buddy",
    template: "%s | Aira",
  },
  description:
    "The Class 12 board exam buddy that gets you extra marks. AI-powered study assistant for CBSE students.",
  keywords: [
    "CBSE",
    "Class 12",
    "board exam",
    "AI tutor",
    "Physics",
    "Chemistry",
    "Math",
    "Computer Science",
    "study assistant",
    "extra marks",
  ],
  authors: [{ name: "Aira" }],
  creator: "Aira",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Aira — Your Board Exam Buddy",
    description:
      "The Class 12 board exam buddy that gets you extra marks. Built on 2025 CBSE Board papers.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aira — Your Board Exam Buddy",
    description: "The Class 12 board exam buddy that gets you extra marks.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#4C44B8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full`}
    >
      <head>
        {/* Google Fonts: Newsreader, JetBrains Mono, Tiro Devanagari Hindi */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=JetBrains+Mono:wght@400;500&family=Tiro+Devanagari+Hindi&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: "var(--aira-canvas)", color: "var(--aira-ink)" }}
      >
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-geist-sans)",
              background: "var(--aira-paper)",
              border: "1px solid var(--aira-line)",
              color: "var(--aira-ink)",
            },
          }}
        />
      </body>
    </html>
  );
}
