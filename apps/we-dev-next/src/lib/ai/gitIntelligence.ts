export interface GitChange { path: string; status: "added" | "modified" | "deleted" | "renamed" | "unknown"; additions: number; deletions: number; }
export interface GitSummary { filesChanged: number; additions: number; deletions: number; hotspots: string[]; }

export function summarizeGitChanges(changes: GitChange[]): GitSummary {
  const sorted = [...changes].sort((a,b) => (b.additions + b.deletions) - (a.additions + a.deletions));
  return { filesChanged: changes.length, additions: changes.reduce((n,c) => n + c.additions, 0), deletions: changes.reduce((n,c) => n + c.deletions, 0), hotspots: sorted.slice(0, 10).map(c => c.path) };
}

export function releaseGate(summary: GitSummary, criticalFindings = 0) {
  return { ready: summary.filesChanged > 0 && criticalFindings === 0, reason: criticalFindings ? "یافته امنیتی بحرانی وجود دارد." : "نیازمند اجرای تست و Build واقعی روی workspace میزبان است." };
}
