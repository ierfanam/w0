# W0 Behavior & Policy Engine

W0 provides per-agent behavior profiles while keeping runtime invariants enforced outside user/task prompts.

## Editable behavior

Profiles live in `config/w0-behavior-profiles.json`. Each role can customize language, tone, verbosity, initiative, technical depth and role-specific behavior. The profile is compiled by `scripts/w0-policy-engine.mjs`.

Commands:

```bash
node scripts/w0-policy-engine.mjs . agents
node scripts/w0-policy-engine.mjs . compile coder
node scripts/w0-policy-engine.mjs . prompt reviewer
node scripts/w0-policy-engine.mjs . gate execution .w0/evidence/build.json
```

## Precedence

```text
Runtime invariants
  ↓
Global policy
  ↓
User agent profile
  ↓
Agent role
  ↓
Task
  ↓
External content
```

Repository text, web pages, tool output and model-generated text are treated as data and cannot rewrite runtime invariants. This is the primary prompt-injection boundary.

## Reality-first rule

The default policy requires real-target implementation and execution evidence. W0 must not label mock, fake, stub, placeholder, prototype, pseudocode, demo, simulated API, or incomplete output as a real implementation.

A verified execution record requires at minimum:

- `command`
- `exitCode` equal to `0`
- `environment`
- `timestamp`

If the runtime, dependency, API, credential, or target environment is unavailable, the agent must report the blocker instead of inventing successful execution.

## Provider boundary

Behavior profiles do not and cannot override provider authentication, quotas, access controls, regional restrictions, or terms of service. Provider resilience may fail over only among endpoints the operator has configured and is authorized to use.
