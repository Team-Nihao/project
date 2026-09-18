import { db } from '../db/database';
import { Building, Room, ParkingLot, Facility, CrowdZone, CampusEvent, IssueReport } from '../models/types';

export interface FusedBuilding extends Building {
  rooms: Room[];
  facilities: Facility[];
  active_events: CampusEvent[];
  active_issues: IssueReport[];
  critical_alert_count: number;
}

export interface FusedCampusState {
  timestamp: string;
  campus_vitality_score: number; // 0 to 100
  overall_occupancy_percentage: number;
  total_campus_occupancy: number;
  total_campus_capacity: number;
  free_rooms_count: number;
  total_rooms_count: number;
  open_issues_count: number;
  critical_issues_count: number;
  active_events_count: number;
  parking_available_spots: number;
  parking_total_spots: number;
  buildings: FusedBuilding[];
  parking_lots: ParkingLot[];
  facilities: Facility[];
  crowd_zones: CrowdZone[];
  events: CampusEvent[];
  issues: IssueReport[];
}

export class DataFusionService {
  public static getFusedCampusState(): FusedCampusState {
    const buildings = db.prepare('SELECT * FROM buildings').all() as Building[];
    const rooms = db.prepare('SELECT * FROM rooms').all() as Room[];
    const parkingLots = db.prepare('SELECT * FROM parking_lots').all() as ParkingLot[];
    const facilities = db.prepare('SELECT * FROM facilities').all() as Facility[];
    const crowdZones = db.prepare('SELECT * FROM crowd_zones').all() as CrowdZone[];
    const events = db.prepare('SELECT * FROM events').all() as CampusEvent[];
    const issues = db.prepare('SELECT * FROM issues').all() as IssueReport[];

    // Index rooms, facilities, events, and issues by building_id
    const roomsByBldg = new Map<string, Room[]>();
    for (const r of rooms) {
      const list = roomsByBldg.get(r.building_id) || [];
      list.push(r);
      roomsByBldg.set(r.building_id, list);
    }

    const facByBldg = new Map<string, Facility[]>();
    for (const f of facilities) {
      const list = facByBldg.get(f.building_id) || [];
      list.push(f);
      facByBldg.set(f.building_id, list);
    }

    const eventsByBldg = new Map<string, CampusEvent[]>();
    for (const e of events) {
      const list = eventsByBldg.get(e.location_id) || [];
      list.push(e);
      eventsByBldg.set(e.location_id, list);
    }

    const issuesByLocation = new Map<string, IssueReport[]>();
    for (const iss of issues) {
      const list = issuesByLocation.get(iss.location_id) || [];
      list.push(iss);
      issuesByLocation.set(iss.location_id, list);
    }

    let totalCampusOcc = 0;
    let totalCampusCap = 0;
    let freeRoomsCount = 0;

    for (const r of rooms) {
      if (r.status === 'free') freeRoomsCount++;
    }

    let parkingAvail = 0;
    let parkingTotal = 0;
    for (const p of parkingLots) {
      parkingTotal += p.total_capacity;
      parkingAvail += Math.max(0, p.total_capacity - p.current_occupied);
    }

    let openIssuesCount = 0;
    let criticalIssuesCount = 0;
    for (const i of issues) {
      if (i.status !== 'resolved') {
        openIssuesCount++;
        if (i.priority === 'critical' || i.priority === 'high') {
          criticalIssuesCount++;
        }
      }
    }

    const fusedBuildings: FusedBuilding[] = buildings.map((b) => {
      const bldgRooms = roomsByBldg.get(b.id) || [];
      const bldgFac = facByBldg.get(b.id) || [];
      const bldgEvents = eventsByBldg.get(b.id) || [];
      const bldgIssues = issuesByLocation.get(b.id) || [];

      // Also gather issues reported in rooms belonging to this building
      for (const r of bldgRooms) {
        const roomIssues = issuesByLocation.get(r.id);
        if (roomIssues) {
          bldgIssues.push(...roomIssues);
        }
      }

      const activeIssues = bldgIssues.filter((i) => i.status !== 'resolved');
      const critCount = activeIssues.filter((i) => i.priority === 'critical' || i.priority === 'high').length;

      totalCampusCap += b.total_capacity;
      totalCampusOcc += b.current_occupancy;

      return {
        ...b,
        rooms: bldgRooms,
        facilities: bldgFac,
        active_events: bldgEvents,
        active_issues: activeIssues,
        critical_alert_count: critCount
      };
    });

    const occPct = Math.round((totalCampusOcc / (totalCampusCap || 1)) * 100);

    // Compute campus vitality / operational health score (100 is optimal)
    // Penalized by congested buildings and critical issues
    let vitalityScore = 95;
    vitalityScore -= criticalIssuesCount * 7;
    vitalityScore -= Math.max(0, openIssuesCount - criticalIssuesCount) * 2;
    if (parkingAvail / (parkingTotal || 1) < 0.1) vitalityScore -= 8;
    vitalityScore = Math.max(20, Math.min(100, vitalityScore));

    return {
      timestamp: new Date().toISOString(),
      campus_vitality_score: vitalityScore,
      overall_occupancy_percentage: occPct,
      total_campus_occupancy: totalCampusOcc,
      total_campus_capacity: totalCampusCap,
      free_rooms_count: freeRoomsCount,
      total_rooms_count: rooms.length,
      open_issues_count: openIssuesCount,
      critical_issues_count: criticalIssuesCount,
      active_events_count: events.length,
      parking_available_spots: parkingAvail,
      parking_total_spots: parkingTotal,
      buildings: fusedBuildings,
      parking_lots: parkingLots,
      facilities: facilities,
      crowd_zones: crowdZones,
      events: events,
      issues: issues
    };
  }
}

