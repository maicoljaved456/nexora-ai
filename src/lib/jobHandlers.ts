import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractEmail(from: string) {
  const match = from?.match(/<(.+?)>/);
  return match ? match[1] : from;
}

export async function handleJob(job: any) {
  switch (job.type) {
    case "generate_email_reply":
      return await handleGenerateEmailReply(job);

    case "test_job":
      return {
        success: true,
        message: "Test job processed successfully.",
      };

    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

async function handleGenerateEmailReply(job: any) {
  const payload = job.payload || {};

  const userId = payload.userId || job.user_id;
  const recipient = payload.recipient || extractEmail(payload.from || "");
  const subject = payload.subject?.startsWith("Re:")
    ? payload.subject
    : `Re: ${payload.subject || "No subject"}`;

  const thread =
    payload.thread ||
    `
From: ${payload.from || "Unknown sender"}
Subject: ${payload.subject || "No subject"}
Snippet: ${payload.snippet || "No preview available."}
`;

  if (!userId) {
    throw new Error("Missing userId for generate_email_reply job.");
  }

  if (!recipient) {
    throw new Error("Missing recipient for generate_email_reply job.");
  }

  const { data: assistant } = await supabaseAdmin
    .from("assistants")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "inbox")
    .eq("enabled", true)
    .maybeSingle();

  const { data: knowledge } = await supabaseAdmin
    .from("knowledge_base")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true)
    .eq("category", "inbox");

  const knowledgeText =
    knowledge && knowledge.length > 0
      ? knowledge
          .map(
            (item: any, index: number) => `
Knowledge ${index + 1}
Title: ${item.title}
Content: ${item.content}
`
          )
          .join("\n---\n")
      : "No additional knowledge.";

  const systemPrompt = `
You are Maicol's senior AI automation consultant for Nexora.

Your job is not to send polite filler. Your job is to move business conversations forward.

You handle inbound enquiries from people interested in automation, AI systems, Gmail workflows, CRM automation, operations automation, lead handling, and business process automation.

You must sound:
- human
- commercially sharp
- calm
- useful
- confident
- concise

You must NOT sound like:
- a generic customer service bot
- a receptionist
- a corporate template
- a lazy autoresponder

CRITICAL RULES:
- Never say "we will review your request".
- Never say "we will get back to you shortly" unless absolutely unavoidable.
- Never reply with only an acknowledgement.
- If the sender is vague, ask intelligent qualifying questions.
- If they ask for automation, ask what process they want automated, what tools they use, and what outcome they want.
- If they sound like a lead, move toward a discovery call or next step.
- Do not invent pricing, timelines, guarantees, or capabilities.
- Keep the email concise.
- Always include a clear next step.

RESPONSE STRATEGY:
1. Acknowledge the enquiry briefly.
2. Identify the likely intent.
3. Ask 3-5 useful qualifying questions.
4. Offer a practical next step.
5. Sign off professionally.

FORMAT:
Hello,

[email body]

Kind regards,
Nexora Team

Return only the email body.
`;

  const userPrompt = `
Business knowledge:
${knowledgeText}

Email thread:
${thread}

Write the best possible reply.

If this is a vague automation enquiry, DO NOT say you will review it.
Instead, ask smart questions that help qualify the opportunity.
`;

  const completion = await openai.chat.completions.create({
    model: assistant?.model || "gpt-4o-mini",
    temperature: assistant?.temperature ?? 0.7,
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

  const draft =
    completion.choices?.[0]?.message?.content || "Could not generate reply.";

  const { error } = await supabaseAdmin.from("email_approvals").insert({
    user_id: userId,
    recipient,
    subject,
    body: draft,
    gmail_thread_id: payload.threadId || "",
    source_message_id: payload.messageId || "",
    status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    generatedDraft: draft,
    approvalCreated: true,
  };
}