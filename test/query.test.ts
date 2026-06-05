import { describe, it, expect } from "vitest";
import { parseGtfs } from "../src/parse";
import {
  findStops,
  listRoutes,
  summarizeFeed,
  activeServiceIds,
  nextDepartures,
  gtfsTimeToSeconds,
  dayOfWeek,
} from "../src/query";
import { validFiles } from "./fixtures";

const feed = parseGtfs(validFiles);

describe("findStops", () => {
  it("matches names case-insensitively and respects the limit", () => {
    expect(findStops(feed, "square")[0].stop_id).toBe("S2");
    expect(findStops(feed, "s", 1)).toHaveLength(1);
  });
});

describe("listRoutes / summarizeFeed", () => {
  it("labels modes and summarizes counts", () => {
    expect(listRoutes(feed)[0].mode).toBe("bus");
    const s = summarizeFeed(feed);
    expect(s.counts.stops).toBe(3);
    expect(s.modes).toEqual({ bus: 2 });
    expect(s.service_range).toEqual({ start: "20260101", end: "20261231" });
  });
});

describe("dayOfWeek / activeServiceIds", () => {
  it("computes weekdays and active services", () => {
    expect(dayOfWeek("20260106")).toBe(2); // Tuesday
    const tue = activeServiceIds(feed, "20260106");
    expect(tue.has("WKDY")).toBe(true);
    expect(tue.has("SAT")).toBe(false);
    // 20260101 is a Thursday but WKDY is removed by calendar_dates.
    expect(activeServiceIds(feed, "20260101").has("WKDY")).toBe(false);
  });
});

describe("gtfsTimeToSeconds / nextDepartures", () => {
  it("handles after-midnight times", () => {
    expect(gtfsTimeToSeconds("25:30:00")).toBe(91800);
    expect(gtfsTimeToSeconds("bad")).toBeNull();
  });

  it("returns sorted weekday departures, excluding other services", () => {
    const deps = nextDepartures(feed, { stopId: "S1", date: "20260106" });
    expect(deps.map((d) => d.departure_time)).toEqual([
      "08:00:00",
      "08:30:00",
      "09:00:00",
    ]);
    expect(deps[0].route).toBe("1");
  });
});
