import { SalaryService } from '../services/salary.service.js';

export const salaryController = {
  async getSalaryCycles(req, res, next) {
    try {
      const data = await SalaryService.getSalaryCycles();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createSalaryCycle(req, res, next) {
    try {
      const data = await SalaryService.createSalaryCycle(req.body, req.user?.id);
      res.status(201).json({ success: true, message: 'Salary cycle created', data });
    } catch (err) {
      next(err);
    }
  },

  async updateSalaryCycleStatus(req, res, next) {
    try {
      const data = await SalaryService.updateSalaryCycleStatus(req.params.id, req.body.status);
      res.status(200).json({ success: true, message: 'Salary cycle status updated', data });
    } catch (err) {
      next(err);
    }
  },

  async getSalaries(req, res, next) {
    try {
      const data = await SalaryService.getSalaries(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getSalaryDetails(req, res, next) {
    try {
      const data = await SalaryService.getSalaryDetails(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async addSalaryRecord(req, res, next) {
    try {
      const data = await SalaryService.addSalaryRecord(req.body, req.user?.id);
      res.status(201).json({ success: true, message: 'Salary record created', data });
    } catch (err) {
      next(err);
    }
  },

  async recordSalaryPayment(req, res, next) {
    try {
      const data = await SalaryService.recordSalaryPayment(req.body, req.user?.id);
      res.status(200).json({ success: true, message: 'Salary payment recorded', data });
    } catch (err) {
      next(err);
    }
  },

  async getSalaryStructures(req, res, next) {
    try {
      const data = await SalaryService.getSalaryStructures(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async saveSalaryStructure(req, res, next) {
    try {
      const data = await SalaryService.saveSalaryStructure(req.body);
      res.status(201).json({ success: true, message: 'Salary structure saved', data });
    } catch (err) {
      next(err);
    }
  },
};
