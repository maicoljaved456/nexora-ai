"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";

import {
  ShieldCheck,
  RefreshCw,
  Clock3,
  Send,
  XCircle,
  User,
  Mail,
  Search,
} from "lucide-react";

type Approval = {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  gmail_thread_id?: string;
  created_at: string;
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredApprovals = approvals.filter((approval) => {
    const matchesFilter = filter === "all" || approval.status === filter;

    const query = search.toLowerCase().trim();

    const matchesSearch =
      query.length === 0 ||
      approval.subject?.toLowerCase().includes(query) ||
      approval.recipient?.toLowerCase().includes(query) ||
      approval.body?.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  async function getProviderToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.provider_token;
  }

  async function getCurrentUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id;
  }

  async function loadApprovals() {
    setLoading(true);
    setMessage("");

    const userId = await getCurrentUserId();

    if (!userId) {
      setMessage("No authenticated user.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("email_approvals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setApprovals(data || []);
    }

    setLoading(false);
  }

  async function approveAndSend(approval: Approval) {
    const confirmed = window.confirm(
      `Approve and send this email to ${approval.recipient}?`
    );

    if (!confirmed) return;

    setActionLoadingId(approval.id);
    setMessage("");

    const providerToken = await getProviderToken();
    const userId = await getCurrentUserId();

    if (!providerToken) {
      setMessage("No Gmail token found. Sign out and sign back in with Google.");
      setActionLoadingId(null);
      return;
    }

    if (!userId) {
      setMessage("No authenticated user found.");
      setActionLoadingId(null);
      return;
    }

    const res = await fetch("/api/gmail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerToken,
        to: approval.recipient,
        subject: approval.subject,
        body: approval.body,
        threadId: approval.gmail_thread_id || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to send email.");
      setActionLoadingId(null);
      return;
    }

    const { error: approvalError } = await supabase
      .from("email_approvals")
      .update({
        status: "sent",
        approved_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })
      .eq("id", approval.id);

    if (approvalError) {
      setMessage(approvalError.message);
      setActionLoadingId(null);
      return;
    }

    await supabase.from("email_activity").insert({
      user_id: userId,
      recipient: approval.recipient,
      subject: approval.subject,
      body: approval.body,
      gmail_thread_id: data.threadId || approval.gmail_thread_id || "",
      gmail_message_id: data.messageId || "",
      status: "sent",
    });

    setMessage("Email approved and sent.");
    await loadApprovals();
    setActionLoadingId(null);
  }

  async function rejectDraft(approval: Approval) {
    const confirmed = window.confirm("Reject this draft?");
    if (!confirmed) return;

    setActionLoadingId(approval.id);
    setMessage("");

    const { error } = await supabase
      .from("email_approvals")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
      })
      .eq("id", approval.id);

    if (error) {
      setMessage(error.message);
      setActionLoadingId(null);
      return;
    }

    setMessage("Approval rejected.");
    await loadApprovals();
    setActionLoadingId(null);
  }

  useEffect(() => {
    loadApprovals();
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
              NEXORA APPROVALS
            </p>

            <div className="mt-4 flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
                Approval Queue
              </h1>

              <ShieldCheck
                className="hidden text-cyan-300 lg:block"
                size={42}
              />
            </div>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg">
              Review AI-generated email drafts before anything is sent.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl lg:p-8">
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Email Draft Approvals
                </h2>

                <p className="mt-1 text-slate-400">
                  Pending, sent, and rejected AI-generated drafts.
                </p>
              </div>

              <button
                onClick={loadApprovals}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <RefreshCw size={18} />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <Search size={18} className="text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by subject, recipient, or body..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {["all", "pending", "sent", "rejected"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                      filter === item
                        ? "border-cyan-400/30 bg-cyan-500/20 text-cyan-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {message && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                {message}
              </div>
            )}

            <div className="grid gap-5">
              {filteredApprovals.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-slate-500">
                  No approvals found for this search or filter.
                </div>
              )}

              {filteredApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded-[2rem] border border-white/10 bg-black/20 p-6 transition hover:border-cyan-400/30"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                            approval.status === "sent"
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : approval.status === "rejected"
                              ? "border-red-400/20 bg-red-500/10 text-red-300"
                              : "border-amber-400/20 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {approval.status}
                        </span>

                        <span className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock3 size={14} />
                          {new Date(approval.created_at).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-white">
                        {approval.subject}
                      </h3>

                      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <User size={15} />
                          Nexora AI
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail size={15} />
                          {approval.recipient}
                        </div>
                      </div>
                    </div>

                    {approval.status === "pending" && (
                      <div className="flex min-w-[260px] flex-col gap-3 sm:flex-row lg:flex-col">
                        <button
                          onClick={() => approveAndSend(approval)}
                          disabled={actionLoadingId === approval.id}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <Send size={16} />
                          {actionLoadingId === approval.id
                            ? "Sending..."
                            : "Approve & Send"}
                        </button>

                        <button
                          onClick={() => rejectDraft(approval)}
                          disabled={actionLoadingId === approval.id}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-wide text-cyan-300">
                      Draft Body
                    </p>

                    <div className="whitespace-pre-wrap text-sm leading-8 text-slate-200">
                      {approval.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}