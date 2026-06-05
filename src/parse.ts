import { parse } from "csv-parse/sync";
import type {
  Agency,
  CalendarEntry,
  CalendarException,
  Feed,
  FeedInfo,
  GtfsFiles,
  Route,
  Stop,
  StopTime,
  Trip,
} from "./types.js";

/** Parse a single GTFS CSV file's text into row objects keyed by column name. */
export function readRows(content: string | undefined): Record<string, string>[] {
  if (!content || content.trim() === "") return [];
  return parse(content, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];
}

function num(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse a map of GTFS files (name -> CSV text) into a typed, indexed Feed. */
export function parseGtfs(files: GtfsFiles): Feed {
  const agencies: Agency[] = readRows(files["agency"]).map((r) => ({
    agency_id: r.agency_id || undefined,
    agency_name: r.agency_name,
    agency_url: r.agency_url || undefined,
    agency_timezone: r.agency_timezone || undefined,
  }));

  const stops: Stop[] = readRows(files["stops"]).map((r) => ({
    stop_id: r.stop_id,
    stop_name: r.stop_name || undefined,
    stop_lat: num(r.stop_lat),
    stop_lon: num(r.stop_lon),
    location_type: num(r.location_type),
    parent_station: r.parent_station || undefined,
  }));

  const routes: Route[] = readRows(files["routes"]).map((r) => ({
    route_id: r.route_id,
    agency_id: r.agency_id || undefined,
    route_short_name: r.route_short_name || undefined,
    route_long_name: r.route_long_name || undefined,
    route_type: num(r.route_type),
    route_color: r.route_color || undefined,
    route_text_color: r.route_text_color || undefined,
  }));

  const trips: Trip[] = readRows(files["trips"]).map((r) => ({
    trip_id: r.trip_id,
    route_id: r.route_id,
    service_id: r.service_id,
    trip_headsign: r.trip_headsign || undefined,
    direction_id: num(r.direction_id),
  }));

  const stopTimes: StopTime[] = readRows(files["stop_times"]).map((r) => ({
    trip_id: r.trip_id,
    stop_id: r.stop_id,
    arrival_time: r.arrival_time || undefined,
    departure_time: r.departure_time || undefined,
    stop_sequence: num(r.stop_sequence) ?? 0,
    pickup_type: num(r.pickup_type),
    drop_off_type: num(r.drop_off_type),
  }));

  const calendar: CalendarEntry[] = readRows(files["calendar"]).map((r) => ({
    service_id: r.service_id,
    days: [
      r.sunday === "1",
      r.monday === "1",
      r.tuesday === "1",
      r.wednesday === "1",
      r.thursday === "1",
      r.friday === "1",
      r.saturday === "1",
    ],
    start_date: r.start_date,
    end_date: r.end_date,
  }));

  const calendarDates: CalendarException[] = readRows(files["calendar_dates"]).map(
    (r) => ({
      service_id: r.service_id,
      date: r.date,
      exception_type: num(r.exception_type) ?? 0,
    })
  );

  const feedInfoRows = readRows(files["feed_info"]);
  const feedInfo: FeedInfo | undefined = feedInfoRows[0]
    ? {
        feed_publisher_name: feedInfoRows[0].feed_publisher_name || undefined,
        feed_publisher_url: feedInfoRows[0].feed_publisher_url || undefined,
        feed_lang: feedInfoRows[0].feed_lang || undefined,
        feed_start_date: feedInfoRows[0].feed_start_date || undefined,
        feed_end_date: feedInfoRows[0].feed_end_date || undefined,
        feed_version: feedInfoRows[0].feed_version || undefined,
      }
    : undefined;

  return {
    agencies,
    stops,
    routes,
    trips,
    stopTimes,
    calendar,
    calendarDates,
    feedInfo,
    stopById: new Map(stops.map((s) => [s.stop_id, s])),
    routeById: new Map(routes.map((r) => [r.route_id, r])),
    tripById: new Map(trips.map((t) => [t.trip_id, t])),
  };
}
