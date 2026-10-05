import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Umujyanama w'Ubuhinzi · SAN TECH",
  description: "Kinyarwanda-first agricultural advice for Rwandan smallholder farmers.",
  // The app has its own Kinyarwanda/English switch; browser auto-translation garbles it.
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4a2e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="rw" translate="no" className="notranslate">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Exo:wght@400;600;700&family=Open+Sans:wght@400;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
