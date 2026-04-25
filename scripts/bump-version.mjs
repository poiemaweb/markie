#!/usr/bin/env node
// Sync version across package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml.
// Usage: node scripts/bump-version.mjs <new-version>
//        npm run release:bump -- 0.2.0

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];

if (!target || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(target)) {
  console.error("Usage: bump-version.mjs <semver>  e.g. 0.2.0  or  1.0.0-rc.1");
  process.exit(1);
}

const files = [
  {
    path: resolve(root, "package.json"),
    pattern: /("version"\s*:\s*")([^"]+)(")/,
    replace: (m, p1, _v, p3) => `${p1}${target}${p3}`,
  },
  {
    path: resolve(root, "src-tauri/tauri.conf.json"),
    pattern: /("version"\s*:\s*")([^"]+)(")/,
    replace: (m, p1, _v, p3) => `${p1}${target}${p3}`,
  },
  {
    path: resolve(root, "src-tauri/Cargo.toml"),
    pattern: /^(version\s*=\s*")([^"]+)(")/m,
    replace: (m, p1, _v, p3) => `${p1}${target}${p3}`,
  },
];

let failures = 0;
for (const { path, pattern, replace } of files) {
  const before = readFileSync(path, "utf8");
  const match = before.match(pattern);
  if (!match) {
    console.error(`✗ no version field matched in ${path}`);
    failures++;
    continue;
  }
  const previous = match[2];
  const after = before.replace(pattern, replace);
  writeFileSync(path, after);
  if (previous === target) {
    console.log(`= ${path} already ${target}`);
  } else {
    console.log(`✓ ${path}: ${previous} → ${target}`);
  }
}
if (failures > 0) process.exit(1);

console.log(`\nNext steps:
  git add -p
  git commit -m "chore: release v${target}"
  git tag -a v${target} -m "v${target}"
  git push && git push --tags
`);
