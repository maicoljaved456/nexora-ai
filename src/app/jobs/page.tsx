 "use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import { createJob } from "@/lib/createJob";
import {
  BriefcaseBusiness,
  RefreshCw,
  Clock,
  Plus,
  PlayCircle,
} from "lucide-react";

type Job = {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  retries: number;
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
  processed_at: string | null;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function loadJobs() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("No logged-in user found.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setJobs(data || []);
    }

    setLoading(false);
  }

  async function createTestJob() {
    setCreating(true);
    setMessage("");

    try {
      await createJob("test_job", {
        source: "jobs_page",
        note: "This is a test background job.",
        createdAt: new Date().toISOString(),
      });

      setMessage("Test job created.");
      await loadJobs();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create job.");
    }

    setCreating(false);
  }

  async function checkInboxNow() {
    setMessage("");

    try {
      const res = await fetch("/api/manual/check-inbox", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Inbox check failed.");
      } else {
        setMessage(`Inbox checked. ${data.jobsCreated || 0} job(s) created.`);
        await loadJobs();
      }
    } catch {
      setMessage("Inbox check failed.");
    }
  }

  async function processJobs() {
    setProcessing(true);
    setMessage("");

    try {
      const res = await fetch("/api/jobs/process", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to process jobs.");
      } else {
        setMessage(`Processed ${data.processed || 0} job(s).`);
        await loadJobs();
      }
    } catch {
      setMessage("Failed to call job processor.");
    }

    setProcessing(false);
  }

  useEffect(() => {
    loadJobs();
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
              NEXORA JOBS
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              Background Jobs
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg">
              Monitor queued AI tasks, background processing, retries, and
              execution results.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl lg:p-8">
            <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                  <BriefcaseBusiness size={32} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">Job Queue</h2>

                  <p className="mt-1 text-slate-400">
                    Supabase-backed task history.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={createTestJob}
                  disabled={creating}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-5 py-4 text-sm font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
                >
                  <Plus size={18} />
                  {creating ? "Creating..." : "Create Test Job"}
                </button>

                <button
                  onClick={checkInboxNow}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20"
                >
                  <RefreshCw size={18} />
                  Check Inbox Now
                </button>

                <button
                  onClick={processJobs}
                  disabled={processing}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <PlayCircle size={18} />
                  {processing ? "Processing..." : "Process Jobs"}
                </button>

                <button
                  onClick={loadJobs}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  <RefreshCw size={18} />
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {message && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                {message}
              </div>
            )}

            <div className="grid gap-5">
              {jobs.length === 0 && !message && (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
                  <Clock className="text-slate-600" size={44} />

                  <p className="mt-4 text-lg font-medium text-slate-300">
                    No jobs yet.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a test job to verify the queue.
                  </p>
                </div>
              )}

              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-3xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                          job.status === "completed"
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                            : job.status === "failed"
                            ? "border-red-400/20 bg-red-500/10 text-red-300"
                            : job.status === "processing"
                            ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
                            : "border-amber-400/20 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {job.status}
                      </span>

                      <h3 className="mt-4 text-xl font-bold text-white">
                        {job.type}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Retries: {job.retries}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>

                  <details className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <summary className="cursor-pointer text-sm text-slate-400">
                      Payload / Result
                    </summary>

                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-400">
                      {JSON.stringify(
                        {
                          payload: job.payload,
                          result: job.result,
                          error: job.error,
                          processed_at: job.processed_at,
                        },
                        null,
                        2
                      )}
                    </pre>
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