"use client";

import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { saveGmailConnection } from "@/lib/saveGmailConnection";

import {
  Sparkles,
  Mail,
  ShieldCheck,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  useEffect(() => {
    saveGmailConnection();
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
              NEXORA AI
            </p>

            <div className="mt-4 flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
                Dashboard
              </h1>

              <Sparkles
                className="hidden text-cyan-300 lg:block"
                size={42}
              />
            </div>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg">
              Autonomous AI operations platform for inbox automation,
              approvals, workflows, and intelligent communications.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Inbox Automation
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-white">
                    Active
                  </h2>
                </div>

                <Mail className="text-cyan-300" size={34} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-fuchsia-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-fuchsia-500/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Approval Queue
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-white">
                    Online
                  </h2>
                </div>

                <ShieldCheck className="text-fuchsia-300" size={34} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Workflow Engine
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-white">
                    Running
                  </h2>
                </div>

                <Activity className="text-emerald-300" size={34} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    AI Agents
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-white">
                    Ready
                  </h2>
                </div>

                <Sparkles className="text-amber-300" size={34} />
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">
              System Status
            </h2>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-slate-400">
                  Gmail Integration
                </p>

                <p className="mt-3 text-lg font-bold text-emerald-300">
                  Connected
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-slate-400">
                  Cron Processing
                </p>

                <p className="mt-3 text-lg font-bold text-cyan-300">
                  Active
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-slate-400">
                  Approval Engine
                </p>

                <p className="mt-3 text-lg font-bold text-fuchsia-300">
                  Operational
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}