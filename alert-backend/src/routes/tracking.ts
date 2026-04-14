import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM tracked_items WHERE user_id=$1 ORDER BY last_updated DESC', [req.userId]);
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, itemType, icon, latitude, longitude } = req.body;
    if (!name || !itemType) return res.status(400).json({ error: 'Campos obrigatórios: name, itemType' });
    const result = await query(
      'INSERT INTO tracked_items (user_id,name,item_type,icon,latitude,longitude) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.userId, name, itemType, icon || 'map-marker', latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/location', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude } = req.body;
    await query('UPDATE tracked_items SET latitude=$1,longitude=$2,last_updated=NOW() WHERE id=$3 AND user_id=$4', [latitude, longitude, req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM tracked_items WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
