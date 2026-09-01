import type { ProjectSnapshot } from "./types";

export interface ProjectFileInfo {
  path: string;
  extension: string;
  lines: number;
  imports: string[];
  exports: string[];
}

export interface ProjectIntelligence {
  snapshot: ProjectSnapshot;
  files: ProjectFileInfo[];
  dependencies: Record<string, string[]>;
  entrypoints: string[];
  hotspots: string[];
}

const IMPORT_RE = /(?:import\s+(?:[^'\"]+?\s+from\s+)?|export\s+[^'\"]+?\s+from\s+|require\()(['\"])([^'\"]+)\1/g;
const EXPORT_RE = /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;

function extension(path: string) { return path.includes(".") ? path.split(".").pop()!.toLowerCase() : ""; }
function importsOf(content: string) { return [...content.matchAll(IMPORT_RE)].map(m => m[2]); }
function exportsOf(content: string) { return [...content.matchAll(EXPORT_RE)].map(m => m[1]); }

export function analyzeProject(name: string, files: Record<string, string>): ProjectIntelligence {
  const infos: ProjectFileInfo[] = Object.entries(files).map(([path, content]) => ({
    path, extension: extension(path), lines: content.split(/\r?\n/).length,
    imports: importsOf(content), exports: exportsOf(content),
  }));
  const dependencies: Record<string, string[]> = {};
  for (const info of infos) dependencies[info.path] = info.imports;
  const entrypoints = infos.filter(f => /(^|\/)(page|layout|route|index|main|App)\.(tsx?|jsx?)$/.test(f.path)).map(f => f.path);
  const hotspots = [...infos].sort((a,b) => (b.lines + b.imports.length * 10) - (a.lines + a.imports.length * 10)).slice(0, 12).map(f => f.path);
  const snapshot: ProjectSnapshot = { name, files, summary: `${infos.length} فایل، ${infos.reduce((n,f) => n + f.lines, 0)} خط؛ ورودی‌ها: ${entrypoints.length}` };
  return { snapshot, files: infos, dependencies, entrypoints, hotspots };
}

export function buildContextPack(intel: ProjectIntelligence, maxFiles = 24): string {
  const selected = [...intel.files].sort((a,b) => {
    const score = (f: ProjectFileInfo) => (intel.entrypoints.includes(f.path) ? 1000 : 0) + f.imports.length * 10 + f.lines;
    return score(b) - score(a);
  }).slice(0, maxFiles);
  return [
    `Project: ${intel.snapshot.name}`,
    `Summary: ${intel.snapshot.summary}`,
    `Entrypoints: ${intel.entrypoints.join(", ") || "none"}`,
    `Hotspots: ${intel.hotspots.join(", ")}`,
    "Files:",
    ...selected.map(f => `- ${f.path} (${f.lines} lines) imports=[${f.imports.join(", ")}] exports=[${f.exports.join(", ")}]`),
  ].join("\n");
}
