"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventsRouter = createEventsRouter;
const express_1 = require("express");
const database_1 = require("../db/database");
function createEventsRouter(io) {
    const router = (0, express_1.Router)();
    router.get('/', (req, res) => {
        try {
            const events = database_1.db.prepare('SELECT * FROM events ORDER BY start_time ASC').all();
            res.json(events);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    router.post('/', (req, res) => {
        try {
            const { title, description, location_id, location_name, start_time, end_time, category, organizer, expected_attendees } = req.body;
            if (!title || !location_id || !start_time) {
                return res.status(400).json({ error: 'Title, location, and start time required' });
            }
            const id = `evt-${Date.now().toString(36)}`;
            const newEvent = {
                id,
                title,
                description: description || '',
                location_id,
                location_name: location_name || location_id,
                start_time,
                end_time: end_time || start_time,
                category: category || 'academic',
                organizer: organizer || 'Campus Organization',
                expected_attendees: Number(expected_attendees) || 50
            };
            const stmt = database_1.db.prepare(`
        INSERT INTO events (id, title, description, location_id, location_name, start_time, end_time, category, organizer, expected_attendees)
        VALUES (@id, @title, @description, @location_id, @location_name, @start_time, @end_time, @category, @organizer, @expected_attendees)
      `);
            stmt.run(newEvent);
            io.emit('event:created', newEvent);
            res.status(201).json(newEvent);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    return router;
}
