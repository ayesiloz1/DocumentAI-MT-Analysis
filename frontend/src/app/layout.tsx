import type { Metadata } from "next";
import "./globals.css";
import "../styles/components/index.css";

export const metadata: Metadata = {
  title: "MT Analyzer - Modification Traveler Analysis System",
  description: "AI-powered Modification Traveler analysis and decision support system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
