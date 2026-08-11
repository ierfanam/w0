# W0 Provider Resilience

W0 now supports compliant multi-provider resilience. The router ranks configured providers by capability and health, retries transient failures, applies cooldowns, and fails over to another configured endpoint.

## Important boundary

This subsystem does **not** bypass provider authentication, quotas, regional restrictions, terms of service, rate limits, or access controls. A 401/403/configuration failure is treated as non-retryable. A transient 408/409/425/429/5xx failure may trigger failover to another provider that the operator has configured and is authorized to use.

## Configuration

Copy `.w0/providers.json` and set endpoint/API-key environment variables as appropriate. Do not commit secrets.

## Runtime

```bash
node scripts/w0-provider-router.mjs . health
node scripts/w0-provider-router.mjs . route payload.json coding reasoning
```

The router writes health state to `.w0/provider-health.json` and maintains a score/cooldown per provider.
