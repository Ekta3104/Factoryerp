import * as inwardService from '../services/vehicleInward.service.js';

export const createInward = async (req, res) => {
  try {
    const inward = await inwardService.createVehicleInward(req.body, req.user.id);
    res.status(201).json({ success: true, data: inward });
  } catch (error) {
    console.error('Create Inward Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error creating inward' });
  }
};

export const updateInward = async (req, res) => {
  try {
    const inward = await inwardService.updateVehicleInward(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, data: inward });
  } catch (error) {
    console.error('Update Inward Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error updating inward' });
  }
};

export const deleteInward = async (req, res) => {
  try {
    await inwardService.deleteVehicleInward(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Vehicle Inward deleted successfully' });
  } catch (error) {
    console.error('Delete Inward Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error deleting inward' });
  }
};

export const getInward = async (req, res) => {
  try {
    const inward = await inwardService.getVehicleInwardById(req.params.id);
    res.status(200).json({ success: true, data: inward });
  } catch (error) {
    console.error('Get Inward Error:', error);
    res.status(404).json({ success: false, message: error.message || 'Not found' });
  }
};

export const listInwards = async (req, res) => {
  try {
    const result = await inwardService.getVehicleInwardsList(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('List Inwards Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
