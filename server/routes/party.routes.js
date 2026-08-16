import express from 'express';
import { partyController } from '../controllers/party.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', partyController.getParties);
router.get('/:id/profile', partyController.getPartyProfile);
router.post('/', authorize('Owner', 'Admin'), partyController.createParty);
router.put('/:id', authorize('Owner', 'Admin'), partyController.updateParty);

export default router;
