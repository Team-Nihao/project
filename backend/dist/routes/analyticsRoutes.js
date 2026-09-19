"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const predictionEngine_1 = require("../services/predictionEngine");
const router = (0, express_1.Router)();
// Forecasts and predictive analytics
router.get('/predictions', (req, res) => {
    try {
        const forecasts = predictionEngine_1.PredictionEngine.getForecasts();
        res.json(forecasts);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Hourly occupancy trends over the day (24-hour simulation data)
router.get('/trends', (req, res) => {
    try {
        const hours = [
            '00:00', '02:00', '04:00', '06:00', '08:00', '09:00',
            '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
            '16:00', '17:00', '18:00', '19:00', '20:00', '22:00'
        ];
        // Build realistic diurnal curves
        const hourlyData = hours.map((hour, idx) => {
            let campusOcc = 0;
            let libOcc = 0;
            let canteenOcc = 0;
            let sportsOcc = 0;
            let parkingOcc = 0;
            if (idx <= 3) {
                // Night 00:00 - 06:00
                campusOcc = 15;
                libOcc = 8;
                canteenOcc = 2;
                sportsOcc = 0;
                parkingOcc = 20;
            }
            else if (idx <= 5) {
                // Morning arrival 08:00 - 09:00
                campusOcc = 45;
                libOcc = 35;
                canteenOcc = 40;
                sportsOcc = 15;
                parkingOcc = 65;
            }
            else if (idx <= 7) {
                // Morning classes 10:00 - 11:00
                campusOcc = 82;
                libOcc = 65;
                canteenOcc = 50;
                sportsOcc = 25;
                parkingOcc = 92;
            }
            else if (idx <= 9) {
                // Lunch peak 12:00 - 13:00
                campusOcc = 88;
                libOcc = 60;
                canteenOcc = 95;
                sportsOcc = 30;
                parkingOcc = 90;
            }
            else if (idx <= 12) {
                // Afternoon labs & library 14:00 - 16:00
                campusOcc = 79;
                libOcc = 86;
                canteenOcc = 55;
                sportsOcc = 35;
                parkingOcc = 85;
            }
            else if (idx <= 14) {
                // Evening sports & dining 17:00 - 18:00
                campusOcc = 68;
                libOcc = 75;
                canteenOcc = 70;
                sportsOcc = 85;
                parkingOcc = 70;
            }
            else {
                // Late evening 19:00 - 22:00
                campusOcc = 40;
                libOcc = 60;
                canteenOcc = 35;
                sportsOcc = 45;
                parkingOcc = 40;
            }
            return {
                time: hour,
                campus: campusOcc,
                library: libOcc,
                canteen: canteenOcc,
                sports: sportsOcc,
                parking: parkingOcc
            };
        });
        // Issues category breakdown
        const issueBreakdown = database_1.db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM issues 
      GROUP BY category
    `).all();
        // Building occupancy distribution
        const buildingDistribution = database_1.db.prepare(`
      SELECT name, code, current_occupancy, total_capacity, 
             ROUND((CAST(current_occupancy AS REAL) / total_capacity) * 100, 1) as occupancy_rate
      FROM buildings 
      ORDER BY occupancy_rate DESC
    `).all();
        res.json({
            hourlyTrends: hourlyData,
            issueBreakdown,
            buildingDistribution
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Recent sensor telemetry logs
router.get('/sensors', (req, res) => {
    try {
        const limit = Math.min(100, Number(req.query.limit) || 30);
        const readings = database_1.db.prepare(`
      SELECT * FROM sensor_readings 
      ORDER BY id DESC 
      LIMIT ?
    `).all(limit);
        res.json(readings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
