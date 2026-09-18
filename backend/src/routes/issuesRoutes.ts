import { Router } from 'express';
import { db } from '../db/database';
import { IssueReport } from '../models/types';
import { Server } from 'socket.io';

export function createIssuesRouter(io: Server) {
  const router = Router();

  // Get all issues
  router.get('/', (req, res) => {
    try {
      const { status } = req.query;
      let query = 'SELECT * FROM issues ORDER BY created_at DESC';
      if (status && status !== 'all') {
        query = 'SELECT * FROM issues WHERE status = ? ORDER BY created_at DESC';
        const issues = db.prepare(query).all(status);
        return res.json(issues);
      }
      const issues = db.prepare(query).all();
      res.json(issues);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Report new issue
  router.post('/', (req, res) => {
    try {
      const { title, description, location_id, location_name, reported_by, category, priority } = req.body;

      if (!title || !description || !location_id) {
        return res.status(400).json({ error: 'Title, description, and location are required' });
      }

      const id = `iss-${Date.now().toString(36)}`;
      const created_at = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO issues (id, title, description, location_id, location_name, reported_by, category, priority, status, created_at, resolved_at)
        VALUES (@id, @title, @description, @location_id, @location_name, @reported_by, @category, @priority, 'open', @created_at, NULL)
      `);

      const newIssue: IssueReport = {
        id,
        title,
        description,
        location_id,
        location_name: location_name || location_id,
        reported_by: reported_by || 'Campus Member',
        category: category || 'maintenance',
        priority: priority || 'medium',
        status: 'open',
        created_at,
        resolved_at: null
      };

      stmt.run(newIssue);

      // Broadcast new issue over WebSocket
      io.emit('issue:created', newIssue);

      res.status(201).json(newIssue);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update status (open -> in-progress -> resolved)
  router.patch('/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      if (!['open', 'in-progress', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const resolved_at = status === 'resolved' ? new Date().toISOString() : null;

      const stmt = db.prepare(`
        UPDATE issues 
        SET status = ?, resolved_at = ? 
        WHERE id = ?
      `);
      const result = stmt.run(status, resolved_at, req.params.id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      const updated = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id) as IssueReport;

      // Broadcast update over WebSocket
      io.emit('issue:updated', updated);

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

