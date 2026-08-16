import { AdvanceService } from '../services/advance.service.js';

export const advanceController = {
  async getCategories(req, res, next) {
    try {
      const data = await AdvanceService.getCategories();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const data = await AdvanceService.createCategory(req.body);
      res.status(201).json({ success: true, message: 'Category created', data });
    } catch (err) {
      next(err);
    }
  },

  async getAdvances(req, res, next) {
    try {
      const data = await AdvanceService.getAdvances(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAdvanceDetails(req, res, next) {
    try {
      const data = await AdvanceService.getAdvanceDetails(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async disburseAdvance(req, res, next) {
    try {
      const data = await AdvanceService.disburseAdvance(req.body, req.user?.id);
      res.status(201).json({ success: true, message: 'Advance disbursed successfully', data });
    } catch (err) {
      next(err);
    }
  },

  async allocateAdvance(req, res, next) {
    try {
      const data = await AdvanceService.allocateAdvance(req.body, req.user?.id);
      res.status(200).json({ success: true, message: 'Advance allocated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  async recordRefund(req, res, next) {
    try {
      const data = await AdvanceService.recordRefund(req.body, req.user?.id);
      res.status(200).json({ success: true, message: 'Refund recorded successfully', data });
    } catch (err) {
      next(err);
    }
  },

  async reverseAdvance(req, res, next) {
    try {
      const data = await AdvanceService.reverseAdvance({ advance_id: req.params.id, reason: req.body.reason }, req.user?.id);
      res.status(200).json({ success: true, message: data.message });
    } catch (err) {
      next(err);
    }
  },
};
