import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "@zentrafi/terminal — Demo",
  description: "Embeddable swap terminal for ZentraFi on Pharos EVM",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
