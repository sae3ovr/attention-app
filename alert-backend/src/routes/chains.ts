import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT c.* FROM chains c JOIN chain_members cm ON c.id=cm.chain_id WHERE cm.user_id=$1', [req.userId]);
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const inviteCode = uuid().slice(0, 8).toUpperCase();
    const result = await query('INSERT INTO chains (name,invite_code,owner_id) VALUES ($1,$2,$3) RETURNING *', [name || 'Minha Chain', inviteCode, req.userId]);
    await query('INSERT INTO chain_members (chain_id,user_id,role) VALUES ($1,$2,$3)', [result.rows[0].id, req.userId, 'admin']);
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/join', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { inviteCode } = req.body;
    const chainRes = await query('SELECT * FROM chains WHERE invite_code=$1', [inviteCode]);
    if (chainRes.rows.length === 0) return res.status(404).json({ error: 'Código inválido' });
    await query('INSERT INTO chain_members (chain_id,user_id,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [chainRes.rows[0].id, req.userId, 'member']);
    res.json({ ok: true, chain: chainRes.rows[0] });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const memberCheck = await query('SELECT 1 FROM chain_members WHERE chain_id=$1 AND user_id=$2', [req.params.id, req.userId]);
    if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Não é membro desta cadeia' });
    const result = await query('SELECT m.*, u.display_name AS sender_name FROM chain_messages m JOIN users u ON m.sender_id=u.id WHERE m.chain_id=$1 ORDER BY m.created_at DESC LIMIT 100', [req.params.id]);
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal error' : e.message }); }
});

router.post('/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const memberCheck = await query('SELECT 1 FROM chain_members WHERE chain_id=$1 AND user_id=$2', [req.params.id, req.userId]);
    if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Não é membro desta cadeia' });
    const { text, msgType } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) return res.status(400).json({ error: 'Texto é obrigatório' });
    const validTypes = ['text', 'alert', 'location', 'sos', 'check_in', 'image'];
    const type = validTypes.includes(msgType) ? msgType : 'text';
    const result = await query('INSERT INTO chain_messages (chain_id,sender_id,text,msg_type) VALUES ($1,$2,$3,$4) RETURNING *', [req.params.id, req.userId, text.trim(), type]);
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal error' : e.message }); }
});

export default router;
