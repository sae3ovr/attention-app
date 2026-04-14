import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { signToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) return res.status(400).json({ error: 'Campos obrigatórios: email, password, displayName' });
    const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'E-mail já registrado' });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1,$2,$3) RETURNING id, email, display_name, reputation, level',
      [email, hash, displayName]
    );
    const user = result.rows[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.display_name, reputation: user.reputation, level: user.level } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios: email, password' });
    const result = await query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name, reputation: user.reputation, level: user.level, isGuardian: user.is_guardian, totalReports: user.total_reports, totalConfirmations: user.total_confirmations } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT id,email,display_name,reputation,level,is_guardian,is_ghost_mode,total_reports,total_confirmations,reports_today,daily_report_limit,verified_incidents,removed_incidents,mentees FROM users WHERE id=$1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    const u = result.rows[0];
    res.json({ id: u.id, email: u.email, displayName: u.display_name, reputation: u.reputation, level: u.level, isGuardian: u.is_guardian, isGhostMode: u.is_ghost_mode, totalReports: u.total_reports, totalConfirmations: u.total_confirmations, reportsToday: u.reports_today, dailyReportLimit: u.daily_report_limit, verifiedIncidents: u.verified_incidents, removedIncidents: u.removed_incidents, mentees: u.mentees });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
