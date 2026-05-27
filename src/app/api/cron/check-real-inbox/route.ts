import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
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

  const createdJobs = [];

  try {
    const { data: connections, error: connectionError } =
      await supabase
        .from("gmail_connections")
        .select("*");

    if (connectionError) {
      return NextResponse.json(
        { error: connectionError.message },
        { status: 500 }
      );
    }

    for (const connection of connections || []) {
      const gmailRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10",
        {
          headers: {
            Authorization: `Bearer ${connection.provider_token}`,
          },
        }
      );

      const gmailData = await gmailRes.json();

      if (!gmailRes.ok) {
        console.error("Gmail error:", gmailData);
        continue;
      }

      for (const message of gmailData.messages || []) {
        const { data: existingJob } = await supabase
          .from("jobs")
          .select("id")
          .eq("user_id", connection.user_id)
          .eq("payload->>messageId", message.id)
          .maybeSingle();

        if (existingJob) {
          continue;
        }

        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              Authorization: `Bearer ${connection.provider_token}`,
            },
          }
        );

        const detail = await detailRes.json();

        if (!detailRes.ok) {
          console.error("Gmail detail error:", detail);
          continue;
        }

        const headers = detail.payload?.headers || [];

        const subject =
          headers.find((h: any) =>
            h.name?.toLowerCase() === "subject"
          )?.value || "No Subject";

        const from =
          headers.find((h: any) =>
            h.name?.toLowerCase() === "from"
          )?.value || "Unknown Sender";

        const snippet = detail.snippet || "";

        const { data: rules, error: rulesError } =
          await supabase
            .from("automation_rules")
            .select("*")
            .eq("enabled", true)
            .eq("trigger_type", "new_email")
            .eq("user_id", connection.user_id);

        if (rulesError) {
          console.error("Rules error:", rulesError);
          continue;
        }

        let jobsCreatedForMessage = 0;

        for (const rule of rules || []) {
          const { data: job, error: jobError } =
            await supabase
              .from("jobs")
              .insert({
                user_id: connection.user_id,
                type: rule.action_type,
                status: "pending",
                payload: {
                  triggerType: "new_email",
                  source: "real_gmail_inbox",
                  from,
                  subject,
                  snippet,
                  messageId: message.id,
                  threadId: detail.threadId,
                  ruleId: rule.id,
                  ruleName: rule.name,
                },
              })
              .select()
              .single();

          if (jobError) {
            console.error(
              "Job insert error:",
              jobError
            );
            continue;
          }

          createdJobs.push(job);
          jobsCreatedForMessage += 1;
        }

        if (jobsCreatedForMessage > 0) {
          const markReadRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}/modify`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${connection.provider_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                removeLabelIds: ["UNREAD"],
              }),
            }
          );

          if (!markReadRes.ok) {
            const markReadError =
              await markReadRes.json();

            console.error(
              "Failed to mark email as read:",
              markReadError
            );
          }
        }
      }
    }

    return NextResponse.json({
      checked: true,
      jobsCreated: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err.message ||
          "Real inbox check failed.",
      },
      { status: 500 }
    );
  }
}