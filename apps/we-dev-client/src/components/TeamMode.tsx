import React, { useMemo, useState } from "react";

type Props = { apiBase?: string };

type Result = { ok?: boolean; error?: string; plan?: any; results?: any[]; final?: any; adversarial?: any; qualityBefore?: any };

const roles = [
  ["architect", "معمار ارشد"], ["ui", "طراح UI/UX"], ["coder", "مهندس کدنویسی"], ["analyst", "تحلیلگر"],
  ["bug-hunter", "شکارچی باگ"], ["debugger", "متخصص دیباگ"], ["qa", "مهندس QA"], ["build", "Build/Compile"],
  ["deploy", "DevOps/Deploy"], ["reverse", "مهندسی معکوس/سازگاری"], ["localization", "بومی‌سازی"], ["security", "امنیت"],
  ["reviewer", "بازبین خصمانه"], ["release", "Release"]
];

export default function TeamMode({ apiBase = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [model, setModel] = useState("openrouter/free");
  const [selected, setSelected] = useState<string[]>(roles.map(r => r[0]));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const selectedCount = useMemo(() => selected.length, [selected]);

  async function run() {
    if (!goal.trim() || busy) return;
    setBusy(true); setResult(null);
    try {
      const response = await fetch(`${apiBase}/api/autopilot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal, model, roles: selected, concurrency: 6, project: { files: [] } }) });
      const data = await response.json();
      setResult(data);
    } catch (e) { setResult({ error: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  }

  return <div dir="rtl" className="w-[390px] max-w-[calc(100vw-32px)] text-right">
    {!open ? <button onClick={() => setOpen(true)} className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-2xl dark:bg-white dark:text-black">تیم هوش مصنوعی / Project Autopilot</button> :
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#171717] dark:text-white">
        <div className="mb-3 flex items-center justify-between"><div><div className="font-bold">اتوپایلوت پروژه</div><div className="text-xs opacity-60">{selectedCount} متخصص فعال • اجرای موازی</div></div><button onClick={() => setOpen(false)} className="opacity-60">×</button></div>
        <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={4} placeholder="هدف پروژه را دقیق بنویسید..." className="mb-3 w-full resize-none rounded-xl border border-black/10 bg-transparent p-3 text-sm outline-none dark:border-white/10" />
        <div className="mb-3 flex gap-2"><select value={model} onChange={e => setModel(e.target.value)} className="flex-1 rounded-lg border border-black/10 bg-transparent p-2 text-xs dark:border-white/10"><option value="openrouter/free">انتخاب خودکار مدل رایگان</option><option value="glm-4.7-flash">GLM-4.7-Flash</option><option value="glm-4.5-flash">GLM-4.5-Flash</option><option value="glm-4v-flash">GLM-4V-Flash</option><option value="glm-4.1v-thinking-flash">GLM-4.1V-Thinking-Flash</option></select></div>
        <div className="mb-3 grid max-h-36 grid-cols-2 gap-1 overflow-auto">{roles.map(([id, label]) => <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-xs hover:bg-black/5 dark:hover:bg-white/5"><input type="checkbox" checked={selected.includes(id)} onChange={e => setSelected(s => e.target.checked ? [...s, id] : s.filter(x => x !== id))} />{label}</label>)}</div>
        <button disabled={busy || !goal.trim()} onClick={run} className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">{busy ? "در حال اجرای تیم..." : "اجرای Project Autopilot"}</button>
        {result && <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-black/10 p-3 text-xs dark:border-white/10">{result.error ? <div className="text-red-500">{result.error}</div> : <>
          <div className="mb-3 font-semibold">نتیجه نهایی</div><pre className="whitespace-pre-wrap break-words">{result.final?.summary || "نتیجه‌ای تولید نشد"}</pre>
          <hr className="my-3 border-black/10 dark:border-white/10" /><div className="font-semibold">بازبینی خصمانه</div><pre className="mt-2 whitespace-pre-wrap break-words">{result.adversarial?.summary || ""}</pre>
          {result.qualityBefore && <div className="mt-3 rounded-lg bg-black/5 p-2 dark:bg-white/5">امتیاز کیفیت اولیه: {result.qualityBefore.score}/100</div>}
        </>}</div>}
      </div>}
  </div>;
}
