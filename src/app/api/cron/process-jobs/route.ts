import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const vercelCronHeader = request.headers.get("x-vercel-cron");

  const isLocalAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  const isVercelCron = vercelCronHeader === "1";

  if (!isLocalAuthorized && !isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/jobs/process`, {
    method: "POST",
  });

  const data = await res.json();

  return NextResponse.json(data);
}