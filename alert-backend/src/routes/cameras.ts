import { Router } from 'express';
import { query } from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM public_cameras');
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
