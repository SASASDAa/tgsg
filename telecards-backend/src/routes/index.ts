import { Router } from 'express';
import playerRoutes from './playerRoutes';
import shopRoutes from './shopRoutes';
import socialRoutes from './socialRoutes';

const router = Router();

router.use('/player', playerRoutes);
router.use('/shop', shopRoutes);
router.use('/social', socialRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'TeleCards Backend is healthy!' });
});

export default router;
