export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { insertHtmlCheck, listHtmlChecks, getHtmlCheckCount } from "@mailfail/db/src/queries/html-checks";
import { upsertValidationResult } from "@mailfail/db/src/queries/validation";
import { checkHtmlCheckLimit } from "@/lib/limits";
import { runValidation } from "@/lib/validation/pipeline";
import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { HtmlCheckSource } from "@mailfail/shared";

export async function GET() {
  const { org } = await requireOrg();
  const checks = await listHtmlChecks(db, org.id);
  return NextResponse.json(checks);
}

export async function POST(request: Request) {
  const { org, orgId } = await requireOrg();

  const count = await getHtmlCheckCount(db, org.id);
  const limit = await checkHtmlCheckLimit(orgId, count);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 403 });
  }

  const body = await request.json();
  const { name, source, htmlContent, sourceUrl } = body as {
    name: string;
    source: HtmlCheckSource;
    htmlContent?: string;
    sourceUrl?: string;
  };

  if (!name || !source) {
    return NextResponse.json({ error: "name and source are required" }, { status: 400 });
  }

  let html = htmlContent ?? "";

  if (source === "url" && sourceUrl) {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(VALIDATION_CONFIG.htmlFetch.timeoutMs),
    });
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > VALIDATION_CONFIG.htmlFetch.maxSizeBytes) {
      return NextResponse.json({ error: "HTML too large (max 5 MB)" }, { status: 400 });
    }
    html = await response.text();
  }

  if (!html) {
    return NextResponse.json({ error: "No HTML content provided" }, { status: 400 });
  }

  const check = await insertHtmlCheck(db, {
    organizationId: org.id,
    name,
    source,
    htmlContent: html,
    sourceUrl,
  });

  const result = await runValidation(html);
  await upsertValidationResult(db, { htmlCheckId: check.id, ...result });

  return NextResponse.json(check, { status: 201 });
}
