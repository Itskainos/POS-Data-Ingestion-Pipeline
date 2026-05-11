import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "POS Data Ingestion | Quicktrack Inc",
  description:
    "Upload raw XML files from your POS systems. Data is parsed into JSON and stored for use by forecasting and daily sales dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-950 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
