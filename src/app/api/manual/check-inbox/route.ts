import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");

    const baseUrl =
      origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/cron/check-real-inbox`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const text = await res.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: "Inbox check did not return JSON.",
          responsePreview: text.slice(0, 300),
        },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Manual inbox check failed.",
      },
      { status: 500 }
    );
  }
}