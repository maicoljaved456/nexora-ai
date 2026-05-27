"use client";

type AddAssistantFormProps = {
  onAdd: (name: string, role: string, type: string) => void;
};

export default function AddAssistantForm({ onAdd }: AddAssistantFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name"));
    const role = String(formData.get("role"));
    const type = String(formData.get("type"));

    if (!name || !role || !type) return;

    onAdd(name, role, type);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">
          Create Assistant
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Add a new specialised AI agent to your operations system.
        </p>
      </div>

<div className="grid gap-4 xl:grid-cols-[1fr_1fr_220px_auto]">
        <input
          name="name"
          placeholder="Assistant name"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
        />

        <input
          name="role"
          placeholder="What should it do?"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-400/60"
        />

        <select
          name="type"
          defaultValue="operations"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none focus:border-cyan-400/60"
        >
          <option value="inbox">Inbox</option>
          <option value="reporting">Reporting</option>
          <option value="crm">CRM</option>
          <option value="finance">Finance</option>
          <option value="operations">Operations</option>
        </select>

        <button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-7 py-4 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90">
          Create
        </button>
      </div>
    </form>
  );
}