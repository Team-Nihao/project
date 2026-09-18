import { Router } from 'express';
import { db } from '../db/database';
import { CampusEvent } from '../models/types';
import { Server } from 'socket.io';

export function createEventsRouter(io: Server) {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const events = db.prepare('SELECT * FROM events ORDER BY start_time ASC').all();
      res.json(events);
    } catch (err: any) {
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
      const newEvent: CampusEvent = {
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

      const stmt = db.prepare(`
        INSERT INTO events (id, title, description, location_id, location_name, start_time, end_time, category, organizer, expected_attendees)
        VALUES (@id, @title, @description, @location_id, @location_name, @start_time, @end_time, @category, @organizer, @expected_attendees)
      `);
      stmt.run(newEvent);

      io.emit('event:created', newEvent);

      res.status(201).json(newEvent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

