import * as dispatchService from '../services/dispatch.service.js';

export const createDispatch = async (req, res) => {
  try {
    const dispatch = await dispatchService.createDispatch(req.body, req.user.id);
    res.status(201).json({ success: true, data: dispatch });
  } catch (error) {
    console.error('Create Dispatch Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error creating dispatch entry' });
  }
};

export const updateDispatch = async (req, res) => {
  try {
    const dispatch = await dispatchService.updateDispatch(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, data: dispatch });
  } catch (error) {
    console.error('Update Dispatch Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error updating dispatch entry' });
  }
};

export const deleteDispatch = async (req, res) => {
  try {
    await dispatchService.deleteDispatch(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Dispatch entry deleted successfully' });
  } catch (error) {
    console.error('Delete Dispatch Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error deleting dispatch entry' });
  }
};

export const getDispatch = async (req, res) => {
  try {
    const dispatch = await dispatchService.getDispatchById(req.params.id);
    res.status(200).json({ success: true, data: dispatch });
  } catch (error) {
    console.error('Get Dispatch Error:', error);
    res.status(404).json({ success: false, message: error.message || 'Not found' });
  }
};

export const listDispatches = async (req, res) => {
  try {
    const result = await dispatchService.getDispatchesList(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('List Dispatches Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
