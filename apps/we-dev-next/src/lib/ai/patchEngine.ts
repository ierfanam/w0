export interface FilePatch { path: string; content: string; expectedSha?: string; reason?: string; }
export interface PatchResult { path: string; applied: boolean; error?: string; }

/** Pure patch validation/apply primitives. The host executor must perform the actual filesystem write. */
export function validatePatch(patch: FilePatch): string | null {
  if (!patch.path || patch.path.startsWith("/") || patch.path.includes("..")) return "مسیر فایل نامعتبر است.";
  if (!patch.content && patch.content !== "") return "محتوای فایل نامعتبر است.";
  return null;
}

export function validatePatchSet(patches: FilePatch[]) {
  const seen = new Set<string>();
  return patches.map(p => {
    const error = seen.has(p.path) ? "مسیر تکراری در مجموعه patch." : validatePatch(p);
    seen.add(p.path);
    return { patch: p, valid: !error, error: error || undefined };
  });
}

export function buildUnifiedIntent(patches: FilePatch[]) {
  return patches.map(p => ({ path: p.path, reason: p.reason || "AI-generated change", bytes: Buffer.byteLength(p.content, "utf8") }));
}
