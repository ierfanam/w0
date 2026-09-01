export interface BenchmarkCase { id: string; prompt: string; expected?: string[]; requiredCapabilities?: string[]; }
export interface BenchmarkResult { model: string; caseId: string; output: string; latencyMs: number; score: number; }

export function lexicalScore(output: string, expected: string[] = []): number {
  if (!expected.length) return output.trim().length > 0 ? 1 : 0;
  const text = output.toLowerCase();
  return expected.reduce((n, term) => n + (text.includes(term.toLowerCase()) ? 1 : 0), 0) / expected.length;
}

export async function runArena(models: string[], cases: BenchmarkCase[], invoke: (model: string, prompt: string) => Promise<string>): Promise<BenchmarkResult[]> {
  const jobs = models.flatMap(model => cases.map(async c => {
    const start = Date.now();
    try {
      const output = await invoke(model, c.prompt);
      return { model, caseId: c.id, output, latencyMs: Date.now() - start, score: lexicalScore(output, c.expected) };
    } catch {
      return { model, caseId: c.id, output: "", latencyMs: Date.now() - start, score: 0 };
    }
  }));
  return Promise.all(jobs);
}

export function rankArena(results: BenchmarkResult[]): string[] {
  const aggregate = new Map<string, { score: number; latency: number; count: number }>();
  for (const r of results) { const a = aggregate.get(r.model) ?? { score: 0, latency: 0, count: 0 }; a.score += r.score; a.latency += r.latencyMs; a.count++; aggregate.set(r.model, a); }
  return [...aggregate.entries()].sort((a,b) => (b[1].score/b[1].count - a[1].score/a[1].count) || (a[1].latency - b[1].latency)).map(([m]) => m);
}
