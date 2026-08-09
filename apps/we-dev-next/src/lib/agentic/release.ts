export type WorkspacePlan = { branch: string; worktree: string; purpose: string; mergeOrder: string[] };
export function createWorkspacePlan(taskIds: string[]): WorkspacePlan[] {
  return taskIds.map((id, i) => ({ branch: `agent/${id}`, worktree: `.w0/worktrees/${id}`, purpose: `اجرای مستقل وظیفه ${id}`, mergeOrder: i === 0 ? [id] : [taskIds[0], id] }));
}
export function releasePlan() { return { steps: ["typecheck", "lint", "unit-test", "integration-test", "build", "smoke-test", "package", "publish"], rollback: ["keep previous artifact", "restore previous version", "run health check"] }; }
