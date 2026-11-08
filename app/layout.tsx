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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://law-bite.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "LawBite — Indian Legal AI Intelligence Platform",
    template: "%s | LawBite",
  },
  description:
    "Production-grade Indian Legal AI platform powered by Inception Mercury 2.5 dLLM. Features 157+ Indian Bare Acts, Case-Law Research with Good-Law verification, Legal Matter Management, Contract Risk Analyzer, and statutory transition mapping (IPC to BNS).",
  keywords: [
    "Indian Legal AI",
    "LawBite",
    "Bare Acts India",
    "BNS 2023",
    "IPC to BNS mapping",
    "BNSS",
    "BSA",
    "Indian Case Law Research",
    "Supreme Court of India judgments",
    "Legal Matter Management",
    "Contract Risk Analyzer",
    "Document Comparison",
    "Courtroom Prep",
    "Good-Law Precedent Checker",
    "Diffusion LLM",
    "Mercury 2.5",
  ],
  authors: [{ name: "Pratyush", url: "https://github.com/Pratyushhhx01" }],
  creator: "Pratyush (Pratyushhhx01)",
  publisher: "LawBite",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    title: "LawBite — Indian Legal AI Intelligence Platform",
    description:
      "Deterministic Indian statutory verification across 157+ Bare Acts, case-law research with Good-Law precedent verification, and end-to-end legal matter management.",
    siteName: "LawBite",
  },
  twitter: {
    card: "summary_large_image",
    title: "LawBite — Indian Legal AI Intelligence Platform",
    description:
      "Production-grade legal intelligence for Indian Law: Bare Acts RAG, Case-Law Precedent verification, Contract Risk Analyzer, and IPC-to-BNS transition mapping.",
    creator: "@Pratyushhhx01",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#software`,
      name: "LawBite",
      applicationCategory: "LegalApplication",
      operatingSystem: "Web",
      url: APP_URL,
      description:
        "AI-powered Indian legal research, matter management, contract analysis, and statutory citation verification platform.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      featureList: [
        "157+ Indian Bare Acts deterministic statutory lookup",
        "Case-Law Research with Good-Law precedent status checking",
        "Statutory transition mapping (IPC to BNS / CrPC to BNSS / IEA to BSA)",
        "Legal Matter Management with multi-tenant isolation",
        "Contract Risk Analyzer & Document Comparison",
        "Courtroom Preparation & Cross-Examination Outline generation",
        "Statutory Amendment Tracker",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "LawBite",
      url: APP_URL,
      logo: `${APP_URL}/icon.svg`,
      sameAs: ["https://github.com/Pratyushhhx01/LawBite"],
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "LawBite",
      publisher: {
        "@id": `${APP_URL}/#organization`,
      },
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
