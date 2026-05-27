"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import { GitBranch, Plus, RefreshCw, Save } from "lucide-react";

type AutomationRule = {
  id: number;
  name: string;
  trigger_type: string;
  action_type: string;
  conditions: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
};

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("Auto-draft new inbox emails");
  const [triggerType, setTriggerType] = useState("new_email");
  const [actionType, setActionType] = useState("generate_email_reply");

  async function getUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id;
  }

  async function loadRules() {
    setLoading(true);
    setMessage("");

    const userId = await getUserId();

    if (!userId) {
      setMessage("No logged-in user found.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setRules(data || []);
    }

    setLoading(false);
  }

  async function createRule() {
    const userId = await getUserId();

    if (!userId || !name || !triggerType || !actionType) {
      setMessage("Name, trigger, and action are required.");
      return;
    }

    const { error } = await supabase.from("automation_rules").insert({
      user_id: userId,
      name,
      trigger_type: triggerType,
      action_type: actionType,
      conditions: {},
      enabled: true,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Automation rule created.");
    await loadRules();
  }

  async function toggleRule(rule: AutomationRule) {
    const { error } = await supabase
      .from("automation_rules")
      .update({ enabled: !rule.enabled })
      .eq("id", rule.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadRules();
  }

  useEffect(() => {
    loadRules();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="flex-1 overflow-x-hidden px-4 py-6 lg:px-10">
          <Topbar />

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-cyan-300">
              NEXORA AUTOMATION
            </p>

            <div className="mt-4 flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
                Automation Rules
              </h1>

              <GitBranch className="hidden text-cyan-300 lg:block" size={42} />
            </div>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg">
              Define trigger-action rules that create background jobs for your
              AI workflows.
            </p>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[420px_1fr]">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                  <Plus size={28} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">
                    Create Rule
                  </h2>

                  <p className="text-sm text-slate-400">
                    Link triggers to queued actions.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                />

                <select
                  value={triggerType}
                  onChange={(event) => setTriggerType(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="new_email">New Email</option>
                  <option value="manual">Manual</option>
                  <option value="scheduled">Scheduled</option>
                </select>

                <select
                  value={actionType}
                  onChange={(event) => setActionType(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="generate_email_reply">
                    Generate Email Reply
                  </option>
                  <option value="analyse_inbox">Analyse Inbox</option>
                  <option value="create_follow_up">Create Follow-up</option>
                </select>

                <button
                  onClick={createRule}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                >
                  <Save size={16} />
                  Save Rule
                </button>
              </div>

              {message && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  {message}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-fuchsia-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-fuchsia-500/10 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Active Rules
                  </h2>

                  <p className="text-sm text-slate-400">
                    Rules ready to trigger job creation.
                  </p>
                </div>

                <button
                  onClick={loadRules}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                >
                  <RefreshCw size={17} />
                </button>
              </div>

              <div className="grid gap-4">
                {rules.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-500">
                    No automation rules yet.
                  </div>
                )}

                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {rule.name}
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          When{" "}
                          <span className="text-cyan-300">
                            {rule.trigger_type}
                          </span>{" "}
                          then{" "}
                          <span className="text-fuchsia-300">
                            {rule.action_type}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => toggleRule(rule)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                          rule.enabled
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                            : "border-red-400/20 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                      Created: {new Date(rule.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}