# gtfs-ts

A modern TypeScript library to parse, query, and validate GTFS public-transit feeds.

> **GTFS** (General Transit Feed Specification) is the open format most public-transport agencies publish their routes, stops, and timetables in.

The reference GTFS validator is written in Java. `gtfs-ts` brings parsing, querying, and a practical validator to TypeScript and Node, with no native dependencies, so the same feed logic runs in your build scripts, your backend, and your tests.

## Install

```bash
npm install gtfs-ts
```

Requires Node 20 or newer.

## Use as a library

```ts
import { downloadGtfs, parseGtfs, validateGtfs, nextDepartures, findStops } from "gtfs-ts";

// Download + unzip a feed (or pass your own map of file name -> CSV text).
const files = await downloadGtfs("https://example.com/feed.zip");

// Validate it.
const result = validateGtfs(files);
console.log(`${result.errorCount} errors, ${result.warningCount} warnings`);
for (const issue of result.issues) {
  console.log(`${issue.severity} ${issue.file} ${issue.message} [${issue.code}]`);
}

// Parse it into typed, indexed records and query it.
const feed = parseGtfs(files);
const stop = findStops(feed, "Central")[0];
const departures = nextDepartures(feed, { stopId: stop.stop_id, date: "20260706", limit: 5 });
```

Every parser and query function is pure and synchronous (the only I/O is `downloadGtfs`), so they are easy to test and safe to run anywhere.

## Use as a CLI

```bash
# Validate a feed (exits non-zero if there are errors).
npx gtfs-ts validate https://example.com/feed.zip
npx gtfs-ts validate ./local-feed.zip

# Summarize a feed.
npx gtfs-ts summarize https://example.com/feed.zip
```

## What the validator checks

A practical subset of the GTFS reference rules and the kinds of checks MobilityData's `gtfs-validator` performs, each reported with a severity (`error` or `warning`), a stable `code`, the file, and the row:

- **Required files**: agency, stops, routes, trips, stop_times, and calendar or calendar_dates.
- **Required fields**, including conditional ones (agency_id when there are multiple agencies; stop_name and coordinates by location_type; a route needs a short or long name).
- **Primary keys**: duplicate stop_id, route_id, trip_id, agency_id, and the composite (trip_id, stop_sequence).
- **Referential integrity**: trips to routes and services, stop_times to trips and stops, routes to agencies, parent_station to stops.
- **Enums**: route_type (basic and the extended 100 to 1799 range), exception_type, location_type, pickup/drop_off type, direction_id, and calendar day flags.
- **Formats**: coordinate ranges, YYYYMMDD dates (including end-before-start), HH:MM:SS times (including after-midnight times past 24:00:00), and 6-digit hex colors.
- **Semantics**: trips with fewer than two stops, and stop_sequence that does not strictly increase.

## Roadmap

- More semantic checks (travel-speed sanity, shapes vs stops, service-window expiry)
- shapes.txt, frequencies.txt, fares, and pathways
- GTFS-Realtime parsing
- Power the [gtfs-mcp](https://github.com/bokangsibolla/gtfs-mcp) server from this library

## Contributing

Issues labelled `good first issue` are a good place to start. Run `npm test` before opening a pull request.

## License

MIT © Bokang Sibolla

Aligned with the open specification and validator rules maintained by [MobilityData](https://github.com/MobilityData).
