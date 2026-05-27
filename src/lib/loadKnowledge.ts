import { supabase } from "@/lib/supabase";

export async function loadKnowledge(category?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user.");
  }

  let query = supabase
    .from("knowledge_base")
    .select("*")
    .eq("user_id", user.id)
    .eq("enabled", true);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}