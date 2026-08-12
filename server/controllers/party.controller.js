import { PartyService } from '../services/party.service.js';

export const partyController = {
  async getParties(req, res, next) {
    try {
      const data = await PartyService.getParties(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getPartyProfile(req, res, next) {
    try {
      const data = await PartyService.getPartyProfile(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createParty(req, res, next) {
    try {
      const data = await PartyService.createParty(req.body);
      res.status(201).json({ success: true, message: 'Party created successfully', data });
    } catch (err) {
      next(err);
    }
  },

  async updateParty(req, res, next) {
    try {
      const data = await PartyService.updateParty(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Party updated successfully', data });
    } catch (err) {
      next(err);
    }
  },
};
