export type BrowserAction =
  | { type: "open"; url: string }
  | { type: "extract"; selector?: string }
  | { type: "click"; selector: string }
  | { type: "type"; selector: string; text: string };

export type BrowserPolicy = { allowedHosts?: string[]; maxBytes?: number; allowForms?: boolean };

function assertUrl(url: string, policy: BrowserPolicy) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("فقط HTTP/HTTPS مجاز است");
  if (policy.allowedHosts?.length && !policy.allowedHosts.includes(parsed.hostname)) throw new Error("میزبان در سیاست Browser Agent مجاز نیست");
  return parsed;
}

export async function fetchPage(url: string, policy: BrowserPolicy = {}) {
  const parsed = assertUrl(url, policy);
  const response = await fetch(parsed, { redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const max = policy.maxBytes || 2_000_000;
  return { url: response.url, status: response.status, content: text.slice(0, max) };
}

export function validateBrowserActions(actions: BrowserAction[], policy: BrowserPolicy) {
  for (const action of actions) if (action.type === "open") assertUrl(action.url, policy);
  return { valid: true, actions };
}
