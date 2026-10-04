import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Umujyanama w'Ubuhinzi · Farm Advisor",
  description: "Kinyarwanda-first agricultural advice for Rwandan smallholder farmers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="rw">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
