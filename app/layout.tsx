import type { Metadata } from "next";
import { Geist, Geist_Mono, Exo_2, VT323 } from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/lib/env";

validateEnv();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "LawBite — know your rights",
  description:
    "AI-powered legal assistant for Indian law. Get instant analysis, draft documents, and research across 157+ bare acts.",
  openGraph: {
    title: "LawBite — know your rights",
    description:
      "AI-powered legal assistant for Indian law. Get instant analysis, draft documents, and research across 157+ bare acts.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "LawBite — know your rights",
    description:
      "AI-powered legal assistant for Indian law. Get instant analysis, draft documents, and research across 157+ bare acts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${exo2.variable} ${vt323.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
