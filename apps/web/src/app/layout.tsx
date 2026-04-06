import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailFail — Local Email Catching & Validation for Developers",
  description:
    "Stop sending test emails to real inboxes. MailFail catches every email your app sends during development with built-in validation for links, images, spam, HTML, and accessibility.",
  keywords: [
    "email testing",
    "smtp server",
    "local email",
    "mailtrap alternative",
    "mailhog alternative",
    "mailpit alternative",
    "email validation",
    "email catcher",
    "developer tools",
    "npx mailfail",
  ],
  authors: [{ name: "Johannes Osterkamp" }],
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://mailfail.dev"),
  openGraph: {
    title: "MailFail — Local Email Catching & Validation for Developers",
    description:
      "Stop sending test emails to real inboxes. One command, zero config. Built-in validation for links, images, spam, and accessibility.",
    type: "website",
    url: "https://mailfail.dev",
    siteName: "MailFail",
  },
  twitter: {
    card: "summary_large_image",
    title: "MailFail — Local Email Catching & Validation",
    description: "Stop sending test emails to real inboxes. npx mailfail and you're done.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://mailfail.dev",
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
