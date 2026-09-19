"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFusionService = void 0;
const database_1 = require("../db/database");
class DataFusionService {
    static getFusedCampusState() {
        const buildings = database_1.db.prepare('SELECT * FROM buildings').all();
        const rooms = database_1.db.prepare('SELECT * FROM rooms').all();
        const parkingLots = database_1.db.prepare('SELECT * FROM parking_lots').all();
        const facilities = database_1.db.prepare('SELECT * FROM facilities').all();
        const crowdZones = database_1.db.prepare('SELECT * FROM crowd_zones').all();
        const events = database_1.db.prepare('SELECT * FROM events').all();
        const issues = database_1.db.prepare('SELECT * FROM issues').all();
        // Index rooms, facilities, events, and issues by building_id
        const roomsByBldg = new Map();
        for (const r of rooms) {
            const list = roomsByBldg.get(r.building_id) || [];
            list.push(r);
            roomsByBldg.set(r.building_id, list);
        }
        const facByBldg = new Map();
        for (const f of facilities) {
            const list = facByBldg.get(f.building_id) || [];
            list.push(f);
            facByBldg.set(f.building_id, list);
        }
        const eventsByBldg = new Map();
        for (const e of events) {
            const list = eventsByBldg.get(e.location_id) || [];
            list.push(e);
            eventsByBldg.set(e.location_id, list);
        }
        const issuesByLocation = new Map();
        for (const iss of issues) {
            const list = issuesByLocation.get(iss.location_id) || [];
            list.push(iss);
            issuesByLocation.set(iss.location_id, list);
        }
        let totalCampusOcc = 0;
        let totalCampusCap = 0;
        let freeRoomsCount = 0;
        for (const r of rooms) {
            if (r.status === 'free')
                freeRoomsCount++;
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
        const fusedBuildings = buildings.map((b) => {
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
        if (parkingAvail / (parkingTotal || 1) < 0.1)
            vitalityScore -= 8;
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
exports.DataFusionService = DataFusionService;
