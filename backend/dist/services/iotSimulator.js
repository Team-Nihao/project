"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IoTSimulator = void 0;
const database_1 = require("../db/database");
class IoTSimulator {
    io;
    intervalId = null;
    tickCount = 0;
    intervalMs = 3000;
    isPaused = false;
    activeScenario = 'normal'; // 'normal' | 'lunch_rush' | 'class_change' | 'evacuation' | 'night_study'
    constructor(io) {
        this.io = io;
    }
    start() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        console.log(`[IoT Engine] Starting telemetry generator (interval: ${this.intervalMs}ms)...`);
        this.intervalId = setInterval(() => this.tick(), this.intervalMs);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    setPaused(paused) {
        this.isPaused = paused;
        console.log(`[IoT Engine] Simulation paused state set to: ${paused}`);
    }
    setSpeed(speed) {
        // speed multiplier: 1x -> 3000ms, 2x -> 1500ms, 5x -> 600ms
        const base = 3000;
        this.intervalMs = Math.max(500, Math.floor(base / speed));
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => this.tick(), this.intervalMs);
        }
        console.log(`[IoT Engine] Simulation speed adjusted. Interval: ${this.intervalMs}ms`);
    }
    setScenario(scenario) {
        this.activeScenario = scenario;
        console.log(`[IoT Engine] Scenario triggered: ${scenario}`);
        // Immediately execute a tick to reflect scenario
        this.tick();
    }
    getStatus() {
        return {
            isPaused: this.isPaused,
            intervalMs: this.intervalMs,
            scenario: this.activeScenario,
            tickCount: this.tickCount
        };
    }
    tick() {
        if (this.isPaused)
            return;
        this.tickCount++;
        const now = new Date();
        const timestamp = now.toISOString();
        const recentReadings = [];
        // 1. Update Rooms
        const rooms = database_1.db.prepare('SELECT * FROM rooms').all();
        const roomUpdates = [];
        const updateRoomStmt = database_1.db.prepare(`
      UPDATE rooms 
      SET current_occupancy = @current_occupancy, status = @status, last_updated = @last_updated 
      WHERE id = @id
    `);
        for (const room of rooms) {
            let newOcc = room.current_occupancy;
            let newStatus = room.status;
            if (this.activeScenario === 'evacuation') {
                newOcc = 0;
                newStatus = 'free';
            }
            else if (this.activeScenario === 'class_change') {
                // High volatility
                const delta = Math.floor(Math.random() * 25) - 12;
                newOcc = Math.max(0, Math.min(room.capacity, newOcc + delta));
                newStatus = newOcc > 5 ? 'occupied' : 'free';
            }
            else {
                // Normal drift with occasional state flip
                if (room.status === 'occupied') {
                    const delta = Math.floor(Math.random() * 7) - 3;
                    newOcc = Math.max(0, Math.min(room.capacity, newOcc + delta));
                    if (newOcc <= 2 && Math.random() < 0.15) {
                        newStatus = 'free';
                        newOcc = 0;
                    }
                }
                else if (room.status === 'free') {
                    if (Math.random() < 0.1) {
                        newStatus = 'occupied';
                        newOcc = Math.floor(room.capacity * (0.4 + Math.random() * 0.4));
                    }
                    else {
                        newOcc = Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0;
                    }
                }
                else if (room.status === 'scheduled') {
                    if (Math.random() < 0.2) {
                        newStatus = 'occupied';
                        newOcc = Math.floor(room.capacity * 0.75);
                    }
                }
            }
            let nextAvail = room.next_available_time;
            if (newStatus === 'free') {
                nextAvail = 'Now';
            }
            else if (nextAvail === 'Now') {
                nextAvail = 'In 45 mins';
            }
            updateRoomStmt.run({
                id: room.id,
                current_occupancy: newOcc,
                status: newStatus,
                last_updated: timestamp
            });
            roomUpdates.push({
                id: room.id,
                current_occupancy: newOcc,
                status: newStatus,
                next_available_time: nextAvail
            });
            // Sample a subset of telemetry readings to avoid log bloat
            if (Math.random() < 0.25) {
                const quality = Math.random() < 0.04 ? 'noisy' : 'good';
                recentReadings.push({
                    sensor_id: room.sensor_id,
                    sensor_type: 'occupancy',
                    source_ref: room.id,
                    value: newOcc,
                    timestamp,
                    quality
                });
            }
        }
        // 2. Update Parking Lots
        const parkingLots = database_1.db.prepare('SELECT * FROM parking_lots').all();
        const parkingUpdates = [];
        const updateParkingStmt = database_1.db.prepare(`
      UPDATE parking_lots 
      SET current_occupied = @current_occupied, status = @status, ev_occupied = @ev_occupied 
      WHERE id = @id
    `);
        for (const lot of parkingLots) {
            let delta = Math.floor(Math.random() * 5) - 2; // -2 to +2 cars
            if (this.activeScenario === 'evacuation') {
                delta = -10;
            }
            else if (this.activeScenario === 'lunch_rush' && lot.id === 'park-block34') {
                delta = 4;
            }
            let newOcc = Math.max(0, Math.min(lot.total_capacity, lot.current_occupied + delta));
            const ratio = newOcc / lot.total_capacity;
            let status = 'available';
            if (ratio >= 0.95)
                status = 'full';
            else if (ratio >= 0.8)
                status = 'filling';
            let evDelta = Math.random() < 0.2 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            let newEv = Math.max(0, Math.min(lot.ev_charging_spots, lot.ev_occupied + evDelta));
            updateParkingStmt.run({
                id: lot.id,
                current_occupied: newOcc,
                status,
                ev_occupied: newEv
            });
            parkingUpdates.push({
                id: lot.id,
                current_occupied: newOcc,
                status,
                ev_occupied: newEv
            });
            recentReadings.push({
                sensor_id: lot.sensor_id,
                sensor_type: 'parking',
                source_ref: lot.id,
                value: newOcc,
                timestamp,
                quality: 'good'
            });
        }
        // 3. Update Facilities
        const facilities = database_1.db.prepare('SELECT * FROM facilities').all();
        const facilityUpdates = [];
        const updateFacilityStmt = database_1.db.prepare(`
      UPDATE facilities 
      SET current_occupancy = @current_occupancy, status = @status 
      WHERE id = @id
    `);
        for (const fac of facilities) {
            let delta = Math.floor(Math.random() * 9) - 4;
            if (this.activeScenario === 'lunch_rush' && fac.id === 'fac-canteen') {
                delta = 15;
            }
            else if (this.activeScenario === 'night_study' && fac.id === 'fac-lib') {
                delta = 12;
            }
            else if (this.activeScenario === 'evacuation') {
                delta = -30;
            }
            let newOcc = Math.max(0, Math.min(fac.capacity, fac.current_occupancy + delta));
            const ratio = newOcc / fac.capacity;
            let status = 'open';
            if (ratio >= 0.85)
                status = 'crowded';
            updateFacilityStmt.run({
                id: fac.id,
                current_occupancy: newOcc,
                status
            });
            facilityUpdates.push({
                id: fac.id,
                current_occupancy: newOcc,
                status
            });
            recentReadings.push({
                sensor_id: fac.sensor_id,
                sensor_type: 'occupancy',
                source_ref: fac.id,
                value: newOcc,
                timestamp,
                quality: 'good'
            });
        }
        // 4. Update Crowd Zones
        const crowdZones = database_1.db.prepare('SELECT * FROM crowd_zones').all();
        const crowdUpdates = [];
        const updateCrowdStmt = database_1.db.prepare(`
      UPDATE crowd_zones 
      SET density_score = @density_score, density_level = @density_level 
      WHERE id = @id
    `);
        for (const zone of crowdZones) {
            let delta = (Math.random() * 6) - 3;
            if (this.activeScenario === 'lunch_rush' && zone.id === 'zone-canteen-plaza') {
                delta = 6;
            }
            else if (this.activeScenario === 'class_change' && (zone.id === 'zone-tech-walk' || zone.id === 'zone-lib-concourse')) {
                delta = 8;
            }
            else if (this.activeScenario === 'evacuation') {
                delta = zone.zone_type === 'quad' ? 12 : -15;
            }
            let newScore = Math.max(5, Math.min(100, Math.round(zone.density_score + delta)));
            let level = 'low';
            if (newScore >= 85)
                level = 'critical';
            else if (newScore >= 65)
                level = 'high';
            else if (newScore >= 40)
                level = 'medium';
            updateCrowdStmt.run({
                id: zone.id,
                density_score: newScore,
                density_level: level
            });
            crowdUpdates.push({
                id: zone.id,
                density_score: newScore,
                density_level: level
            });
            recentReadings.push({
                sensor_id: `sensor-${zone.id}`,
                sensor_type: 'crowd',
                source_ref: zone.id,
                value: newScore,
                timestamp,
                quality: 'good'
            });
        }
        // 5. Update Buildings Aggregates
        const buildings = database_1.db.prepare('SELECT * FROM buildings').all();
        const buildingUpdates = [];
        const updateBuildingStmt = database_1.db.prepare(`
      UPDATE buildings 
      SET current_occupancy = @current_occupancy, status = @status 
      WHERE id = @id
    `);
        let totalCampusCap = 0;
        let totalCampusOcc = 0;
        for (const bldg of buildings) {
            // Aggregate room occupancy for academic buildings
            const roomSum = database_1.db.prepare('SELECT SUM(current_occupancy) as total FROM rooms WHERE building_id = ?').get(bldg.id);
            let newOcc = roomSum?.total || bldg.current_occupancy;
            // Add a slight natural variance for unmonitored hallways/amenities
            if (bldg.type === 'hostel' || bldg.type === 'sports' || bldg.type === 'admin') {
                const drift = Math.floor(Math.random() * 7) - 3;
                newOcc = Math.max(0, Math.min(bldg.total_capacity, bldg.current_occupancy + drift));
            }
            const ratio = newOcc / bldg.total_capacity;
            let status = 'normal';
            if (ratio >= 0.8)
                status = 'congested';
            else if (ratio >= 0.6)
                status = 'busy';
            updateBuildingStmt.run({
                id: bldg.id,
                current_occupancy: newOcc,
                status
            });
            buildingUpdates.push({
                id: bldg.id,
                current_occupancy: newOcc,
                status
            });
            totalCampusCap += bldg.total_capacity;
            totalCampusOcc += newOcc;
        }
        // Persist batch of sensor readings into database (keeping last 1000)
        const insertSensorReading = database_1.db.prepare(`
      INSERT INTO sensor_readings (sensor_id, sensor_type, source_ref, value, timestamp, quality)
      VALUES (@sensor_id, @sensor_type, @source_ref, @value, @timestamp, @quality)
    `);
        const insertBatch = database_1.db.transaction(() => {
            for (const r of recentReadings) {
                insertSensorReading.run(r);
            }
        });
        insertBatch();
        // Periodically prune sensor readings to keep recent 500 entries
        if (this.tickCount % 20 === 0) {
            try {
                database_1.db.prepare(`
          DELETE FROM sensor_readings 
          WHERE id NOT IN (
            SELECT id FROM sensor_readings ORDER BY id DESC LIMIT 500
          )
        `).run();
            }
            catch (err) {
                // Non-critical cleanup
            }
        }
        // Broadcast Delta via WebSocket
        const deltaPayload = {
            timestamp,
            buildings: buildingUpdates,
            rooms: roomUpdates,
            parking: parkingUpdates,
            facilities: facilityUpdates,
            crowd_zones: crowdUpdates,
            recent_readings: recentReadings.slice(0, 8),
            simulation_stats: {
                tick_count: this.tickCount,
                active_sensors: 72,
                scenario: this.activeScenario,
                campus_occupancy_rate: Math.round((totalCampusOcc / (totalCampusCap || 1)) * 100)
            }
        };
        this.io.emit('telemetry:delta', deltaPayload);
    }
}
exports.IoTSimulator = IoTSimulator;
