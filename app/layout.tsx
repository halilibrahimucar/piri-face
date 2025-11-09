import type { Metadata } from "next";
import { abcRepro, abcReproMono } from './fonts/fonts';
import "./globals.css";

export const metadata: Metadata = {
  title: "Zaman Makinesi",
  description: "zaman makinesi",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${abcReproMono.variable} ${abcRepro.variable}`} suppressHydrationWarning>
      <body className="overscroll-none">{children}</body>
    </html>
  );
}