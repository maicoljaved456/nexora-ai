import { createClient } from "@supabase/supabase-js";
import { handleJob } from "@/lib/jobHandlers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return Response.json({
        processed: 0,
        message: "No pending jobs.",
      });
    }

    const results = [];

    for (const job of jobs) {
      try {
        await supabaseAdmin
          .from("jobs")
          .update({
            status: "processing",
          })
          .eq("id", job.id);

        const result = await handleJob(job);

        await supabaseAdmin
          .from("jobs")
          .update({
            status: "completed",
            result,
            processed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        results.push({
          id: job.id,
          status: "completed",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown processing error.";

        await supabaseAdmin
          .from("jobs")
          .update({
            status: "failed",
            error: errorMessage,
            retries: (job.retries || 0) + 1,
            processed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        results.push({
          id: job.id,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    return Response.json({
      processed: results.length,
      results,
    });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Job processor failed.",
      },
      { status: 500 }
    );
  }
}