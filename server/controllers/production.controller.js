import * as productionService from '../services/production.service.js';

export const createProduction = async (req, res) => {
  try {
    const production = await productionService.createProduction(req.body, req.user.id);
    res.status(201).json({ success: true, data: production });
  } catch (error) {
    console.error('Create Production Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error creating production entry' });
  }
};

export const updateProduction = async (req, res) => {
  try {
    const production = await productionService.updateProduction(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, data: production });
  } catch (error) {
    console.error('Update Production Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error updating production entry' });
  }
};

export const deleteProduction = async (req, res) => {
  try {
    await productionService.deleteProduction(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Production entry deleted successfully' });
  } catch (error) {
    console.error('Delete Production Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error deleting production entry' });
  }
};

export const getProduction = async (req, res) => {
  try {
    const production = await productionService.getProductionById(req.params.id);
    res.status(200).json({ success: true, data: production });
  } catch (error) {
    console.error('Get Production Error:', error);
    res.status(404).json({ success: false, message: error.message || 'Not found' });
  }
};

export const listProductions = async (req, res) => {
  try {
    const result = await productionService.getProductionsList(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('List Productions Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
