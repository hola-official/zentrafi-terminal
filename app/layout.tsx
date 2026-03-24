import type { Metadata, Viewport } from "next"
import "./globals.css"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://terminal.zentrafi.xyz"
const SITE_NAME = "ZentraFi Terminal"
const DESCRIPTION =
  "A lite, embeddable swap terminal for ZentraFi on Pharos EVM. Drop a DEX swap widget into any dApp in minutes — Integrated, Modal, or floating Widget mode."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Embeddable Pharos DEX Swap Widget`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "ZentraFi", "Pharos", "DEX", "swap", "DeFi", "terminal", "widget",
    "embeddable", "swap aggregator", "EVM", "Web3", "blockchain",
  ],
  authors: [{ name: "ZentraFi", url: "https://x.zentrafi.xyz" }],
  creator: "ZentraFi",
  publisher: "ZentraFi",
  category: "Finance",
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Embeddable Pharos DEX Swap Widget`,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZentraFi Terminal — Embeddable Swap Widget for Pharos EVM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zentrafi",
    creator: "@zentrafi",
    title: `${SITE_NAME} — Embeddable Pharos DEX Swap Widget`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "384x384" },
      { url: "/favicon.ico", type: "image/png", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "384x384" }],
    shortcut: "/icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0f1a",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
