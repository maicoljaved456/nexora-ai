import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");

    const baseUrl =
      origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const inboxRes = await fetch(`${baseUrl}/api/cron/check-real-inbox`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const inboxText = await inboxRes.text();

    let inboxData;

    try {
      inboxData = JSON.parse(inboxText);
    } catch {
      return NextResponse.json(
        {
          error: "Inbox check did not return JSON.",
          responsePreview: inboxText.slice(0, 300),
        },
        { status: 500 }
      );
    }

    if (!inboxRes.ok) {
      return NextResponse.json(inboxData, { status: inboxRes.status });
    }

    const processRes = await fetch(`${baseUrl}/api/jobs/process`, {
      method: "POST",
    });

    const processText = await processRes.text();

    let processData;

    try {
      processData = JSON.parse(processText);
    } catch {
      return NextResponse.json(
        {
          error: "Job processor did not return JSON.",
          responsePreview: processText.slice(0, 300),
        },
        { status: 500 }
      );
    }

    if (!processRes.ok) {
      return NextResponse.json(processData, { status: processRes.status });
    }

    return NextResponse.json({
      success: true,
      inbox: inboxData,
      processing: processData,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Run AI inbox failed.",
      },
      { status: 500 }
    );
  }
}