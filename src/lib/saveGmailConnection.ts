import { supabase } from "@/lib/supabase";

export async function saveGmailConnection() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!session?.provider_token || !user) {
    console.log("No Gmail provider token or user found.");
    return;
  }

  const { error } = await supabase.from("gmail_connections").upsert(
    {
      user_id: user.id,
      provider_token: session.provider_token,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Failed to save Gmail connection:", error.message);
  } else {
    console.log("Gmail connection saved.");
  }
}