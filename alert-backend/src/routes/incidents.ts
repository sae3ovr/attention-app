import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await query("SELECT * FROM incidents WHERE status='active' ORDER BY created_at DESC LIMIT 200");
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, severity, latitude, longitude, photoUrl } = req.body;
    if (!title || !latitude || !longitude) return res.status(400).json({ error: 'Campos obrigatórios: title, latitude, longitude' });
    const result = await query(
      'INSERT INTO incidents (user_id,title,description,category,severity,latitude,longitude,photo_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.userId, title, description || '', category || 'other', severity || 'medium', latitude, longitude, photoUrl || null]
    );
    await query('UPDATE users SET total_reports=total_reports+1, reports_today=reports_today+1, reputation=reputation+10 WHERE id=$1', [req.userId]);
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/confirm', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await query('INSERT INTO incident_votes (incident_id,user_id,vote) VALUES ($1,$2,$3) ON CONFLICT(incident_id,user_id) DO UPDATE SET vote=$3', [req.params.id, req.userId, 'confirm']);
    await query('UPDATE incidents SET confirm_count=(SELECT count(*) FROM incident_votes WHERE incident_id=$1 AND vote=$2) WHERE id=$1', [req.params.id, 'confirm']);
    await query('UPDATE users SET total_confirmations=total_confirmations+1, reputation=reputation+2 WHERE id=$1', [req.userId]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/deny', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await query('INSERT INTO incident_votes (incident_id,user_id,vote) VALUES ($1,$2,$3) ON CONFLICT(incident_id,user_id) DO UPDATE SET vote=$3', [req.params.id, req.userId, 'deny']);
    await query('UPDATE incidents SET deny_count=(SELECT count(*) FROM incident_votes WHERE incident_id=$1 AND vote=$2) WHERE id=$1', [req.params.id, 'deny']);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const result = await query('SELECT c.*, u.display_name FROM incident_comments c JOIN users u ON c.user_id=u.id WHERE c.incident_id=$1 ORDER BY c.created_at DESC LIMIT 50', [req.params.id]);
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length > 200) return res.status(400).json({ error: 'Comentário obrigatório (máx 200 caracteres)' });
    const result = await query('INSERT INTO incident_comments (incident_id,user_id,text) VALUES ($1,$2,$3) RETURNING *', [req.params.id, req.userId, text]);
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
