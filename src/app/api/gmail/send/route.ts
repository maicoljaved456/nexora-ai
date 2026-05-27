function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(req: Request) {
  try {
    const { providerToken, to, subject, body, threadId } = await req.json();

    if (!providerToken || !to || !subject || !body) {
      return Response.json(
        { error: "Missing provider token, recipient, subject, or body." },
        { status: 400 }
      );
    }

    const rawEmail = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\n");

    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${providerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: base64UrlEncode(rawEmail),
          threadId,
        }),
      }
    );

    const data = await gmailRes.json();

    if (!gmailRes.ok) {
      return Response.json(
        { error: data.error?.message || "Failed to send email." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      messageId: data.id,
      threadId: data.threadId,
    });
  } catch {
    return Response.json(
      { error: "Gmail send request failed." },
      { status: 500 }
    );
  }
}