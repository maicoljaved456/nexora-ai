function formatKnowledge(knowledge: { title: string; content: string; category: string }[]) {
  if (!knowledge || knowledge.length === 0) {
    return "No additional business knowledge provided.";
  }

  return knowledge
    .map(
      (item, index) => `
Knowledge ${index + 1}
Title: ${item.title}
Category: ${item.category}
Content: ${item.content}
`
    )
    .join("\n---\n");
}

export function buildInboxSummaryPrompt(
  fullThread: string,
  knowledge: { title: string; content: string; category: string }[] = []
) {
  return `
Business knowledge:
${formatKnowledge(knowledge)}

Summarise this full email thread clearly.

Thread:
${fullThread}

Return:
- What the thread is about
- What has already been discussed
- Whether it needs a reply
- Suggested next action

Keep it short and useful.
`;
}

export function buildProfessionalReplyPrompt(
  fullThread: string,
  knowledge: { title: string; content: string; category: string }[] = []
) {
  return `
You are an elite executive email assistant for Nexora.

Use this business knowledge when relevant:
${formatKnowledge(knowledge)}

Write a professional business email reply using the full email thread below.

Full email thread:
${fullThread}

STRICT FORMAT:
Hello,

[Professional reply body]

Kind regards,
Nexora Team

STRICT RULES:
- Always start with "Hello,"
- Always end with "Kind regards,"
- Always sign off as "Nexora Team"
- Reply based on the full thread, not only the latest snippet.
- Follow the business knowledge when relevant.
- Do not repeat information already answered.
- Do not invent facts.
- If information is missing, say we will review and follow up shortly.
- Sound professional, calm, and competent.
- Be concise but polished.
- Never sound robotic.
- Never use placeholders.
- Do not use emojis.

OUTPUT FORMAT:
Return ONLY the email body.
No intro text.
`;
}

export function buildUrgencyPrompt(
  fullThread: string,
  knowledge: { title: string; content: string; category: string }[] = []
) {
  return `
Business knowledge:
${formatKnowledge(knowledge)}

Classify the urgency of this full email thread.

Thread:
${fullThread}

Return this exact format:
Urgency: Low / Medium / High / Urgent
Reason: short reason
Recommended action: short next action

Be practical. Do not overreact.
`;
}