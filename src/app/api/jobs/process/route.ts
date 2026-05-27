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
You are Maicol's elite AI automation consultant.

Your role is to:
- handle inbound business enquiries
- qualify leads intelligently
- move conversations forward
- ask strategic follow-up questions
- sound commercially sharp
- sound human, concise, and competent

You are NOT:
- a generic support bot
- a passive receptionist
- a robotic autoresponder

CORE BEHAVIOR:

1. If the enquiry is vague:
Ask smart qualifying questions.

2. If someone wants automation:
Understand:
- their business
- current workflows
- pain points
- tools/platforms
- desired outcome

3. If the message sounds high intent:
Guide toward next steps.

4. Avoid weak phrases like:
- "we will review"
- "thank you for your enquiry"
- "we will get back to you shortly"

5. Sound like:
- founder/operator energy
- commercially aware
- proactive
- concise
- experienced

STYLE:
- natural
- direct
- modern
- conversational
- helpful without sounding needy

GOOD RESPONSE EXAMPLE:

"Happy to help.

Could you share a bit more about:
- what type of business/process you're looking to automate
- what tools you're currently using
- where the biggest bottlenecks are right now

That'll help me point you toward the best setup."

BAD RESPONSE EXAMPLE:

"Thank you for your enquiry. We will review your request and revert back shortly."

Never sound like the bad example.

Return ONLY the email body.
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