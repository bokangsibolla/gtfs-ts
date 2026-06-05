import { describe, it, expect } from "vitest";
import { validateGtfs } from "../src/validate";
import { validFiles } from "./fixtures";
import type { GtfsFiles } from "../src/types";

describe("validateGtfs on a valid feed", () => {
  const result = validateGtfs(validFiles);

  it("passes with no errors or warnings", () => {
    expect(result.ok).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });
});

describe("validateGtfs flags missing required files", () => {
  it("reports each missing core file and the missing calendar", () => {
    const result = validateGtfs({});
    const codes = result.issues.map((i) => i.code);
    expect(codes).toContain("missing_required_file");
    expect(codes).toContain("missing_calendar");
    expect(result.ok).toBe(false);
  });
});

// A feed with one deliberate defect of each major kind.
const broken: GtfsFiles = {
  agency: `agency_id,agency_name,agency_url,agency_timezone
DEMO,Demo Transit,https://example.com,America/New_York`,
  stops: `stop_id,stop_name,stop_lat,stop_lon
S1,Central,40.0,-74.0
S1,Duplicate,40.0,-74.0
S2,,200,-74.0`,
  routes: `route_id,route_short_name,route_long_name,route_type,route_color
R1,1,One,3,ZZZZZZ
R2,,,3
R3,3,Three,5000`,
  trips: `route_id,service_id,trip_id
R1,WKDY,T1
RX,WKDY,T2
R1,SVCX,T3`,
  stop_times: `trip_id,arrival_time,departure_time,stop_id,stop_sequence
T1,08:00:00,08:00:00,S1,1
T1,99:99:99,08:10:00,S2,2
TX,08:00:00,08:00:00,S1,1
T2,08:00:00,08:00:00,SX,1`,
  calendar: `service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
WKDY,1,1,1,1,1,0,2,20260101,20261231`,
  calendar_dates: `service_id,date,exception_type
WKDY,20261301,1
WKDY,20260101,5`,
};

describe("validateGtfs on a broken feed", () => {
  const result = validateGtfs(broken);
  const codes = new Set(result.issues.map((i) => i.code));

  it("is not ok and has both errors and warnings", () => {
    expect(result.ok).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.warningCount).toBeGreaterThan(0);
  });

  it.each([
    ["duplicate_id"],
    ["stop_missing_name"],
    ["invalid_coordinate"],
    ["route_missing_name"],
    ["unknown_reference"],
    ["invalid_time"],
    ["invalid_enum"],
    ["invalid_date"],
  ])("detects %s", (code) => {
    expect(codes).toContain(code);
  });

  it.each([["invalid_color"], ["uncommon_route_type"]])(
    "raises warning %s",
    (code) => {
      expect(codes).toContain(code);
    }
  );

  it("catches the unknown route, service, trip, and stop references", () => {
    const refs = result.issues.filter((i) => i.code === "unknown_reference");
    const messages = refs.map((r) => r.message).join(" | ");
    expect(messages).toContain("RX"); // unknown route
    expect(messages).toContain("SVCX"); // unknown service
    expect(messages).toContain("TX"); // unknown trip
    expect(messages).toContain("SX"); // unknown stop
  });
});

describe("validateGtfs canon-aligned rules", () => {
  function codesFor(files: GtfsFiles): Set<string> {
    return new Set(validateGtfs(files).issues.map((i) => i.code));
  }

  it("accepts extended (HVT 100-1799) route_type values without warning", () => {
    const codes = codesFor({
      ...validFiles,
      routes: `route_id,agency_id,route_short_name,route_long_name,route_type
R1,DEMO,1,Central to North,700
R2,DEMO,2,Central to South,109`,
    });
    expect(codes.has("uncommon_route_type")).toBe(false);
  });

  it("flags a duplicate (trip_id, stop_sequence)", () => {
    const codes = codesFor({
      ...validFiles,
      stop_times: `trip_id,arrival_time,departure_time,stop_id,stop_sequence
T1,08:00:00,08:00:00,S1,1
T1,08:10:00,08:10:00,S2,1`,
    });
    expect(codes.has("duplicate_stop_sequence")).toBe(true);
  });

  it("flags an end_date before start_date", () => {
    const codes = codesFor({
      ...validFiles,
      calendar: `service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
WKDY,1,1,1,1,1,0,0,20261231,20260101
SAT,0,0,0,0,0,1,0,20260101,20261231`,
    });
    expect(codes.has("invalid_date_range")).toBe(true);
  });
});
