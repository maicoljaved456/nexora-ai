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

function extractEmail(from: string) {
  const match = from?.match(/<(.+?)>/);
  return match ? match[1] : from;
}

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
      const payload = job.payload || {};

      const subject = payload.subject || "";
      const message = payload.snippet || "";
      const from = payload.from || "";
      const recipient = payload.recipient || extractEmail(from);

      const replySubject = subject.startsWith("Re:")
        ? subject
        : `Re: ${subject || "No subject"}`;

      const systemPrompt = `
You are Maicol's senior AI automation consultant for Nexora.

Your job is to move business conversations forward intelligently.

You must:
- sound human
- sound commercially aware
- ask smart follow-up questions
- qualify vague leads
- avoid robotic replies
- avoid generic support language

Never say:
- "we will review your request"
- "we will get back to you shortly"

If the sender is vague:
- ask useful qualifying questions
- understand business/process
- understand tools/workflows
- understand desired outcome

Keep replies:
- concise
- intelligent
- proactive
- natural

FORMAT:

Hello,

[email body]

Kind regards,
Nexora Team

Return ONLY the email body.
`;

      const userPrompt = `
SUBJECT:
${subject}

EMAIL:
${message}

Write the best possible business reply.

If the enquiry is vague, ask strategic follow-up questions instead of sending a generic acknowledgement.
`;

      const completion = await openai.chat.completions.create({
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
        completion.choices?.[0]?.message?.content ||
        "Could not generate reply.";

      const { error: approvalError } = await supabase
        .from("email_approvals")
        .insert({
          user_id: job.user_id,
          recipient,
          subject: replySubject,
          body: generatedReply,
          gmail_thread_id: payload.threadId || "",
          source_message_id: payload.messageId || "",
          status: "pending",
        });

      if (approvalError) {
        await supabase
          .from("jobs")
          .update({
            status: "failed",
            error: approvalError.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        continue;
      }

      await supabase
        .from("jobs")
        .update({
          status: "completed",
          result: {
            approvalCreated: true,
            generatedReply,
          },
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