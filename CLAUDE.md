# gtfs-ts

> Modern TypeScript (ESM) library and CLI to parse, query, and validate GTFS public-transit feeds. For developers who need feed logic in build scripts, backends, and tests without native dependencies. GTFS (General Transit Feed Specification) is the open format transit agencies publish routes, stops, and timetables in.

## Status

active-dev · open source (GitHub bokangsibolla/gtfs-ts) · v0.1.0, NOT yet published to npm · last meaningful update 2026-06-05

## Stack

TypeScript 5.5 (ESM, Node 20+) · runtime deps: csv-parse (CSV reader) + fflate (zip handling) · no native deps · vitest for tests · tsx for local CLI dev · tsc for build

## Structure

- `src/index.ts` — public library entry, re-exports the API (downloadGtfs, parseGtfs, validateGtfs, nextDepartures, findStops, etc.)
- `src/cli.ts` — CLI entry, exposed as the `gtfs-ts` bin (validate, summarize)
- `src/download.ts` — the only I/O: download and unzip a feed to a map of file name to CSV text
- `src/parse.ts` — parse raw files into typed, indexed records
- `src/query.ts` — pure query helpers (next departures, find stops)
- `src/validate.ts` — practical validator: required files/fields, primary keys, referential integrity, enums, formats, semantics
- `src/types.ts` — GTFS record and result types
- `test/` — vitest specs (parse, query, validate) plus `fixtures.ts`
- `dist/` — tsc build output (gitignored, also the published files)

## Commands

```bash
# dev (run the CLI from source against a feed)
npm run dev -- validate ./local-feed.zip
npm run dev -- summarize https://example.com/feed.zip

# test
npm test          # vitest run

# build
npm run build     # tsc -> dist/

# publish to npm (not yet done; runs build first via prepublishOnly)
npm publish
```

## Verification

Run before claiming a change is done, and show the passing output:

```bash
npm run build && npm test
```

## Conventions

- Every parser and query function is pure and synchronous. The only I/O is `downloadGtfs`. Keep it that way: new logic stays pure and testable, with downloading isolated to `download.ts`.
- No native dependencies. Anything new must run unchanged in build scripts, backend, and tests.
- Validator issues carry a stable `code`, a `severity` (`error` or `warning`), the file, and the row. Do not change existing codes; they are an API surface.
- Validator scope is a practical subset aligned with MobilityData's reference rules. See README "What the validator checks" and "Roadmap" before adding checks.
- `npm test` must pass before any pull request.

## Gotchas

- ESM only (`"type": "module"`). No CommonJS build; importers must support ESM.
- `dist/` is gitignored but is what ships (see `files` in package.json). The `prepare` and `prepublishOnly` scripts rebuild it, so never publish without a fresh build.
- Not on npm yet, so `npm install gtfs-ts` will fail until first publish. Consumers (including the gtfs-mcp server) currently need a local link or git install.
- The CLI `validate` command exits non-zero when a feed has errors. Account for this in CI and scripts.

## Related

- Memory: [[project_github_oss_strategy]]
- Powers the gtfs-mcp server: https://github.com/bokangsibolla/gtfs-mcp
- Repo: https://github.com/bokangsibolla/gtfs-ts
- Spec and reference validator: https://github.com/MobilityData
