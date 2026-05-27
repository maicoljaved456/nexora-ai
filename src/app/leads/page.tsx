"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Users,
  Building2,
  Sparkles,
  MapPin,
  Target,
  Zap,
  Download,
} from "lucide-react";

type Lead = {
  companyName: string;
  location: string;
  whyFit: string;
  painPoint: string;
  decisionMaker: string;
  outreachAngle: string;
  leadFitScore: number;
  urgencyScore: number;
};

type LeadResult = {
  id: number;
  query: string;
  output: string;
  leads: Lead[];
  createdAt: string;
};

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawOutput, setRawOutput] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [history, setHistory] = useState<LeadResult[]>([]);

  useEffect(() => {
    loadLeads();
  }, []);

  async function getCurrentUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id;
  }

  async function loadLeads() {
    const userId = await getCurrentUserId();

    if (!userId) {
      console.error("No logged-in user found.");
      return;
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase lead load error:", error.message);
      return;
    }

    const loadedHistory = data.map((lead) => ({
      id: lead.id,
      query: lead.query,
      output: lead.outreach_angle,
      leads: [
        {
          companyName: lead.company_name,
          location: lead.location,
          whyFit: lead.why_fit,
          painPoint: lead.pain_point,
          decisionMaker: lead.decision_maker,
          outreachAngle: lead.outreach_angle,
          leadFitScore: lead.lead_fit_score,
          urgencyScore: lead.urgency_score,
        },
      ],
      createdAt: lead.created_at,
    }));

    setHistory(loadedHistory);
  }

  function extractJson(text: string) {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? match[0] : text;
  }

  function escapeCsv(value: string | number) {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  function exportLeadsToCsv() {
    if (leads.length === 0) return;

    const headers = [
      "Company Name",
      "Location",
      "Why Fit",
      "Pain Point",
      "Decision Maker",
      "Outreach Angle",
      "Lead Fit Score",
      "Urgency Score",
    ];

    const rows = leads.map((lead) => [
      lead.companyName,
      lead.location,
      lead.whyFit,
      lead.painPoint,
      lead.decisionMaker,
      lead.outreachAngle,
      lead.leadFitScore,
      lead.urgencyScore,
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "nexora-leads.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function saveLeadsToSupabase(parsedLeads: Lead[]) {
    if (parsedLeads.length === 0) return;

    const userId = await getCurrentUserId();

    if (!userId) {
      console.error("Cannot save leads. No logged-in user found.");
      return;
    }

    const rows = parsedLeads.map((lead) => ({
      user_id: userId,
      query,
      company_name: lead.companyName,
      location: lead.location,
      why_fit: lead.whyFit,
      pain_point: lead.painPoint,
      decision_maker: lead.decisionMaker,
      outreach_angle: lead.outreachAngle,
      lead_fit_score: lead.leadFitScore,
      urgency_score: lead.urgencyScore,
    }));

    const { error } = await supabase.from("leads").insert(rows);

    if (error) {
      console.error("Supabase lead insert error:", error.message);
      return;
    }

    await loadLeads();
  }

  async function runLeadSearch() {
    if (!query) return;

    setLoading(true);
    setRawOutput("");
    setLeads([]);

    try {
      const res = await fetch("/api/assistant-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantName: "Lead Discovery Assistant",
          assistantType: "research",
          task: `
Lead Discovery Request:
${query}

Return ONLY valid JSON. No markdown. No explanation.

Use this exact JSON structure:

{
  "leads": [
    {
      "companyName": "Company name",
      "location": "City or region",
      "whyFit": "Why this company may be a fit",
      "painPoint": "Likely pain point",
      "decisionMaker": "Likely decision maker role",
      "outreachAngle": "Specific outreach angle",
      "leadFitScore": 85,
      "urgencyScore": 70
    }
  ],
  "summary": "Short summary of the opportunity",
  "recommendedNextStep": "Best next action"
}

Rules:
- Include at least 6 named real companies where possible.
- If exact company fit is uncertain, say so in whyFit.
- Use web research where available.
- Keep each field concise.
- Scores must be numbers from 0 to 100.
`,
        }),
      });

      const data = await res.json();
      const output = data.output || data.error || "No result returned.";

      setRawOutput(output);

      let parsedLeads: Lead[] = [];

      try {
        const parsed = JSON.parse(extractJson(output));
        parsedLeads = parsed.leads || [];
      } catch {
        parsedLeads = [];
      }

      setLeads(parsedLeads);

      await saveLeadsToSupabase(parsedLeads);
    } catch {
      setRawOutput("Lead discovery request failed.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 overflow-x-hidden p-4 pt-20 lg:p-8">
          <Topbar />

          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              NEXORA LEAD ENGINE
            </p>

            <h1 className="mt-3 text-3xl font-bold lg:text-5xl">
              AI Lead Discovery
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Discover named companies, buying triggers, pain points, and
              outreach angles.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                <Users />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Lead Search</h2>

                <p className="text-sm text-slate-400">
                  Ask for a specific market, location, or buyer profile.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: Find UK recruitment agencies likely to need AI automation"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              />

              <button
                onClick={runLeadSearch}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50"
              >
                <Search size={18} />
                {loading ? "Searching..." : "Find Leads"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-fuchsia-500/5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-300">
                    <Sparkles />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">Lead Cards</h2>
                    <p className="text-sm text-slate-400">
                      Structured prospect intelligence
                    </p>
                  </div>
                </div>

                <button
                  onClick={exportLeadsToCsv}
                  disabled={leads.length === 0}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>

              {leads.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-500">
                  {rawOutput || "No lead search has been run yet."}
                </div>
              )}

              <div className="grid gap-4">
                {leads.map((lead, index) => (
                  <div
                    key={`${lead.companyName}-${index}`}
                    className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-cyan-400/40"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {lead.companyName}
                        </h3>

                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                          {lead.location || "Location not confirmed"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                          Fit {lead.leadFitScore}/100
                        </span>

                        <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-300">
                          Urgency {lead.urgencyScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-300">
                          <Target size={14} />
                          Why Fit
                        </p>

                        <p className="text-sm text-slate-300">
                          {lead.whyFit}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-fuchsia-300">
                          <Zap size={14} />
                          Pain Point
                        </p>

                        <p className="text-sm text-slate-300">
                          {lead.painPoint}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Decision Maker
                      </p>

                      <p className="mt-2 text-sm text-slate-300">
                        {lead.decisionMaker}
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-cyan-500/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-300">
                        Outreach Angle
                      </p>

                      <p className="mt-2 text-sm text-slate-200">
                        {lead.outreachAngle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {rawOutput && leads.length > 0 && (
                <details className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <summary className="cursor-pointer text-sm text-slate-400">
                    View raw AI output
                  </summary>

                  <pre className="mt-4 whitespace-pre-wrap text-xs text-slate-500">
                    {rawOutput}
                  </pre>
                </details>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                  <Building2 />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">Lead History</h2>

                  <p className="text-sm text-slate-400">
                    Private to current user
                  </p>
                </div>
              </div>

              <div className="max-h-[520px] space-y-4 overflow-y-auto">
                {history.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                    No saved leads yet.
                  </div>
                )}

                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setQuery(item.query);
                      setRawOutput(item.output);
                      setLeads(item.leads || []);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-left hover:border-cyan-400/40"
                  >
                    <p className="text-sm font-medium text-white">
                      {item.query}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {item.createdAt}
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                      {item.leads?.[0]?.companyName || "Saved lead"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}