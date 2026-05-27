export async function POST(req: Request) {
  try {
    const { providerToken } = await req.json();

    if (!providerToken) {
      return Response.json(
        { error: "Missing Google provider token." },
        { status: 400 }
      );
    }

    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
      }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      return Response.json(
        {
          error:
            listData.error?.message ||
            "Failed to fetch Gmail message list.",
        },
        { status: 500 }
      );
    }

    const messages = listData.messages || [];

    const detailedMessages = await Promise.all(
      messages.map(async (message: { id: string }) => {
        const messageRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${providerToken}`,
            },
          }
        );

        const messageData = await messageRes.json();

        const headers = messageData.payload?.headers || [];

        const subject =
          headers.find((header: any) => header.name === "Subject")?.value ||
          "No subject";

        const from =
          headers.find((header: any) => header.name === "From")?.value ||
          "Unknown sender";

        const date =
          headers.find((header: any) => header.name === "Date")?.value ||
          "";

        return {
          id: messageData.id,
          threadId: messageData.threadId,
          subject,
          from,
          date,
          snippet: messageData.snippet,
        };
      })
    );

    return Response.json({
      messages: detailedMessages,
    });
  } catch {
    return Response.json(
      { error: "Gmail request failed." },
      { status: 500 }
    );
  }
}