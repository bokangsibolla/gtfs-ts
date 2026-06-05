#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { downloadGtfs, unzipGtfs } from "./download.js";
import { parseGtfs } from "./parse.js";
import { validateGtfs } from "./validate.js";
import { summarizeFeed } from "./query.js";
import type { GtfsFiles } from "./types.js";

async function loadFiles(src: string): Promise<GtfsFiles> {
  if (/^https?:\/\//i.test(src)) return downloadGtfs(src);
  return unzipGtfs(new Uint8Array(readFileSync(src)));
}

function usage(): never {
  console.error(`gtfs-ts - parse, query, and validate GTFS feeds

Usage:
  gtfs-ts validate  <feed.zip | https://...>
  gtfs-ts summarize <feed.zip | https://...>
`);
  process.exit(2);
}

const [cmd, src] = process.argv.slice(2);
if (!cmd || !src) usage();

const files = await loadFiles(src);

if (cmd === "validate") {
  const result = validateGtfs(files);
  for (const issue of result.issues) {
    const where = issue.row ? `${issue.file}:${issue.row}` : issue.file || "-";
    const ctx = issue.context ? ` (${issue.context})` : "";
    console.log(
      `${issue.severity.toUpperCase().padEnd(7)} ${where}  ${issue.message}${ctx}  [${issue.code}]`
    );
  }
  console.log(`\n${result.errorCount} error(s), ${result.warningCount} warning(s).`);
  process.exit(result.ok ? 0 : 1);
} else if (cmd === "summarize") {
  console.log(JSON.stringify(summarizeFeed(parseGtfs(files)), null, 2));
  process.exit(0);
} else {
  usage();
}
