"use client";

type Approval = {
  id: number;
  title: string;
  description: string;
};

type ApprovalQueueProps = {
  approvals: Approval[];
  onDecision: (
    title: string,
    decision: "approved" | "rejected"
  ) => void;
};

export default function ApprovalQueue({
  approvals,
  onDecision,
}: ApprovalQueueProps) {
  return (
    <div className="flex flex-col gap-4">
      {approvals.length === 0 && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-emerald-300">
          No pending approvals.
        </div>
      )}

      {approvals.map((approval) => (
        <div
          key={approval.id}
          className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-cyan-500/5"
        >
          <div className="mb-3 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
            Pending Review
          </div>

          <h3 className="text-lg font-semibold text-white">
            {approval.title}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {approval.description}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() =>
                onDecision(approval.title, "approved")
              }
              className="rounded-xl bg-emerald-500/20 border border-emerald-400/20 px-4 py-2 text-emerald-200 hover:bg-emerald-500/30 transition"
            >
              Approve
            </button>

            <button
              onClick={() =>
                onDecision(approval.title, "rejected")
              }
              className="rounded-xl bg-red-500/20 border border-red-400/20 px-4 py-2 text-red-200 hover:bg-red-500/30 transition"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}