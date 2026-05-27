"use client";

import { useEffect, useState } from "react";
import { Bot, Clock, Sparkles } from "lucide-react";

type Assistant = {
  id: number;
  name: string;
  role: string;
  type?: string;
  status: string;
};

type AssistantCardsProps = {
  assistants: Assistant[];
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onActivityUpdate?: (message: string) => void;
};

function getQuickActions(type?: string) {
  const value = String(type || "").toLowerCase();

  if (value.includes("inbox")) {
    return [
      "Draft Reply",
      "Summarise Email",
      "Flag Urgency",
    ];
  }

  if (value.includes("report")) {
    return [
      "Create Report",
      "Find Risks",
      "Suggest Actions",
    ];
  }

  if (value.includes("crm")) {
    return [
      "Suggest Follow-Up",
      "Summarise Deal",
      "Find Upsell",
    ];
  }

  if (value.includes("finance")) {
    return [
      "Draft Reminder",
      "Summarise Invoice",
      "Find Payment Risk",
    ];
  }

  return [
    "Summarise",
    "Find Risks",
    "Suggest Actions",
  ];
}

function buildTask(action: string, assistant: Assistant) {
  const type = String(assistant.type || "").toLowerCase();

  if (type.includes("inbox")) {
    if (action === "Draft Reply") {
      return "Customer says: 'Hi, just checking if there is any update on my order?' Write a short, natural reply confirming we are checking with operations and will send tracking once available. No placeholders.";
    }

    if (action === "Summarise Email") {
      return "Summarise this customer email in 3 bullet points: 'Hi, I placed an order last week and still haven't received tracking. Can someone confirm what is happening?'";
    }

    return "Decide if this email is urgent and explain why: 'We still have no update and this is affecting our launch timeline tomorrow.'";
  }

  if (type.includes("report")) {
    if (action === "Create Report") {
      return "Create a concise management update: revenue is up 12%, inbound leads dropped 8%, support tickets increased 15%, and two deals are stuck in negotiation. Give insights and next actions.";
    }

    if (action === "Find Risks") {
      return "Analyse these business signals and identify the top risks: revenue up 12%, inbound leads down 8%, support tickets up 15%, two deals delayed.";
    }

    return "Recommend 5 practical next actions based on: revenue up, leads down, support tickets rising, and deals delayed.";
  }

  if (type.includes("crm")) {
    if (action === "Suggest Follow-Up") {
      return "Customer opened the proposal twice but has not replied for 5 days. Summarise the situation and suggest the next commercial follow-up action.";
    }

    if (action === "Summarise Deal") {
      return "Summarise this deal status: prospect requested pricing, opened proposal twice, asked about implementation timeline, then went quiet for 5 days.";
    }

    return "Identify upsell opportunities from this account: customer uses basic automation, has growing support volume, and recently asked about reporting.";
  }

  if (type.includes("finance")) {
    if (action === "Draft Reminder") {
      return "Invoice INV-1042 is 7 days overdue. Draft a firm but polite payment follow-up without sounding aggressive.";
    }

    if (action === "Summarise Invoice") {
      return "Summarise invoice status: INV-1042 for £2,400, sent 21 days ago, due 7 days ago, no response after first reminder.";
    }

    return "Assess payment risk for invoice INV-1042: 7 days overdue, no reply to reminder, customer has paid late twice before.";
  }

  return "Summarise the key issue, identify risks, and recommend next actions.";
}

export default function AssistantCards({
  assistants,
  onToggleStatus,
  onDelete,
  onActivityUpdate,
}: AssistantCardsProps) {
  const [outputs, setOutputs] = useState<Record<number, string>>({});
  const [history, setHistory] = useState<Record<number, string[]>>({});
  const [runningId, setRunningId] = useState<number | null>(null);

  useEffect(() => {
    const savedOutputs = localStorage.getItem("assistantOutputs");
    const savedHistory = localStorage.getItem("assistantHistory");

    if (savedOutputs) setOutputs(JSON.parse(savedOutputs));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem("assistantOutputs", JSON.stringify(outputs));
  }, [outputs]);

  useEffect(() => {
    localStorage.setItem("assistantHistory", JSON.stringify(history));
  }, [history]);

  async function runTask(assistant: Assistant, action: string) {
    const task = buildTask(action, assistant);

    setRunningId(assistant.id);

    try {
      const res = await fetch("/api/assistant-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantName: assistant.name,
          assistantType: assistant.type,
          task,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOutputs((current) => ({
          ...current,
          [assistant.id]:
            data.error || "Something went wrong running this task.",
        }));

        onActivityUpdate?.(`${assistant.name} task failed`);
        setRunningId(null);
        return;
      }

      setOutputs((current) => ({
        ...current,
        [assistant.id]: data.output,
      }));

      setHistory((current) => ({
        ...current,
        [assistant.id]: [
          data.output,
          ...(current[assistant.id] || []),
        ].slice(0, 3),
      }));

      onActivityUpdate?.(`${assistant.name} ran action: ${action}`);
    } catch {
      setOutputs((current) => ({
        ...current,
        [assistant.id]: "Network or server error occurred.",
      }));

      onActivityUpdate?.(`${assistant.name} encountered an error`);
    }

    setRunningId(null);
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
      {assistants.map((assistant) => {
        const isRunning = runningId === assistant.id;
        const latestOutput = outputs[assistant.id];
        const actions = getQuickActions(assistant.type);

        return (
          <div
            key={assistant.id}
            className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/5 transition hover:-translate-y-1 hover:border-cyan-400/40"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                <Bot />
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  assistant.status === "Active"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                    : "border-red-400/20 bg-red-500/10 text-red-300"
                }`}
              >
                {assistant.status}
              </span>
            </div>

            <div className="mt-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {assistant.name}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  {assistant.role}
                </p>
              </div>

              <div className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs capitalize text-fuchsia-300">
                {assistant.type || "general"}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
                Quick Actions
              </p>

              <div className="grid gap-2">
                {actions.map((action) => (
                  <button
                    key={action}
                    onClick={() => runTask(assistant, action)}
                    disabled={isRunning}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 disabled:opacity-50"
                  >
                    {isRunning ? "Running..." : action}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-300">
                <Sparkles size={14} />
                Latest AI Output
              </div>

              <p className="line-clamp-5 text-sm text-slate-300">
                {isRunning
                  ? "Running task..."
                  : latestOutput || "No task has been executed yet."}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Clock size={13} />
                {latestOutput ? "Updated just now" : "Waiting for first task"}
              </div>
            </div>

            {history[assistant.id]?.length > 0 && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
                  Recent Task History
                </p>

                <div className="space-y-3">
                  {history[assistant.id].map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400"
                    >
                      {item.slice(0, 140)}...
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => onToggleStatus(assistant.id)}
                className="rounded-2xl border border-white/10 px-4 py-3 text-slate-300 hover:bg-white/10"
              >
                {assistant.status === "Active" ? "Pause" : "Activate"}
              </button>

              <button
                onClick={() => onDelete(assistant.id)}
                className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-300 hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}