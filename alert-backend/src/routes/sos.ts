import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/alert', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude, contactName } = req.body;
    await query('INSERT INTO sos_alerts (user_id,alert_type,latitude,longitude,target_contact) VALUES ($1,$2,$3,$4,$5)', [req.userId, 'sos', latitude, longitude, contactName || null]);
    res.json({ ok: true, message: 'SOS enviado' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/family-panic', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude } = req.body;
    await query('INSERT INTO sos_alerts (user_id,alert_type,latitude,longitude) VALUES ($1,$2,$3,$4)', [req.userId, 'family_panic', latitude, longitude]);
    res.json({ ok: true, message: 'Alerta familiar enviado' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM sos_contacts WHERE user_id=$1', [req.userId]);
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { contactName, phoneNumber } = req.body;
    if (!contactName || !phoneNumber) return res.status(400).json({ error: 'Campos obrigatórios' });
    const result = await query('INSERT INTO sos_contacts (user_id,contact_name,phone_number) VALUES ($1,$2,$3) RETURNING *', [req.userId, contactName, phoneNumber]);
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
