function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(payload: any): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts?.length) {
    return payload.parts
      .map((part: any) => extractBody(part))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const { providerToken, threadId } = await req.json();

    if (!providerToken || !threadId) {
      return Response.json(
        { error: "Missing provider token or thread ID." },
        { status: 400 }
      );
    }

    const gmailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
      }
    );

    const data = await gmailRes.json();

    if (!gmailRes.ok) {
      return Response.json(
        { error: data.error?.message || "Failed to fetch Gmail thread." },
        { status: 500 }
      );
    }

    const messages = (data.messages || []).map((message: any) => {
      const headers = message.payload?.headers || [];

      return {
        id: message.id,
        from:
          headers.find((header: any) => header.name === "From")?.value ||
          "Unknown sender",
        to:
          headers.find((header: any) => header.name === "To")?.value ||
          "Unknown recipient",
        subject:
          headers.find((header: any) => header.name === "Subject")?.value ||
          "No subject",
        date:
          headers.find((header: any) => header.name === "Date")?.value || "",
        body: extractBody(message.payload),
        snippet: message.snippet,
      };
    });

    return Response.json({
      threadId: data.id,
      messages,
    });
  } catch {
    return Response.json(
      { error: "Gmail thread request failed." },
      { status: 500 }
    );
  }
}