import { Server } from 'socket.io';
import { db } from '../db/database';
import { TelemetryDelta, SensorReading, RoomStatus, ParkingStatus, FacilityStatus, CrowdLevel } from '../models/types';

export class IoTSimulator {
  private io: Server;
  private intervalId: NodeJS.Timeout | null = null;
  private tickCount: number = 0;
  private intervalMs: number = 3000;
  private isPaused: boolean = false;
  private activeScenario: string = 'normal'; // 'normal' | 'lunch_rush' | 'class_change' | 'evacuation' | 'night_study'

  constructor(io: Server) {
    this.io = io;
  }

  public start() {
    if (this.intervalId) clearInterval(this.intervalId);
    console.log(`[IoT Engine] Starting telemetry generator (interval: ${this.intervalMs}ms)...`);
    this.intervalId = setInterval(() => this.tick(), this.intervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    console.log(`[IoT Engine] Simulation paused state set to: ${paused}`);
  }

  public setSpeed(speed: number) {
    // speed multiplier: 1x -> 3000ms, 2x -> 1500ms, 5x -> 600ms
    const base = 3000;
    this.intervalMs = Math.max(500, Math.floor(base / speed));
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => this.tick(), this.intervalMs);
    }
    console.log(`[IoT Engine] Simulation speed adjusted. Interval: ${this.intervalMs}ms`);
  }

  public setScenario(scenario: string) {
    this.activeScenario = scenario;
    console.log(`[IoT Engine] Scenario triggered: ${scenario}`);
    // Immediately execute a tick to reflect scenario
    this.tick();
  }

  public getStatus() {
    return {
      isPaused: this.isPaused,
      intervalMs: this.intervalMs,
      scenario: this.activeScenario,
      tickCount: this.tickCount
    };
  }

  private tick() {
    if (this.isPaused) return;

    this.tickCount++;
    const now = new Date();
    const timestamp = now.toISOString();

    const recentReadings: SensorReading[] = [];

    // 1. Update Rooms
    const rooms = db.prepare('SELECT * FROM rooms').all() as any[];
    const roomUpdates: { id: string; current_occupancy: number; status: RoomStatus; next_available_time: string }[] = [];

    const updateRoomStmt = db.prepare(`
      UPDATE rooms 
      SET current_occupancy = @current_occupancy, status = @status, last_updated = @last_updated 
      WHERE id = @id
    `);

    for (const room of rooms) {
      let newOcc = room.current_occupancy;
      let newStatus: RoomStatus = room.status;

      if (this.activeScenario === 'evacuation') {
        newOcc = 0;
        newStatus = 'free';
      } else if (this.activeScenario === 'class_change') {
        // High volatility
        const delta = Math.floor(Math.random() * 25) - 12;
        newOcc = Math.max(0, Math.min(room.capacity, newOcc + delta));
        newStatus = newOcc > 5 ? 'occupied' : 'free';
      } else {
        // Normal drift with occasional state flip
        if (room.status === 'occupied') {
          const delta = Math.floor(Math.random() * 7) - 3;
          newOcc = Math.max(0, Math.min(room.capacity, newOcc + delta));
          if (newOcc <= 2 && Math.random() < 0.15) {
            newStatus = 'free';
            newOcc = 0;
          }
        } else if (room.status === 'free') {
          if (Math.random() < 0.1) {
            newStatus = 'occupied';
            newOcc = Math.floor(room.capacity * (0.4 + Math.random() * 0.4));
          } else {
            newOcc = Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0;
          }
        } else if (room.status === 'scheduled') {
          if (Math.random() < 0.2) {
            newStatus = 'occupied';
            newOcc = Math.floor(room.capacity * 0.75);
          }
        }
      }

      let nextAvail = room.next_available_time;
      if (newStatus === 'free') {
        nextAvail = 'Now';
      } else if (nextAvail === 'Now') {
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
    const parkingLots = db.prepare('SELECT * FROM parking_lots').all() as any[];
    const parkingUpdates: { id: string; current_occupied: number; status: ParkingStatus; ev_occupied: number }[] = [];

    const updateParkingStmt = db.prepare(`
      UPDATE parking_lots 
      SET current_occupied = @current_occupied, status = @status, ev_occupied = @ev_occupied 
      WHERE id = @id
    `);

    for (const lot of parkingLots) {
      let delta = Math.floor(Math.random() * 5) - 2; // -2 to +2 cars

      if (this.activeScenario === 'evacuation') {
        delta = -10;
      } else if (this.activeScenario === 'lunch_rush' && lot.id === 'park-block34') {
        delta = 4;
      }

      let newOcc = Math.max(0, Math.min(lot.total_capacity, lot.current_occupied + delta));
      const ratio = newOcc / lot.total_capacity;

      let status: ParkingStatus = 'available';
      if (ratio >= 0.95) status = 'full';
      else if (ratio >= 0.8) status = 'filling';

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
    const facilities = db.prepare('SELECT * FROM facilities').all() as any[];
    const facilityUpdates: { id: string; current_occupancy: number; status: FacilityStatus }[] = [];

    const updateFacilityStmt = db.prepare(`
      UPDATE facilities 
      SET current_occupancy = @current_occupancy, status = @status 
      WHERE id = @id
    `);

    for (const fac of facilities) {
      let delta = Math.floor(Math.random() * 9) - 4;

      if (this.activeScenario === 'lunch_rush' && fac.id === 'fac-canteen') {
        delta = 15;
      } else if (this.activeScenario === 'night_study' && fac.id === 'fac-lib') {
        delta = 12;
      } else if (this.activeScenario === 'evacuation') {
        delta = -30;
      }

      let newOcc = Math.max(0, Math.min(fac.capacity, fac.current_occupancy + delta));
      const ratio = newOcc / fac.capacity;

      let status: FacilityStatus = 'open';
      if (ratio >= 0.85) status = 'crowded';

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
    const crowdZones = db.prepare('SELECT * FROM crowd_zones').all() as any[];
    const crowdUpdates: { id: string; density_score: number; density_level: CrowdLevel }[] = [];

    const updateCrowdStmt = db.prepare(`
      UPDATE crowd_zones 
      SET density_score = @density_score, density_level = @density_level 
      WHERE id = @id
    `);

    for (const zone of crowdZones) {
      let delta = (Math.random() * 6) - 3;

      if (this.activeScenario === 'lunch_rush' && zone.id === 'zone-canteen-plaza') {
        delta = 6;
      } else if (this.activeScenario === 'class_change' && (zone.id === 'zone-tech-walk' || zone.id === 'zone-lib-concourse')) {
        delta = 8;
      } else if (this.activeScenario === 'evacuation') {
        delta = zone.zone_type === 'quad' ? 12 : -15;
      }

      let newScore = Math.max(5, Math.min(100, Math.round(zone.density_score + delta)));
      let level: CrowdLevel = 'low';
      if (newScore >= 85) level = 'critical';
      else if (newScore >= 65) level = 'high';
      else if (newScore >= 40) level = 'medium';

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
    const buildings = db.prepare('SELECT * FROM buildings').all() as any[];
    const buildingUpdates: { id: string; current_occupancy: number; status: 'normal' | 'busy' | 'congested' }[] = [];

    const updateBuildingStmt = db.prepare(`
      UPDATE buildings 
      SET current_occupancy = @current_occupancy, status = @status 
      WHERE id = @id
    `);

    let totalCampusCap = 0;
    let totalCampusOcc = 0;

    for (const bldg of buildings) {
      // Aggregate room occupancy for academic buildings
      const roomSum = db.prepare('SELECT SUM(current_occupancy) as total FROM rooms WHERE building_id = ?').get(bldg.id) as { total: number };
      let newOcc = roomSum?.total || bldg.current_occupancy;

      // Add a slight natural variance for unmonitored hallways/amenities
      if (bldg.type === 'hostel' || bldg.type === 'sports' || bldg.type === 'admin') {
        const drift = Math.floor(Math.random() * 7) - 3;
        newOcc = Math.max(0, Math.min(bldg.total_capacity, bldg.current_occupancy + drift));
      }

      const ratio = newOcc / bldg.total_capacity;
      let status: 'normal' | 'busy' | 'congested' = 'normal';
      if (ratio >= 0.8) status = 'congested';
      else if (ratio >= 0.6) status = 'busy';

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
    const insertSensorReading = db.prepare(`
      INSERT INTO sensor_readings (sensor_id, sensor_type, source_ref, value, timestamp, quality)
      VALUES (@sensor_id, @sensor_type, @source_ref, @value, @timestamp, @quality)
    `);

    const insertBatch = db.transaction(() => {
      for (const r of recentReadings) {
        insertSensorReading.run(r);
      }
    });
    insertBatch();

    // Broadcast Delta via WebSocket
    const deltaPayload: TelemetryDelta = {
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

