import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropAgent CRM Lite",
  description: "North Singapore property CRM with AI agent assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
