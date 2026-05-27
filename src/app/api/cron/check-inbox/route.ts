import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: rules, error } = await supabaseAdmin
      .from("automation_rules")
      .select("*")
      .eq("enabled", true)
      .eq("trigger_type", "new_email");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!rules || rules.length === 0) {
      return Response.json({
        checked: true,
        jobsCreated: 0,
        message: "No active inbox automation rules.",
      });
    }

    const createdJobs = [];

    for (const rule of rules) {
      const fakeInboxEvent = {
        from: "Demo Company <democompany9987@gmail.com>",
        subject: "Automated Inbox Trigger",
        snippet:
          "This is a simulated inbox event triggered by cron automation.",
        threadId: "",
        messageId: "",
      };

      const { data: job, error: jobError } = await supabaseAdmin
        .from("jobs")
        .insert({
          user_id: rule.user_id,
          type: rule.action_type,
          payload: {
            ...fakeInboxEvent,
            triggerType: "new_email",
            ruleId: rule.id,
            ruleName: rule.name,
          },
          status: "pending",
        })
        .select()
        .single();

      if (jobError) {
        console.error(jobError);
        continue;
      }

      createdJobs.push(job);
    }

    return Response.json({
      checked: true,
      jobsCreated: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Inbox cron check failed.",
      },
      { status: 500 }
    );
  }
}