# MailFail

Local email catching and validation tool for developers. Like Mailtrap, but self-hosted.

Catch all outgoing emails from your app during development, inspect HTML rendering, check links, images, spam score, accessibility, and email client compatibility — all in a local web UI.

## Quick Start

```bash
npx mailfail
```

This starts an SMTP server on port `2525` and a web UI on port `3333`.

Point your app's email config to the local SMTP server:

```env
EMAIL_SMTP_HOST=127.0.0.1
EMAIL_SMTP_PORT=2525
EMAIL_SMTP_USERNAME=dev
EMAIL_SMTP_PASSWORD=dev
```

## Features

- **Email Catching** — intercepts all outgoing emails via local SMTP
- **HTML Preview** — desktop and mobile preview with responsive toggle
- **Validation Pipeline** — checks links, images, spam score, HTML structure, accessibility, and email client compatibility
- **Attachments** — view and download email attachments
- **Forward Emails** — forward caught emails to a real address (requires `RESEND_API_KEY`)
- **Live Updates** — new emails appear instantly via SSE
- **Keyboard Navigation** — arrow keys to browse between emails
- **Dark Mode** — automatic dark mode support

## CLI Options

```
mailfail [options]

Options:
  --smtp-port <port>   SMTP server port (default: 2525)
  --ui-port <port>     Web UI port (default: 3333)
  --dir <path>         Data directory (default: ~/.mailfail)
  --open               Open browser on start
  --no-ui              Run SMTP server only, no web UI
  -V, --version        Output version number
  -h, --help           Display help
```

## Validation Checks

| Check | Description |
|-------|-------------|
| Links | Follows all links, detects broken URLs, redirects, and slow responses |
| Images | Validates image URLs, checks for missing alt text and oversized images |
| Spam Score | Scores 0-10 based on subject line, HTML structure, and content patterns |
| HTML | Validates HTML structure, detects common email rendering issues |
| Accessibility | Checks color contrast, semantic markup, and screen reader compatibility |
| Compatibility | Flags CSS/HTML features unsupported in major email clients |

## Monorepo Structure

```
apps/
  cli/          — CLI tool + web UI (Hono + Vite/React)
  web/          — Landing page (Next.js)
packages/
  db/           — Drizzle ORM, PostgreSQL + SQLite
  shared/       — Types, constants, validation configs
  smtp/         — SMTP email parser
  validation/   — Email validation pipeline
```

## Development

```bash
pnpm install
pnpm dev        # Start SMTP + web UI in dev mode
```

## License

MIT
