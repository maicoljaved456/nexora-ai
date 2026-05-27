"use client";

import { Bell, Search, Sparkles, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
          <Sparkles size={20} />
        </div>

        <div>
          <p className="text-sm text-slate-500">Nexora AI Platform</p>
          <h2 className="text-base font-semibold text-white lg:text-lg">
            Enterprise Automation Workspace
          </h2>
        </div>
      </div>

      <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 lg:w-[360px]">
        <Search size={18} className="text-slate-500" />
        <input
          placeholder="Search assistants, reports, activity..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="flex items-center justify-between gap-4 lg:justify-end">
        <button className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 font-bold text-white">
            M
          </div>

          <div>
            <p className="text-sm font-medium text-white">Maicol</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-300 transition hover:bg-red-500/20"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}