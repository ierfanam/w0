export interface ProviderHealth { provider: string; ok: boolean; latencyMs: number; checkedAt: string; error?: string; }

const checks = new Map<string, ProviderHealth>();

export async function checkProvider(provider: string, baseUrl: string, apiKey?: string): Promise<ProviderHealth> {
  const started = Date.now();
  if (!apiKey) {
    const result = { provider, ok: false, latencyMs: 0, checkedAt: new Date().toISOString(), error: "API key is not configured" };
    checks.set(provider, result); return result;
  }
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" });
    const result = { provider, ok: response.ok, latencyMs: Date.now() - started, checkedAt: new Date().toISOString(), ...(response.ok ? {} : { error: `HTTP ${response.status}` }) };
    checks.set(provider, result); return result;
  } catch (error) {
    const result = { provider, ok: false, latencyMs: Date.now() - started, checkedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) };
    checks.set(provider, result); return result;
  }
}

export function getProviderHealth() { return [...checks.values()]; }
