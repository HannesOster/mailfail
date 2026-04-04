export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getInbox } from "@mailfail/db/src/queries/inboxes";
import { getEmail } from "@mailfail/db/src/queries/emails";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; mailId: string }> },
) {
  const { user } = await requireAuth();
  const { id, mailId } = await params;

  const inbox = await getInbox(db, id, user.id);
  if (!inbox) return NextResponse.json({ error: "Inbox not found" }, { status: 404 });

  const email = await getEmail(db, mailId, id);
  if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 });

  const { to } = await request.json();
  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "Destination email required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    return NextResponse.json(
      { error: "Email forwarding not configured. Set RESEND_API_KEY." },
      { status: 501 },
    );
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: "MailFail <forwarded@mailfail.dev>",
    to: [to],
    subject: `[Forwarded] ${email.subject}`,
    html: email.htmlBody || email.textBody || "No content",
  } as Parameters<typeof resend.emails.send>[0]);

  return NextResponse.json({ ok: true });
}
