const authHeader = request.headers.get("authorization");
const vercelCronHeader = request.headers.get("x-vercel-cron");

const isLocalAuthorized =
  authHeader === `Bearer ${process.env.CRON_SECRET}`;

const isVercelCron = vercelCronHeader === "1";

if (!isLocalAuthorized && !isVercelCron) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}