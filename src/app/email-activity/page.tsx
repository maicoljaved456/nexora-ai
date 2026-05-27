"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import {
  MailCheck,
  RefreshCw,
  Send,
  Clock,
  User,
  Hash,
} from "lucide-react";

type EmailActivity = {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  gmail_thread_id: string;
  gmail_message_id: string;
  status: string;
  created_at: string;
};

export default function EmailActivityPage() {
  const [activity, setActivity] = useState<EmailActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadActivity() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No logged-in user found.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("email_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setActivity(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 overflow-x-hidden p-4 pt-20 lg:p-8">
          <Topbar />

          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              NEXORA EMAIL LOGS
            </p>

            <h1 className="mt-3 text-3xl font-bold lg:text-5xl">
              Email Activity
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Review sent AI-assisted replies, delivery status, recipients, and
              Gmail thread references.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                  <MailCheck />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Sent Email Audit Trail
                  </h2>

                  <p className="text-sm text-slate-400">
                    Pulled from Supabase email_activity table.
                  </p>
                </div>
              </div>

              <button
                onClick={loadActivity}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              {activity.length === 0 && !error && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-500">
                  No email activity yet.
                </div>
              )}

              {activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-cyan-400/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${
                            item.status === "sent"
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : "border-red-400/20 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white">
                        {item.subject || "No subject"}
                      </h3>

                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                        <User size={14} />
                        {item.recipient || "No recipient"}
                      </p>
                    </div>

                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={14} />
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-300">
                      <Send size={14} />
                      Email Body
                    </div>

                    <div className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {item.body || "No body saved."}
                    </div>
                  </div>

                  <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <summary className="cursor-pointer text-xs text-slate-500">
                      Gmail Technical References
                    </summary>

                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <Hash size={12} />
                          Gmail Thread ID
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-cyan-300">
                          {item.gmail_thread_id || "Not saved"}
                        </p>
                      </div>

                      <div>
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <Hash size={12} />
                          Gmail Message ID
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-fuchsia-300">
                          {item.gmail_message_id || "Not saved"}
                        </p>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}