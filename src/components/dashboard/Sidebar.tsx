"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Activity,
  Search,
  Briefcase,
  Settings,
  Menu,
  X,
  Mail,
  MailCheck,
  Brain,
  BriefcaseBusiness,
  GitBranch,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: "Inbox",
      href: "/inbox",
      icon: <Mail size={18} />,
    },
    {
      label: "Email Activity",
      href: "/email-activity",
      icon: <MailCheck size={18} />,
    },
    {
      label: "Approvals",
      href: "/approvals",
      icon: <CheckSquare size={18} />,
    },
    {
      label: "Assistants",
      href: "/assistants",
      icon: <Users size={18} />,
    },
    {
      label: "Knowledge",
      href: "/knowledge",
      icon: <Brain size={18} />,
    },
    {
      label: "Jobs",
      href: "/jobs",
      icon: <BriefcaseBusiness size={18} />,
    },
    {
      label: "Automation Rules",
      href: "/automation-rules",
      icon: <GitBranch size={18} />,
    },
    {
      label: "Activity",
      href: "/activity",
      icon: <Activity size={18} />,
    },
    {
      label: "Research",
      href: "/research",
      icon: <Search size={18} />,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: <Briefcase size={18} />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings size={18} />,
    },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-white backdrop-blur-xl lg:hidden"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-[280px]
          border-r border-white/10 bg-[#050816]
          flex flex-col justify-between px-6 py-8
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div>
          <div className="mb-10 flex items-center justify-between lg:justify-center">
            <Image
              src="/nexora-logo.png"
              alt="Nexora"
              width={160}
              height={160}
              loading="eager"
              className="object-contain"
            />

            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/10 p-2 text-slate-300 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-3">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-2xl border px-5 py-4
                    transition-all duration-300
                    ${
                      active
                        ? "border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-lg shadow-cyan-500/10"
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {link.icon}

                  <span className="font-medium tracking-wide">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-sm text-slate-300">NEXORA AI SYSTEM</p>

          <p className="mt-1 text-xs text-slate-500">
            Intelligence. Automation. Results.
          </p>
        </div>
      </aside>
    </>
  );
}