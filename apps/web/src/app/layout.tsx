import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailFail — Local Email Catching & Validation for Developers",
  description:
    "Stop sending test emails to real inboxes. MailFail catches every email your app sends during development with built-in validation.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MailFail — Local Email Catching & Validation for Developers",
    description:
      "Stop sending test emails to real inboxes. MailFail catches every email your app sends during development with built-in validation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#09090b] text-zinc-200 antialiased font-[Inter]">
        {children}
      </body>
    </html>
  );
}
