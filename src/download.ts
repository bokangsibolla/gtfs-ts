import { unzipSync } from "fflate";
import type { GtfsFiles } from "./types.js";

const GTFS_TXT = [
  "agency",
  "stops",
  "routes",
  "trips",
  "stop_times",
  "calendar",
  "calendar_dates",
  "feed_info",
  "shapes",
  "frequencies",
];

const NEEDED = new Set(GTFS_TXT.map((f) => `${f}.txt`));

function basename(p: string): string {
  const i = p.lastIndexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}

/** Unzip a GTFS .zip buffer into a map of file name (no extension) -> CSV text. */
export function unzipGtfs(buffer: Uint8Array): GtfsFiles {
  const entries = unzipSync(buffer, { filter: (f) => NEEDED.has(basename(f.name)) });
  const dec = new TextDecoder("utf-8");
  const out: GtfsFiles = {};
  for (const [name, data] of Object.entries(entries)) {
    out[basename(name).replace(/\.txt$/i, "")] = dec.decode(data);
  }
  if (Object.keys(out).length === 0) {
    throw new Error("No GTFS .txt files found in archive (is it a valid GTFS feed?).");
  }
  return out;
}

/** Download a GTFS .zip from a URL and return its files. */
export async function downloadGtfs(url: string): Promise<GtfsFiles> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download feed (${res.status} ${res.statusText}) from ${url}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  return unzipGtfs(buf);
}
