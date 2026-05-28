import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const scanRoots = ["src", "infra/docker-compose.app.yml", "infra/bradox-revenda.env.example"];

const bannedPatterns = [
  /network_hub/gi,
  /network-hub/gi,
  /legacy\s*endpoint/gi,
  /legacy\s*api/gi,
  /legacy\s*schema/gi,
];

const allowList = new Set([
  "src/integrations/supabase/types.ts",
]);

const findings = [];

for (const root of scanRoots) {
  const absolute = join(repoRoot, root);
  if (!exists(absolute)) continue;
  if (statSync(absolute).isDirectory()) {
    walkDir(absolute);
  } else {
    scanFile(absolute);
  }
}

if (findings.length > 0) {
  console.error("[guard:no-legacy-runtime] Referencias ao legado encontradas em runtime:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} -> ${finding.text}`);
  }
  process.exit(1);
}

console.log("[guard:no-legacy-runtime] OK - sem dependencia runtime do legado.");

function walkDir(dir) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const fileStat = statSync(fullPath);
    if (fileStat.isDirectory()) {
      walkDir(fullPath);
      continue;
    }
    scanFile(fullPath);
  }
}

function scanFile(filePath) {
  const rel = normalize(relative(repoRoot, filePath));
  if (allowList.has(rel)) return;

  if (!isTextSource(rel)) return;

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of bannedPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        findings.push({
          file: rel,
          line: i + 1,
          text: line.trim().slice(0, 180),
        });
      }
    }
  }
}

function isTextSource(relPath) {
  return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".yml", ".yaml", ".env", ".md"].some((ext) => relPath.endsWith(ext));
}

function normalize(value) {
  return value.replace(/\\/g, "/");
}

function exists(path) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}
