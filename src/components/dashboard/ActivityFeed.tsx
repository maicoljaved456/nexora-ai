"use client";

type ActivityFeedProps = {
  activity: string[];
};

export default function ActivityFeed({
  activity,
}: ActivityFeedProps) {
  return (
    <div className="flex flex-col gap-3">
      {activity.map((item, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-cyan-500/5"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-cyan-400 shadow shadow-cyan-400" />

            <div>
              <p className="text-sm text-slate-300">
                {item}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Live system event
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}