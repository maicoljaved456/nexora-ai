import { supabase } from "@/lib/supabase";

export async function createJob(type: string, payload: Record<string, unknown>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user.");
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      type,
      payload,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}