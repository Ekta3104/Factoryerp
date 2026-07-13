import * as expenseService from '../services/expense.service.js';

export const createExpense = async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.user.id);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Create Expense Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error creating expense' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    console.error('Update Expense Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error updating expense' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete Expense Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error deleting expense' });
  }
};

export const getExpense = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    console.error('Get Expense Error:', error);
    res.status(404).json({ success: false, message: error.message || 'Not found' });
  }
};

export const listExpenses = async (req, res) => {
  try {
    const result = await expenseService.getExpensesList(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('List Expenses Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const summary = await expenseService.getMonthlySummary();
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('Monthly Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getYearlySummary = async (req, res) => {
  try {
    const summary = await expenseService.getYearlySummary();
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('Yearly Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
