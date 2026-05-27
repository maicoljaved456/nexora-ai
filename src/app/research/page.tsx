"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { Search, Globe, Sparkles, Clock } from "lucide-react";

const modes = [
  "Market Research",
  "Competitor Analysis",
  "Lead Discovery",
];

type ResearchItem = {
  id: number;
  mode: string;
  query: string;
  result: string;
  createdAt: string;
};

export default function ResearchPage() {
  const [mode, setMode] = useState("Market Research");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<ResearchItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("researchHistory");

    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("researchHistory", JSON.stringify(history));
  }, [history]);

  async function runResearch() {
    if (!query) return;

    setLoading(true);

    try {
      const res = await fetch("/api/assistant-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantName: "Research Assistant",
          assistantType: "research",
          task: `
Mode: ${mode}

Research request:
${query}

Return a structured business intelligence report with clear headings and short bullet points. If the mode is Lead Discovery, prioritise practical prospecting targets and outreach angles over general market commentary.
For Lead Discovery, return:
1. Ideal Customer Profile
2. Target Company Types
3. Likely Pain Points
4. Buying Triggers
5. Decision Makers
6. Outreach Angles
7. Qualification Questions
8. Suggested Search Terms

Avoid broad market commentary. Focus on practical prospecting intelligence.
For Competitor Analysis, include positioning, strengths, weaknesses, pricing signals if available, and differentiation.
For Market Research, include trends, opportunities, risks, and recommended next actions.
`,
        }),
      });

      const data = await res.json();
      const output = data.output || data.error || "No result returned.";

      setResult(output);

      setHistory((current) => [
        {
          id: Date.now(),
          mode,
          query,
          result: output,
          createdAt: new Date().toLocaleString(),
        },
        ...current,
      ]);
    } catch {
      setResult("Research request failed.");
    }

    setLoading(false);
  }

  function clearHistory() {
    localStorage.removeItem("researchHistory");
    setHistory([]);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 overflow-x-hidden p-4 pt-20 lg:p-8">
          <Topbar />

          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              NEXORA RESEARCH ENGINE
            </p>

            <h1 className="mt-3 text-3xl font-bold lg:text-5xl">
              AI Research Workspace
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Run market research, competitor analysis, and lead discovery from
              one workspace.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                <Globe />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Research Mode</h2>
                <p className="text-sm text-slate-400">
                  Choose what kind of intelligence you want to generate.
                </p>
              </div>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {modes.map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    mode === item
                      ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                      : "border-white/10 bg-slate-950/70 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4 xl:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  mode === "Lead Discovery"
                    ? "Example: Find UK logistics companies likely to need AI automation"
                    : mode === "Competitor Analysis"
                    ? "Example: Compare Salesforce Einstein vs Microsoft Copilot"
                    : "Example: Research the UK AI automation market"
                }
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              />

              <button
                onClick={runResearch}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50"
              >
                <Search size={18} />
                {loading ? "Researching..." : "Run Research"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_420px]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-fuchsia-500/5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-300">
                  <Sparkles />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">Research Output</h2>
                  <p className="text-sm text-slate-400">Mode: {mode}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {result || "No research has been run yet."}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Research History</h2>
                  <p className="text-sm text-slate-400">
                    Saved intelligence reports
                  </p>
                </div>

                <button
                  onClick={clearHistory}
                  className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-[520px] space-y-4 overflow-y-auto">
                {history.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                    No saved research yet.
                  </div>
                )}

                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMode(item.mode);
                      setQuery(item.query);
                      setResult(item.result);
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-left hover:border-cyan-400/40"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        {item.mode}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={12} />
                        {item.createdAt}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-white">
                      {item.query}
                    </p>

                    <p className="mt-2 line-clamp-3 text-xs text-slate-500">
                      {item.result}
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