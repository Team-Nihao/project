import { Router } from 'express';
import { db } from '../db/database';
import { DataFusionService } from '../services/dataFusion';

const router = Router();

// Full fused campus twin snapshot
router.get('/state', (req, res) => {
  try {
    const state = DataFusionService.getFusedCampusState();
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Buildings list
router.get('/buildings', (req, res) => {
  try {
    const buildings = db.prepare('SELECT * FROM buildings').all();
    res.json(buildings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single building with rooms and facilities
router.get('/buildings/:id', (req, res) => {
  try {
    const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }
    const rooms = db.prepare('SELECT * FROM rooms WHERE building_id = ?').all(req.params.id);
    const facilities = db.prepare('SELECT * FROM facilities WHERE building_id = ?').all(req.params.id);
    res.json({ ...building, rooms, facilities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rooms list with filtering & search
router.get('/rooms', (req, res) => {
  try {
    const { building_id, type, status, search, free_only } = req.query;
    let query = `
      SELECT r.*, b.name as building_name 
      FROM rooms r 
      JOIN buildings b ON r.building_id = b.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (building_id && building_id !== 'all') {
      query += ' AND r.building_id = ?';
      params.push(building_id);
    }
    if (type && type !== 'all') {
      query += ' AND r.type = ?';
      params.push(type);
    }
    if (status && status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (free_only === 'true') {
      query += ' AND r.status = "free"';
    }
    if (search) {
      query += ' AND (r.name LIKE ? OR r.next_class LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY r.floor ASC, r.name ASC';
    const rooms = db.prepare(query).all(...params);
    res.json(rooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parking lots
router.get('/parking', (req, res) => {
  try {
    const parkingLots = db.prepare('SELECT * FROM parking_lots').all();
    res.json(parkingLots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Facilities
router.get('/facilities', (req, res) => {
  try {
    const facilities = db.prepare('SELECT * FROM facilities').all();
    res.json(facilities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crowd Zones
router.get('/crowd', (req, res) => {
  try {
    const zones = db.prepare('SELECT * FROM crowd_zones').all();
    res.json(zones);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

