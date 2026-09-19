"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionEngine = void 0;
const database_1 = require("../db/database");
class PredictionEngine {
    static getForecasts() {
        const facilities = database_1.db.prepare('SELECT * FROM facilities').all();
        const parkingLots = database_1.db.prepare('SELECT * FROM parking_lots').all();
        const crowdZones = database_1.db.prepare('SELECT * FROM crowd_zones').all();
        // 1. Facility demand forecast (1h and 2h forward)
        const facility_forecasts = facilities.map((fac) => {
            const occ = fac.current_occupancy;
            const cap = fac.capacity;
            const currentPct = occ / cap;
            // Diurnal time factor based on facility type
            let drift1h = 0;
            let drift2h = 0;
            let risk = 'normal';
            let peakTime = '16:30';
            let recommendation = 'Capacity within normal bounds.';
            if (fac.type === 'library') {
                drift1h = Math.round(cap * 0.12);
                drift2h = Math.round(cap * 0.18);
                peakTime = '16:00';
                if (currentPct > 0.75) {
                    risk = 'high';
                    recommendation = 'Quiet research floors approaching 90%. Advise students to use Block 34 / Block 32 study suites.';
                }
                else if (currentPct > 0.55) {
                    risk = 'moderate';
                    recommendation = 'Expected steady increase over the next 90 minutes as afternoon lectures conclude.';
                }
            }
            else if (fac.type === 'canteen') {
                drift1h = Math.round(cap * 0.08);
                drift2h = -Math.round(cap * 0.20);
                peakTime = '13:30';
                if (currentPct > 0.8) {
                    risk = 'high';
                    recommendation = 'High lunch rush queue times at Uni-Mall food court. Recommend dining at BH-4 or GH-2 cafeteria.';
                }
            }
            else if (fac.type === 'gym') {
                drift1h = Math.round(cap * 0.25);
                drift2h = Math.round(cap * 0.35);
                peakTime = '18:15';
                risk = 'moderate';
                recommendation = 'Evening workout rush expected. Free weights & lockers will see high contention.';
            }
            else if (fac.type === 'auditorium') {
                drift1h = Math.round(cap * 0.30);
                drift2h = Math.round(cap * 0.45);
                peakTime = '15:00';
                recommendation = 'YouthVibe / Cultural event stream at UniPolis. Doors opening in 30 minutes.';
            }
            const f1h = Math.min(cap, Math.max(0, occ + drift1h));
            const f2h = Math.min(cap, Math.max(0, occ + drift2h));
            return {
                facility_id: fac.id,
                facility_name: fac.name,
                current_occupancy: occ,
                capacity: cap,
                forecast_1h: f1h,
                forecast_2h: f2h,
                predicted_peak_time: peakTime,
                risk_level: risk,
                recommendation
            };
        });
        // 2. Parking Lot Fill-Rate Forecasts & Time-To-Full
        const parking_forecasts = parkingLots.map((lot) => {
            const occ = lot.current_occupied;
            const cap = lot.total_capacity;
            const remaining = cap - occ;
            const pct = occ / cap;
            // Rate of car arrivals per 10 minutes based on lot
            let netArrivalsPer10Min = 0;
            let timeToFull = null;
            if (lot.id === 'park-gate1' || lot.id === 'park-block34') {
                netArrivalsPer10Min = 6;
                if (remaining > 0 && netArrivalsPer10Min > 0) {
                    timeToFull = Math.max(5, Math.round((remaining / netArrivalsPer10Min) * 10));
                }
                else {
                    timeToFull = 0;
                }
            }
            else if (lot.id === 'park-unimall') {
                netArrivalsPer10Min = 2;
                timeToFull = remaining > 0 ? Math.round((remaining / 2) * 10) : 0;
            }
            else {
                // UniPolis event lot has ample space
                netArrivalsPer10Min = 4;
                timeToFull = remaining > 0 ? Math.round((remaining / 4) * 10) : null;
            }
            const forecast_30m = Math.min(cap, occ + (netArrivalsPer10Min * 3));
            const forecast_1h = Math.min(cap, occ + (netArrivalsPer10Min * 6));
            return {
                lot_id: lot.id,
                lot_name: lot.name,
                current_occupied: occ,
                total_capacity: cap,
                forecast_30m,
                forecast_1h,
                time_to_full_minutes: pct >= 0.95 ? 0 : timeToFull,
                status: lot.status
            };
        });
        // 3. Crowd Movement Trends
        const crowd_movement_trends = crowdZones.map((z) => {
            let trend = 'stable';
            let pred = z.density_score;
            if (z.id === 'zone-canteen-plaza' || z.id === 'zone-lib-concourse') {
                trend = z.density_score > 75 ? 'falling' : 'rising';
                pred = Math.min(100, Math.max(10, z.density_score + (trend === 'rising' ? 8 : -10)));
            }
            else if (z.id === 'zone-tech-walk') {
                trend = 'rising';
                pred = Math.min(95, z.density_score + 12);
            }
            else if (z.id === 'zone-sports-plaza') {
                trend = 'rising';
                pred = Math.min(90, z.density_score + 22);
            }
            return {
                zone_id: z.id,
                zone_name: z.name,
                trend,
                predicted_next_hour_density: Math.round(pred)
            };
        });
        return {
            facility_forecasts,
            parking_forecasts,
            crowd_movement_trends
        };
    }
}
exports.PredictionEngine = PredictionEngine;
