import { supabase } from "@/lib/supabase";

export async function loadAssistant(role: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user.");
  }

  const { data, error } = await supabase
    .from("assistants")
    .select("*")
    .eq("user_id", user.id)
    .eq("role", role)
    .eq("enabled", true)
    .single();

  if (error || !data) {
    throw new Error(`Assistant not found for role: ${role}`);
  }

  return data;
}