"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import {
  Bot,
  RefreshCw,
  Save,
  Power,
  SlidersHorizontal,
  Brain,
} from "lucide-react";

type Assistant = {
  id: number;
  user_id: string;
  name: string;
  role: string;
  system_prompt: string;
  model: string;
  temperature: number;
  enabled: boolean;
  created_at: string;
};

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selected, setSelected] = useState<Assistant | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  async function getCurrentUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id;
  }

  async function loadAssistants() {
    setLoading(true);
    setMessage("");

    const userId = await getCurrentUserId();

    if (!userId) {
      setMessage("No logged-in user found.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("assistants")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setAssistants(data || []);

    if (!selected && data && data.length > 0) {
      setSelected(data[0]);
    }

    setLoading(false);
  }

  async function saveAssistant() {
    if (!selected) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("assistants")
      .update({
        name: selected.name,
        role: selected.role,
        system_prompt: selected.system_prompt,
        model: selected.model,
        temperature: selected.temperature,
        enabled: selected.enabled,
      })
      .eq("id", selected.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Assistant updated successfully.");
      await loadAssistants();
    }

    setSaving(false);
  }

  async function toggleAssistant(assistant: Assistant) {
    const { error } = await supabase
      .from("assistants")
      .update({
        enabled: !assistant.enabled,
      })
      .eq("id", assistant.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setAssistants((current) =>
      current.map((item) =>
        item.id === assistant.id
          ? { ...item, enabled: !assistant.enabled }
          : item
      )
    );

    if (selected?.id === assistant.id) {
      setSelected({
        ...assistant,
        enabled: !assistant.enabled,
      });
    }
  }

  useEffect(() => {
    loadAssistants();
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
              NEXORA AGENTS
            </p>

            <div className="mt-4 flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
                Assistant Registry
              </h1>

              <Brain className="hidden text-cyan-300 lg:block" size={42} />
            </div>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg">
              Manage assistant prompts, roles, models, temperature, and
              availability from one control layer.
            </p>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[380px_1fr]">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                    <Bot size={24} />
                  </div>

                  <div>
                    <h2 className="font-bold text-white">Assistants</h2>
                    <p className="text-sm text-slate-400">
                      Database-backed agents
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadAssistants}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                >
                  <RefreshCw size={17} />
                </button>
              </div>

              <div className="grid gap-3">
                {assistants.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                    No assistants found.
                  </div>
                )}

                {assistants.map((assistant) => {
                  const active = selected?.id === assistant.id;

                  return (
                    <button
                      key={assistant.id}
                      onClick={() => setSelected(assistant)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-cyan-400/40 bg-cyan-500/10"
                          : "border-white/10 bg-black/20 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white">
                            {assistant.name}
                          </h3>

                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {assistant.role}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${
                            assistant.enabled
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : "border-red-400/20 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {assistant.enabled ? "ON" : "OFF"}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                        {assistant.system_prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-fuchsia-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-fuchsia-500/10 backdrop-blur-xl lg:p-8">
              {!selected && (
                <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-white/10 bg-black/20 text-slate-500">
                  Select an assistant to edit.
                </div>
              )}

              {selected && (
                <>
                  <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300">
                        <SlidersHorizontal size={26} />
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Configure Assistant
                        </h2>

                        <p className="text-sm text-slate-400">
                          Changes affect future AI actions.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleAssistant(selected)}
                        className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                          selected.enabled
                            ? "border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        <Power size={16} />
                        {selected.enabled ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={saveAssistant}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50"
                      >
                        <Save size={16} />
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>

                  {message && (
                    <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                      {message}
                    </div>
                  )}

                  <div className="grid gap-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Name
                        </label>

                        <input
                          value={selected.name}
                          onChange={(event) =>
                            setSelected({
                              ...selected,
                              name: event.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Role
                        </label>

                        <input
                          value={selected.role}
                          onChange={(event) =>
                            setSelected({
                              ...selected,
                              role: event.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Model
                        </label>

                        <select
                          value={selected.model}
                          onChange={(event) =>
                            setSelected({
                              ...selected,
                              model: event.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                          <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                          <option value="gpt-4.1">gpt-4.1</option>
                          <option value="gpt-4o-mini">gpt-4o-mini</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Temperature
                        </label>

                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={selected.temperature}
                          onChange={(event) =>
                            setSelected({
                              ...selected,
                              temperature: Number(event.target.value),
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        System Prompt
                      </label>

                      <textarea
                        value={selected.system_prompt}
                        onChange={(event) =>
                          setSelected({
                            ...selected,
                            system_prompt: event.target.value,
                          })
                        }
                        rows={14}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none focus:border-cyan-400/50"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}