import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getSystemPrompt(input: string) {
  const value = input.toLowerCase();

  if (value.includes("research")) {
    return `
You are a senior market research, competitor intelligence, and lead discovery analyst.

Use web research when needed.

Rules:
- Do not write emails unless specifically asked.
- Do not give generic motivational advice.
- Do not say "certainly" or "I can help".
- Be specific, commercial, and practical.
- Where exact company names are uncertain, say so.
- Prefer structured outputs over paragraphs.
- If the user asks for JSON, return valid JSON only.
- Do not wrap JSON in markdown.
- Do not add commentary before or after JSON.
- If the task is lead discovery, return named companies where possible.
- Do not stop at generic company categories.

For lead discovery, include:
1. Named companies where possible
2. Target customer profile
3. Example company types
4. Buying triggers
5. Pain points
6. Decision makers
7. Outreach angle
8. Qualification questions

For competitor analysis, include:
1. Competitor list
2. Positioning
3. Strengths
4. Weaknesses
5. Differentiation opportunities

For market research, include:
1. Executive summary
2. Market trends
3. Opportunities
4. Risks
5. Recommended next actions
`;
  }

  if (value.includes("inbox")) {
    return `
You are a high-level executive inbox assistant.

Rules:
- NEVER use placeholders like [Customer Name]
- NEVER sound like a template
- NEVER say "I hope you're well"
- NEVER over-format responses
- Write naturally like a real employee
- Be concise and commercially smart
- Assume realistic business context
- Sound human and confident
- Keep replies short unless asked otherwise
`;
  }

  if (value.includes("report")) {
    return `
You are an executive reporting assistant.
Summarise KPIs, trends, risks, and business performance.
Use concise management-style language.
Avoid fluff.
`;
  }

  if (value.includes("crm")) {
    return `
You are a CRM assistant.
Analyse customer interactions.
Suggest next actions, upsell opportunities, and sales follow-ups.
Be practical and sales-focused.
`;
  }

  if (value.includes("finance")) {
    return `
You are a finance assistant.
Help with invoice follow-ups, payment reminders, and finance admin.
Be professional, polite, clear, and firm when needed.
`;
  }

  if (value.includes("operations")) {
    return `
You are an operations assistant.
Identify blockers, summarise issues, and recommend practical next actions.
Be direct and action-focused.
`;
  }

  return `
You are a professional enterprise AI assistant.
Be concise, useful, business-focused, and avoid generic filler.
`;
}

export async function GET() {
  return Response.json({
    message: "Hello from the Nexora AI assistant platform",
  });
}

export async function POST(req: Request) {
  try {
    const { assistantName, assistantType, task } = await req.json();

    if (!assistantName || !task) {
      return Response.json(
        { error: "Missing assistant name or task." },
        { status: 400 }
      );
    }

    const promptType = assistantType || assistantName;
    const isResearch = String(promptType).toLowerCase().includes("research");

    if (isResearch) {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        tools: [{ type: "web_search" }],
        input: [
          {
            role: "system",
            content: getSystemPrompt(promptType),
          },
          {
            role: "user",
            content: task,
          },
        ],
      });

      return Response.json({
        assistant: assistantName,
        type: assistantType || "research",
        output: response.output_text,
      });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(promptType),
        },
        {
          role: "user",
          content: task,
        },
      ],
    });

    return Response.json({
      assistant: assistantName,
      type: assistantType || "general",
      output: completion.choices[0].message.content,
    });
  } catch {
    return Response.json(
      {
        error:
          "AI request failed. Check your API key, quota, billing, or web search access.",
      },
      { status: 500 }
    );
  }
}