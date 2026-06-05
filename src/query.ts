import type { Feed } from "./types.js";

/** Day of week for a YYYYMMDD date, 0 = Sunday .. 6 = Saturday. */
export function dayOfWeek(date: string): number {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(4, 6));
  const d = Number(date.slice(6, 8));
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Resolve the set of service_ids running on a given YYYYMMDD date. */
export function activeServiceIds(feed: Feed, date: string): Set<string> {
  const dow = dayOfWeek(date);
  const active = new Set<string>();
  for (const c of feed.calendar) {
    if (date >= c.start_date && date <= c.end_date && c.days[dow]) {
      active.add(c.service_id);
    }
  }
  for (const e of feed.calendarDates) {
    if (e.date !== date) continue;
    if (e.exception_type === 1) active.add(e.service_id);
    else if (e.exception_type === 2) active.delete(e.service_id);
  }
  return active;
}

/** Convert a GTFS time (HH:MM:SS, HH may be >= 24) to seconds past midnight. */
export function gtfsTimeToSeconds(t: string | undefined): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length !== 3) return null;
  const [h, m, s] = parts.map(Number);
  if (![h, m, s].every(Number.isFinite)) return null;
  return h * 3600 + m * 60 + s;
}

export function routeTypeLabel(t?: number): string {
  if (t === undefined) return "unknown";
  const map: Record<number, string> = {
    0: "tram",
    1: "subway",
    2: "rail",
    3: "bus",
    4: "ferry",
    5: "cable tram",
    6: "aerial lift",
    7: "funicular",
    11: "trolleybus",
    12: "monorail",
  };
  return map[t] ?? `type ${t}`;
}

export function findStops(feed: Feed, query: string, limit = 20) {
  const q = query.toLowerCase().trim();
  const out: { stop_id: string; stop_name?: string; lat?: number; lon?: number }[] = [];
  for (const s of feed.stops) {
    if ((s.stop_name ?? "").toLowerCase().includes(q)) {
      out.push({ stop_id: s.stop_id, stop_name: s.stop_name, lat: s.stop_lat, lon: s.stop_lon });
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function listRoutes(feed: Feed, limit = 50) {
  return feed.routes.slice(0, limit).map((r) => ({
    route_id: r.route_id,
    short_name: r.route_short_name,
    long_name: r.route_long_name,
    mode: routeTypeLabel(r.route_type),
  }));
}

export interface DepartureResult {
  departure_time: string;
  seconds: number;
  route?: string;
  headsign?: string;
  trip_id: string;
}

export function nextDepartures(
  feed: Feed,
  opts: { stopId: string; date?: string; afterSeconds?: number; limit?: number }
): DepartureResult[] {
  const limit = opts.limit ?? 10;
  const serviceIds = opts.date ? activeServiceIds(feed, opts.date) : null;
  const out: DepartureResult[] = [];
  for (const st of feed.stopTimes) {
    if (st.stop_id !== opts.stopId) continue;
    const dep = st.departure_time ?? st.arrival_time;
    const secs = gtfsTimeToSeconds(dep);
    if (secs === null) continue;
    if (opts.afterSeconds !== undefined && secs < opts.afterSeconds) continue;
    const trip = feed.tripById.get(st.trip_id);
    if (!trip) continue;
    if (serviceIds && !serviceIds.has(trip.service_id)) continue;
    const route = feed.routeById.get(trip.route_id);
    out.push({
      departure_time: dep as string,
      seconds: secs,
      route: route
        ? route.route_short_name || route.route_long_name || route.route_id
        : trip.route_id,
      headsign: trip.trip_headsign,
      trip_id: st.trip_id,
    });
  }
  out.sort((a, b) => a.seconds - b.seconds);
  return out.slice(0, limit);
}

export function summarizeFeed(feed: Feed) {
  const modes: Record<string, number> = {};
  for (const r of feed.routes) {
    const label = routeTypeLabel(r.route_type);
    modes[label] = (modes[label] ?? 0) + 1;
  }
  const dates = [
    ...feed.calendar.flatMap((c) => [c.start_date, c.end_date]),
    ...feed.calendarDates.map((d) => d.date),
  ]
    .filter(Boolean)
    .sort();
  return {
    agencies: feed.agencies.map((a) => a.agency_name),
    counts: {
      routes: feed.routes.length,
      stops: feed.stops.length,
      trips: feed.trips.length,
      stop_times: feed.stopTimes.length,
    },
    modes,
    service_range: dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null,
  };
}
