import { simpleParser } from "mailparser";
import type { Readable } from "stream";
import type { ParsedEmail } from "./types";

/**
 * Collects all chunks from a readable stream into a single Buffer.
 */
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Parses a raw email from a readable stream into a structured ParsedEmail.
 * Uses mailparser's simpleParser under the hood.
 */
export async function parseEmailStream(stream: Readable): Promise<ParsedEmail> {
  const rawBuffer = await streamToBuffer(stream);
  return parseEmailBuffer(rawBuffer);
}

/**
 * Parses a raw email from a Buffer into a structured ParsedEmail.
 */
export async function parseEmailBuffer(rawBuffer: Buffer): Promise<ParsedEmail> {
  const rawSource = rawBuffer.toString("utf-8");
  const parsed = await simpleParser(rawBuffer);

  const from = parsed.from?.text ?? "unknown";

  const to = parsed.to
    ? Array.isArray(parsed.to)
      ? parsed.to.map((a) => a.text)
      : [parsed.to.text]
    : [];

  const cc = parsed.cc
    ? Array.isArray(parsed.cc)
      ? parsed.cc.map((a) => a.text)
      : [parsed.cc.text]
    : [];

  const bcc = parsed.bcc
    ? Array.isArray(parsed.bcc)
      ? parsed.bcc.map((a) => a.text)
      : [parsed.bcc.text]
    : [];

  const subject = parsed.subject ?? "(no subject)";
  const htmlBody = parsed.html || null;
  const textBody = parsed.text || null;

  const headers: Record<string, string> = {};
  for (const [key, value] of parsed.headers) {
    headers[key] = typeof value === "string" ? value : String(value);
  }

  const attachments = (parsed.attachments ?? []).map((att) => ({
    filename: att.filename || "unnamed",
    contentType: att.contentType || "application/octet-stream",
    size: att.size,
    content: att.content,
  }));

  return {
    from,
    to,
    cc,
    bcc,
    subject,
    htmlBody,
    textBody,
    rawSource,
    headers,
    attachments,
  };
}
