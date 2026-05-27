"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import { Brain, Plus, RefreshCw, Save } from "lucide-react";

type KnowledgeItem = {
  id: number;
  title: string;
  content: string;
  category: string;
  enabled: boolean;
  created_at: string;
};

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");

  async function getUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id;
  }

  async function loadKnowledge() {
    setLoading(true);
    setMessage("");

    const userId = await getUserId();

    if (!userId) {
      setMessage("No logged-in user found.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  async function addKnowledge() {
    const userId = await getUserId();

    if (!userId || !title || !content) {
      setMessage("Title and content are required.");
      return;
    }

    const { error } = await supabase.from("knowledge_base").insert({
      user_id: userId,
      title,
      category,
      content,
      enabled: true,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setCategory("general");
    setContent("");
    setMessage("Knowledge saved.");
    await loadKnowledge();
  }

  async function toggleItem(item: KnowledgeItem) {
    const { error } = await supabase
      .from("knowledge_base")
      .update({ enabled: !item.enabled })
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadKnowledge();
  }

  useEffect(() => {
    loadKnowledge();
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
              NEXORA MEMORY
            </p>

            <div className="mt-4 flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
                Knowledge Base
              </h1>

              <Brain className="hidden text-cyan-300 lg:block" size={42} />
            </div>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg">
              Store business rules, company context, tone preferences, and
              operational instructions for your AI assistants.
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
                    Add Knowledge
                  </h2>

                  <p className="text-sm text-slate-400">
                    Add rules your AI should remember.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Reply tone"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                />

                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="general, inbox, sales, support..."
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                />

                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={8}
                  placeholder="Example: Always use British English. Never promise delivery dates without approval."
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                />

                <button
                  onClick={addKnowledge}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                >
                  <Save size={16} />
                  Save Knowledge
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
                    Saved Knowledge
                  </h2>

                  <p className="text-sm text-slate-400">
                    Active memory available to assistants.
                  </p>
                </div>

                <button
                  onClick={loadKnowledge}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-300 hover:bg-white/10 disabled:opacity-50"
                >
                  <RefreshCw size={17} />
                </button>
              </div>

              <div className="grid gap-4">
                {items.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-500">
                    No knowledge saved yet.
                  </div>
                )}

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                          {item.category}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleItem(item)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                          item.enabled
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                            : "border-red-400/20 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {item.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {item.content}
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