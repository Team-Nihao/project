"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSimulationRouter = createSimulationRouter;
const express_1 = require("express");
function createSimulationRouter(simulator) {
    const router = (0, express_1.Router)();
    router.get('/status', (req, res) => {
        res.json(simulator.getStatus());
    });
    router.post('/pause', (req, res) => {
        const { paused } = req.body;
        simulator.setPaused(Boolean(paused));
        res.json({ success: true, status: simulator.getStatus() });
    });
    router.post('/speed', (req, res) => {
        const { speed } = req.body;
        simulator.setSpeed(Number(speed) || 1);
        res.json({ success: true, status: simulator.getStatus() });
    });
    router.post('/scenario', (req, res) => {
        const { scenario } = req.body;
        if (['normal', 'lunch_rush', 'class_change', 'evacuation', 'night_study'].includes(scenario)) {
            simulator.setScenario(scenario);
            res.json({ success: true, status: simulator.getStatus() });
        }
        else {
            res.status(400).json({ error: 'Invalid scenario name' });
        }
    });
    return router;
}
