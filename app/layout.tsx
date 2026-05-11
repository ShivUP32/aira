import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/aira/PwaRegister";
import { ViewportClass } from "@/components/aira/ViewportClass";
import "./globals.css";

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
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/aira-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/aira-icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Aira",
    statusBarStyle: "default",
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
      className="h-full"
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: "var(--aira-canvas)", color: "var(--aira-ink)" }}
      >
        <PwaRegister />
        <ViewportClass />
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
