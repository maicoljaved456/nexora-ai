import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "pending")
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    for (const job of jobs || []) {
      const prompt = `
Write a professional email reply.

Subject:
${job.payload?.subject}

Message:
${job.payload?.snippet}
`;

      const completion =
        await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

      const generatedReply =
        completion.choices[0].message.content;

      await supabase
        .from("approvals")
        .insert({
          job_id: job.id,
          status: "pending",
          generated_reply: generatedReply,
        });

      await supabase
        .from("jobs")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    return NextResponse.json({
      processed: jobs?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}