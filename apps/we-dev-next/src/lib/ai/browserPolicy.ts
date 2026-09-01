export type BrowserAction = "navigate" | "read" | "click" | "type" | "download" | "upload" | "submit";
export interface BrowserIntent { action: BrowserAction; url?: string; target?: string; data?: string; }

const SENSITIVE = /(?:delete|remove|purchase|buy|pay|transfer|send|submit|publish|change password|ویرایش|حذف|پرداخت|خرید|ارسال|انتشار)/i;
export function requiresBrowserApproval(intent: BrowserIntent) {
  return intent.action === "submit" || intent.action === "download" || intent.action === "upload" || SENSITIVE.test(`${intent.action} ${intent.target || ""} ${intent.data || ""}`);
}
export function validateBrowserUrl(url: string) {
  try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol); } catch { return false; }
}
