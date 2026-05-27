"use client";

import { Mail, BarChart3, CheckSquare } from "lucide-react";

type StatsCardsProps = {
  pendingApprovals: number;
};

export default function StatsCards({ pendingApprovals }: StatsCardsProps) {
  const cards = [
    {
      label: "Emails Processed",
      value: "248",
      icon: <Mail />,
      accent: "text-cyan-300",
    },
    {
      label: "Reports Generated",
      value: "24",
      icon: <BarChart3 />,
      accent: "text-emerald-300",
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      icon: <CheckSquare />,
      accent: "text-fuchsia-300",
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-cyan-500/5 transition hover:-translate-y-1 hover:border-cyan-400/40"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {card.value}
              </p>
            </div>

            <div className={`rounded-2xl bg-white/5 p-3 ${card.accent}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}