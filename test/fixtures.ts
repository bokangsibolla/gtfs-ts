import type { GtfsFiles } from "../src/types";

/** A small, valid GTFS feed used across the parse/query tests. */
export const validFiles: GtfsFiles = {
  agency: `agency_id,agency_name,agency_url,agency_timezone
DEMO,Demo Transit,https://example.com,America/New_York`,
  stops: `stop_id,stop_name,stop_lat,stop_lon
S1,Central Station,40.0,-74.0
S2,North Square,40.1,-74.0
S3,South Market,39.9,-74.0`,
  routes: `route_id,agency_id,route_short_name,route_long_name,route_type
R1,DEMO,1,Central to North,3
R2,DEMO,2,Central to South,3`,
  trips: `route_id,service_id,trip_id,trip_headsign
R1,WKDY,T1,North Square
R1,WKDY,T2,North Square
R2,WKDY,T3,South Market
R1,SAT,T4,North Square`,
  stop_times: `trip_id,arrival_time,departure_time,stop_id,stop_sequence
T1,08:00:00,08:00:00,S1,1
T1,08:10:00,08:10:00,S2,2
T2,09:00:00,09:00:00,S1,1
T2,09:10:00,09:10:00,S2,2
T3,08:30:00,08:30:00,S1,1
T3,08:45:00,08:45:00,S3,2
T4,10:00:00,10:00:00,S1,1
T4,10:10:00,10:10:00,S2,2`,
  calendar: `service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
WKDY,1,1,1,1,1,0,0,20260101,20261231
SAT,0,0,0,0,0,1,0,20260101,20261231`,
  calendar_dates: `service_id,date,exception_type
WKDY,20260101,2`,
};
