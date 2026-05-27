"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import { loadAssistant } from "@/lib/loadAssistant";
import { loadKnowledge } from "@/lib/loadKnowledge";
import { processAutomationRules } from "@/lib/processAutomationRules";

import {
  buildInboxSummaryPrompt,
  buildProfessionalReplyPrompt,
  buildUrgencyPrompt,
} from "@/lib/prompts";

import {
  Mail,
  RefreshCw,
  User,
  CalendarDays,
  Sparkles,
  Copy,
  AlertTriangle,
  Send,
  Inbox,
  Zap,
  ShieldCheck,
  PenLine,
} from "lucide-react";

type GmailMessage = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};

type ThreadMessage = {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  snippet: string;
};

export default function InboxPage() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [urgencies, setUrgencies] = useState<Record<string, string>>({});
  const [recipients, setRecipients] = useState<Record<string, string>>({});
  const [approvalStatus, setApprovalStatus] = useState<Record<string, string>>(
    {}
  );
  const [automationMessage, setAutomationMessage] = useState("");
  const [error, setError] = useState("");

  function extractEmail(from: string) {
    const match = from.match(/<(.+?)>/);
    return match ? match[1] : from;
  }

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

  async function loadMessages() {
    setLoading(true);
    setError("");
    setAutomationMessage("");

    const providerToken = await getProviderToken();

    if (!providerToken) {
      setError(
        "No Google provider token found. Sign out and sign back in with Google."
      );
      setLoading(false);
      return;
    }

    const res = await fetch("/api/gmail/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to load Gmail messages.");
      setLoading(false);
      return;
    }

    const loadedMessages = data.messages || [];
    setMessages(loadedMessages);

    const initialRecipients: Record<string, string> = {};

    loadedMessages.forEach((message: GmailMessage) => {
      initialRecipients[message.id] = extractEmail(message.from);
    });

    setRecipients(initialRecipients);

    try {
      if (loadedMessages.length > 0) {
        const latestMessage = loadedMessages[0];

        const automationResult = await processAutomationRules({
          triggerType: "new_email",
          payload: {
            source: "inbox_load",
            messageId: latestMessage.id,
            threadId: latestMessage.threadId,
            subject: latestMessage.subject,
            from: latestMessage.from,
            snippet: latestMessage.snippet,
          },
        });

        setAutomationMessage(
          `Automation checked: ${automationResult.created} job(s) created.`
        );
      }
    } catch (err) {
      setAutomationMessage(
        err instanceof Error
          ? `Automation error: ${err.message}`
          : "Automation error."
      );
    }

    setLoading(false);
  }

  async function loadThread(message: GmailMessage) {
    const providerToken = await getProviderToken();

    if (!providerToken) {
      throw new Error("No Google provider token found.");
    }

    const res = await fetch("/api/gmail/thread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerToken,
        threadId: message.threadId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to load Gmail thread.");
    }

    return data.messages as ThreadMessage[];
  }

  function formatThreadForAI(threadMessages: ThreadMessage[]) {
    return threadMessages
      .map(
        (item, index) => `
Message ${index + 1}
From: ${item.from}
To: ${item.to}
Date: ${item.date}
Subject: ${item.subject}

${item.body || item.snippet || "No body available."}
`
      )
      .join("\n---\n");
  }

  async function summariseMessage(message: GmailMessage) {
    setAiLoadingId(message.id);

    try {
      const threadMessages = await loadThread(message);
      const fullThread = formatThreadForAI(threadMessages);
      const assistant = await loadAssistant("inbox");
      const knowledge = await loadKnowledge("inbox");

      const res = await fetch("/api/assistant-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantName: assistant.name,
          assistantType: assistant.role,
          task: buildInboxSummaryPrompt(fullThread, knowledge),
        }),
      });

      const data = await res.json();

      setSummaries((current) => ({
        ...current,
        [message.id]:
          data.output || data.error || "Could not summarise message.",
      }));
    } catch (err) {
      setSummaries((current) => ({
        ...current,
        [message.id]:
          err instanceof Error ? err.message : "Could not summarise message.",
      }));
    }

    setAiLoadingId(null);
  }

  async function draftReply(message: GmailMessage) {
    setAiLoadingId(message.id);

    try {
      const threadMessages = await loadThread(message);
      const fullThread = formatThreadForAI(threadMessages);
      const assistant = await loadAssistant("inbox");
      const knowledge = await loadKnowledge("inbox");

      const res = await fetch("/api/assistant-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantName: assistant.name,
          assistantType: assistant.role,
          task: buildProfessionalReplyPrompt(fullThread, knowledge),
        }),
      });

      const data = await res.json();

      setDrafts((current) => ({
        ...current,
        [message.id]:
          data.output || data.error || "Could not draft reply.",
      }));
    } catch (err) {
      setDrafts((current) => ({
        ...current,
        [message.id]:
          err instanceof Error ? err.message : "Could not draft reply.",
      }));
    }

    setAiLoadingId(null);
  }

  async function flagUrgency(message: GmailMessage) {
    setAiLoadingId(message.id);

    try {
      const threadMessages = await loadThread(message);
      const fullThread = formatThreadForAI(threadMessages);
      const assistant = await loadAssistant("inbox");
      const knowledge = await loadKnowledge("inbox");

      const res = await fetch("/api/assistant-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantName: assistant.name,
          assistantType: assistant.role,
          task: buildUrgencyPrompt(fullThread, knowledge),
        }),
      });

      const data = await res.json();

      setUrgencies((current) => ({
        ...current,
        [message.id]:
          data.output || data.error || "Could not classify urgency.",
      }));
    } catch (err) {
      setUrgencies((current) => ({
        ...current,
        [message.id]:
          err instanceof Error ? err.message : "Could not classify urgency.",
      }));
    }

    setAiLoadingId(null);
  }

  async function sendForApproval(message: GmailMessage) {
    const userId = await getCurrentUserId();
    const draft = drafts[message.id];
    const recipient = recipients[message.id];
    const subject = `Re: ${message.subject}`;

    if (!userId || !draft || !recipient) {
      setApprovalStatus((current) => ({
        ...current,
        [message.id]:
          "Missing user, recipient, or draft. Approval was not created.",
      }));
      return;
    }

    setAiLoadingId(message.id);

    const { error } = await supabase.from("email_approvals").insert({
      user_id: userId,
      recipient,
      subject,
      body: draft,
      gmail_thread_id: message.threadId,
      source_message_id: message.id,
      status: "pending",
    });

    setApprovalStatus((current) => ({
      ...current,
      [message.id]: error
        ? error.message
        : `Draft sent for approval for ${recipient}.`,
    }));

    setAiLoadingId(null);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="flex-1 overflow-x-hidden px-4 py-6 lg:px-10">
          <Topbar />

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-cyan-300">
              NEXORA INBOX
            </p>

            <div className="mt-4 flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
                Inbox Assistant
              </h1>

              <Sparkles className="hidden text-cyan-300 lg:block" size={42} />
            </div>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg">
              Read Gmail threads, detect priorities, draft context-aware
              replies, and trigger automation rules.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
                  <Mail size={32} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Gmail Threads
                  </h2>

                  <p className="mt-1 text-slate-400">
                    Recent messages from your connected Gmail inbox.
                  </p>
                </div>
              </div>

              <button
                onClick={loadMessages}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/20 transition hover:scale-[1.01] hover:opacity-95 disabled:opacity-50 lg:w-auto"
              >
                <RefreshCw size={19} />
                {loading ? "Loading..." : "Load Gmail Messages"}
              </button>
            </div>

            {automationMessage && (
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                {automationMessage}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mt-8 grid gap-5">
              {messages.length === 0 && !error && (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
                  <Inbox className="text-slate-600" size={44} />

                  <p className="mt-4 text-lg font-medium text-slate-300">
                    No messages loaded yet.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Click “Load Gmail Messages” to get started.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/20 transition hover:border-cyan-400/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {message.subject || "No subject"}
                      </h3>

                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                        <User size={14} />
                        {message.from || "Unknown sender"}
                      </p>
                    </div>

                    <p className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500">
                      <CalendarDays size={14} />
                      {message.date || "No date"}
                    </p>
                  </div>

                  <p className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-slate-300">
                    {message.snippet || "No preview available."}
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <button
                      onClick={() => summariseMessage(message)}
                      disabled={aiLoadingId === message.id}
                      className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-4 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
                    >
                      {aiLoadingId === message.id
                        ? "Working..."
                        : "Summarise Thread"}
                    </button>

                    <button
                      onClick={() => draftReply(message)}
                      disabled={aiLoadingId === message.id}
                      className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-4 text-sm font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
                    >
                      {aiLoadingId === message.id
                        ? "Working..."
                        : "Draft Thread Reply"}
                    </button>

                    <button
                      onClick={() => flagUrgency(message)}
                      disabled={aiLoadingId === message.id}
                      className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm font-bold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      {aiLoadingId === message.id
                        ? "Working..."
                        : "Flag Urgency"}
                    </button>
                  </div>

                  {summaries[message.id] && (
                    <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
                        <Sparkles size={14} />
                        AI Thread Summary
                      </div>

                      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                        {summaries[message.id]}
                      </div>
                    </div>
                  )}

                  {urgencies[message.id] && (
                    <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-300">
                        <AlertTriangle size={14} />
                        Urgency Classification
                      </div>

                      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                        {urgencies[message.id]}
                      </div>
                    </div>
                  )}

                  {drafts[message.id] && (
                    <div className="mt-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-fuchsia-300">
                          <Sparkles size={14} />
                          Draft Thread Reply
                        </div>

                        <button
                          onClick={() => copyText(drafts[message.id])}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                        >
                          <Copy size={13} />
                          Copy
                        </button>
                      </div>

                      <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
                        {drafts[message.id]}
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Recipient
                        </label>

                        <input
                          value={recipients[message.id] || ""}
                          onChange={(event) =>
                            setRecipients((current) => ({
                              ...current,
                              [message.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                        />
                      </div>

                      <button
                        onClick={() => sendForApproval(message)}
                        disabled={aiLoadingId === message.id}
                        className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {aiLoadingId === message.id
                          ? "Sending for approval..."
                          : "Send for Approval"}
                      </button>
                    </div>
                  )}

                  {approvalStatus[message.id] && (
                    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300">
                      {approvalStatus[message.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                <Zap size={28} />
              </div>

              <h3 className="text-xl font-bold text-white">AI Summaries</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Get clear summaries of long email threads in seconds.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300">
                <PenLine size={28} />
              </div>

              <h3 className="text-xl font-bold text-white">Smart Drafts</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Drafts are routed to approvals before sending.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur-xl">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                <ShieldCheck size={28} />
              </div>

              <h3 className="text-xl font-bold text-white">Human Approval</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Nothing is sent until a user reviews and approves it.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}