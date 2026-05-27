"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

const fakeEvents = [
  "Inbox Assistant scanned 8 new emails",
  "Reporting Assistant checked yesterday's sales numbers",
  "CRM Assistant found 2 records needing review",
  "Finance Assistant drafted 3 invoice reminders",
  "Inbox Assistant flagged 1 urgent customer email",
];

export default function ActivityPage() {
  const [activity, setActivity] = useState([
    "Inbox Assistant classified 24 new emails",
    "Reporting Assistant generated daily revenue report",
    "CRM Assistant paused awaiting approval",
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const randomEvent =
        fakeEvents[Math.floor(Math.random() * fakeEvents.length)];

      setActivity((current) => [
        randomEvent,
        ...current.slice(0, 8),
      ]);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#020617] flex text-white">
      <Sidebar />

      <section className="flex-1 p-10">
        <p className="text-cyan-300 uppercase tracking-[0.3em] text-sm">
          Nexora AI
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Activity
        </h1>

        <p className="mt-2 text-slate-400">
          Live system events, assistant activity, and automation history.
        </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
          <ActivityFeed activity={activity} />
        </div>
      </section>
    </main>
  );
}