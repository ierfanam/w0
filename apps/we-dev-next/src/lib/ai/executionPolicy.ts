export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ActionKind = "read" | "write" | "command" | "network" | "deploy" | "git";

export interface ExecutionAction { kind: ActionKind; target: string; risk: RiskLevel; reason?: string; }
export interface ApprovalDecision { allowed: boolean; requiresApproval: boolean; reason: string; }

const HIGH_RISK = /(^|\/)(\.env|\.env\.|secrets?|credentials?|.*key.*|.*token.*)$/i;
const DESTRUCTIVE = /\b(rm\s+-rf|del\s+\/s|format\b|drop\s+(database|table)|truncate\b|shutdown\b|reboot\b)\b/i;

export function classifyAction(action: ExecutionAction): RiskLevel {
  if (action.kind === "deploy") return "high";
  if (action.kind === "command" && DESTRUCTIVE.test(action.target)) return "critical";
  if (HIGH_RISK.test(action.target) || action.kind === "network") return "high";
  if (action.kind === "write" || action.kind === "git") return "medium";
  return action.risk;
}

export function evaluateApproval(action: ExecutionAction, autoApproveLowRisk = true): ApprovalDecision {
  const risk = classifyAction(action);
  if (risk === "critical") return { allowed: false, requiresApproval: true, reason: "عملیات مخرب یا برگشت‌ناپذیر مسدود شد." };
  if (risk === "high") return { allowed: false, requiresApproval: true, reason: "این عملیات نیازمند تأیید صریح کاربر است." };
  if (risk === "medium" && !autoApproveLowRisk) return { allowed: false, requiresApproval: true, reason: "تغییر فایل یا Git نیازمند تأیید است." };
  return { allowed: true, requiresApproval: false, reason: "عملیات در سطح ریسک مجاز است." };
}

export function createApprovalPlan(actions: ExecutionAction[]) {
  return actions.map(action => ({ action, decision: evaluateApproval(action) }));
}
