import { describe, it, expect } from "vitest";
import { parseGtfs } from "../src/parse";
import { validFiles } from "./fixtures";

const feed = parseGtfs(validFiles);

describe("parseGtfs", () => {
  it("parses each file into typed records with the right counts", () => {
    expect(feed.agencies).toHaveLength(1);
    expect(feed.stops).toHaveLength(3);
    expect(feed.routes).toHaveLength(2);
    expect(feed.trips).toHaveLength(4);
    expect(feed.stopTimes).toHaveLength(8);
    expect(feed.calendar).toHaveLength(2);
    expect(feed.calendarDates).toHaveLength(1);
  });

  it("coerces numeric fields and builds indexes", () => {
    expect(feed.stopById.get("S1")?.stop_lat).toBe(40.0);
    expect(feed.routeById.get("R1")?.route_type).toBe(3);
    expect(feed.tripById.get("T1")?.service_id).toBe("WKDY");
  });

  it("maps calendar weekday flags (index 0 = Sunday)", () => {
    const wkdy = feed.calendar.find((c) => c.service_id === "WKDY")!;
    expect(wkdy.days[0]).toBe(false); // Sunday
    expect(wkdy.days[1]).toBe(true); // Monday
    expect(wkdy.days[6]).toBe(false); // Saturday
  });
});
