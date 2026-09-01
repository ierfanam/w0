import React, { useState } from "react";

type Props = { apiBase?: string };

export default function TeamMode({ apiBase = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!request.trim()) return;
    setBusy(true); setResult(null);
    try {
      const response = await fetch(`${apiBase}/api/ai/autopilot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objective: request, project: { name: "current-project", files: {} } }) });
      setResult(await response.json());
    } catch (error) { setResult({ error: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(false); }
  }

  return <>
    <button onClick={() => setOpen(v => !v)} className="rounded-full px-4 py-2 text-sm shadow-lg bg-black text-white dark:bg-white dark:text-black">تیم هوش مصنوعی</button>
    {open && <div dir="rtl" className="mt-2 w-96 rounded-xl border bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-2 font-semibold">اتوپایلوت چندعاملی</div>
      <textarea value={request} onChange={e => setRequest(e.target.value)} placeholder="هدف پروژه را بنویسید..." className="mb-2 h-24 w-full rounded-lg border p-2 text-sm dark:bg-neutral-800" />
      <button disabled={busy} onClick={run} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50">{busy ? "در حال تحلیل و اجرای تیم..." : "اجرای تیم"}</button>
      {result && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-100 p-2 text-xs dark:bg-neutral-800">{JSON.stringify(result, null, 2)}</pre>}
    </div>}
  </>;
}
