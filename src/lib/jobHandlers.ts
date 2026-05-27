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
    .single();

  const assistantPrompt =
    assistant?.system_prompt ||
    "You are a professional executive email assistant for Nexora.";

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

  const completion = await openai.chat.completions.create({
    model: assistant?.model || "gpt-4.1-mini",
    temperature: assistant?.temperature ?? 0.4,
    messages: [
      {
        role: "system",
        content: assistantPrompt,
      },
      {
        role: "user",
        content: `
Business knowledge:
${knowledgeText}

Email thread:
${thread}

Write a professional business email reply.

STRICT FORMAT:
Hello,

[reply]

Kind regards,
Nexora Team

Rules:
- Do not invent facts.
- Keep it concise.
- If information is missing, say we will review and follow up shortly.
`,
      },
    ],
  });

  const draft =
    completion.choices?.[0]?.message?.content ||
    "Could not generate reply.";

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