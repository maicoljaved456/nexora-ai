"use client";

import Sidebar from "@/components/dashboard/Sidebar";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#020617] flex text-white">
      <Sidebar />

      <section className="flex-1 p-10">
        <p className="text-cyan-300 uppercase tracking-[0.3em] text-sm">
          Nexora AI
        </p>

        <h1 className="mt-3 text-4xl font-bold">Settings</h1>

        <p className="mt-2 text-slate-400">
          Configure workspace rules, permissions, and AI safety controls.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">AI Permissions</h2>
            <p className="mt-2 text-slate-400">
              Control what assistants can read, draft, approve, or execute.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Approval Rules</h2>
            <p className="mt-2 text-slate-400">
              Require human review before emails, CRM updates, or financial actions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}