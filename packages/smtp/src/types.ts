export interface ParsedEmail {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  rawSource: string;
  headers: Record<string, string>;
  attachments: ParsedAttachment[];
}

export interface ParsedAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}
