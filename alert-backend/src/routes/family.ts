import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT g.* FROM family_groups g JOIN family_members m ON g.id=m.group_id WHERE m.user_id=$1', [req.userId]);
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const inviteCode = uuid().slice(0, 8).toUpperCase();
    const result = await query('INSERT INTO family_groups (name,invite_code,owner_id) VALUES ($1,$2,$3) RETURNING *', [name || 'Minha Família', inviteCode, req.userId]);
    const group = result.rows[0];
    const userRes = await query('SELECT display_name FROM users WHERE id=$1', [req.userId]);
    await query('INSERT INTO family_members (group_id,user_id,role,display_name) VALUES ($1,$2,$3,$4)', [group.id, req.userId, 'admin', userRes.rows[0].display_name]);
    res.status(201).json(group);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/join', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { inviteCode } = req.body;
    const groupRes = await query('SELECT * FROM family_groups WHERE invite_code=$1', [inviteCode]);
    if (groupRes.rows.length === 0) return res.status(404).json({ error: 'Código inválido' });
    const group = groupRes.rows[0];
    const userRes = await query('SELECT display_name FROM users WHERE id=$1', [req.userId]);
    await query('INSERT INTO family_members (group_id,user_id,role,display_name) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [group.id, req.userId, 'member', userRes.rows[0].display_name]);
    res.json({ ok: true, group });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/members', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT fm.* FROM family_members fm JOIN family_groups fg ON fm.group_id=fg.id JOIN family_members my ON my.group_id=fg.id WHERE my.user_id=$1',
      [req.userId]
    );
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/members/:id/location', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude, batteryLevel, isOnline } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude must be numbers' });
    }
    const ownerCheck = await query(
      `SELECT fm.id FROM family_members fm
       JOIN family_groups fg ON fm.group_id = fg.id
       JOIN family_members my ON my.group_id = fg.id
       WHERE fm.id = $1 AND my.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Acesso negado' });
    await query('UPDATE family_members SET latitude=$1,longitude=$2,battery_level=$3,is_online=$4,updated_at=NOW() WHERE id=$5',
      [latitude, longitude, batteryLevel, isOnline ?? true, req.params.id]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal error' : e.message }); }
});

export default router;
