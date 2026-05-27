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
      const subject =
        job.payload?.subject || "";

      const message =
        job.payload?.snippet || "";

      const systemPrompt = `
You are an elite AI executive assistant.

Your job is to:
- understand the sender intent
- move conversations forward
- ask intelligent qualifying questions
- sound human and professional
- avoid generic robotic replies
- avoid saying "we will review your request"
- avoid sounding like customer support templates

RULES:
- If enquiry is vague, ask smart follow-up questions.
- If sales-related, qualify the lead.
- If support-related, gather troubleshooting details.
- Keep responses concise but valuable.
- Sound like a competent founder/operator.
- Never hallucinate fake capabilities.
- Never overpromise.
- Write naturally.

Return only the email body.
`;

      const userPrompt = `
SUBJECT:
${subject}

EMAIL:
${message}
`;

      const completion =
        await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
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