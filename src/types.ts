/** Core GTFS entity types and the parsed Feed shape. */

export interface Agency {
  agency_id?: string;
  agency_name: string;
  agency_url?: string;
  agency_timezone?: string;
}

export interface Stop {
  stop_id: string;
  stop_name?: string;
  stop_lat?: number;
  stop_lon?: number;
  location_type?: number;
  parent_station?: string;
}

export interface Route {
  route_id: string;
  agency_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_type?: number;
  route_color?: string;
  route_text_color?: string;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  direction_id?: number;
}

export interface StopTime {
  trip_id: string;
  stop_id: string;
  arrival_time?: string;
  departure_time?: string;
  stop_sequence: number;
  pickup_type?: number;
  drop_off_type?: number;
}

/** days[0] = Sunday .. days[6] = Saturday, matching JS Date.getUTCDay(). */
export interface CalendarEntry {
  service_id: string;
  days: boolean[];
  start_date: string;
  end_date: string;
}

export interface CalendarException {
  service_id: string;
  date: string;
  exception_type: number; // 1 = added, 2 = removed
}

export interface FeedInfo {
  feed_publisher_name?: string;
  feed_publisher_url?: string;
  feed_lang?: string;
  feed_start_date?: string;
  feed_end_date?: string;
  feed_version?: string;
}

export interface Feed {
  agencies: Agency[];
  stops: Stop[];
  routes: Route[];
  trips: Trip[];
  stopTimes: StopTime[];
  calendar: CalendarEntry[];
  calendarDates: CalendarException[];
  feedInfo?: FeedInfo;
  stopById: Map<string, Stop>;
  routeById: Map<string, Route>;
  tripById: Map<string, Trip>;
}

/** A raw map of GTFS file name (without the .txt extension) to its CSV text. */
export type GtfsFiles = Record<string, string>;

export type Severity = "error" | "warning";

export interface ValidationIssue {
  severity: Severity;
  code: string;
  file: string;
  message: string;
  /** 1-based data row (excludes the header), when the issue is row-specific. */
  row?: number;
  context?: string;
}

export interface ValidationResult {
  ok: boolean;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}
