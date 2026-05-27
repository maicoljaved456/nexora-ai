import { supabase } from "@/lib/supabase";
import { createJob } from "@/lib/createJob";

type AutomationEvent = {
  triggerType: string;
  payload: Record<string, unknown>;
};

export async function processAutomationRules(event: AutomationEvent) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user.");
  }

  const { data: rules, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", user.id)
    .eq("trigger_type", event.triggerType)
    .eq("enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  if (!rules || rules.length === 0) {
    return {
      created: 0,
      message: "No matching automation rules.",
    };
  }

  const createdJobs = [];

  for (const rule of rules) {
    const job = await createJob(rule.action_type, {
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: event.triggerType,
      ...event.payload,
    });

    createdJobs.push(job);
  }

  return {
    created: createdJobs.length,
    jobs: createdJobs,
  };
}