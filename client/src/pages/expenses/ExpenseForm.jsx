import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { createExpense, updateExpense } from '../../services/expenseService';

const ExpenseForm = ({ isOpen, onClose, expense, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!expense;

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        const formattedDate = new Date(expense.expense_date).toISOString().slice(0, 16);
        reset({
          ...expense,
          expense_date: formattedDate
        });
      } else {
        reset({
          category: 'Maintenance',
          amount: '',
          description: '',
          expense_date: new Date().toISOString().slice(0, 16),
          payment_type: 'Cash',
          reference_number: '',
          remarks: ''
        });
      }
    }
  }, [isOpen, expense, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEditing) {
        await updateExpense(expense.id, data);
        toast.success('Expense updated');
      } else {
        await createExpense(data);
        toast.success('Expense created');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Pressing Enter inside a text/number/date input would otherwise submit
  // the form as soon as the required fields are filled, closing the modal
  // before the user reaches the rest of the fields.
  const preventEnterSubmit = (e) => {
    if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
      e.preventDefault();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Expense" : "New Expense"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEnterSubmit}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          
          <div className="input-group">
            <label className="input-label">Category</label>
            <select 
              className="input-field"
              {...register('category', { required: 'Category is required' })}
            >
              <option value="Electricity">Electricity</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Salary">Salary</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && <span className="input-error-text">{errors.category.message}</span>}
          </div>

          <InputField 
            label="Amount (₹)" 
            type="number" step="0.01"
            error={errors.amount?.message}
            {...register('amount', { required: 'Amount is required', min: 0.01 })}
          />

          <InputField 
            label="Description" 
            placeholder="What was this expense for?"
            error={errors.description?.message}
            {...register('description', { required: 'Description is required' })}
          />
          
          <InputField 
            label="Expense Date & Time" 
            type="datetime-local"
            error={errors.expense_date?.message}
            {...register('expense_date', { required: 'Date is required' })}
          />

          <div className="input-group">
            <label className="input-label">Payment Type</label>
            <select 
              className="input-field"
              {...register('payment_type')}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <InputField 
            label="Reference / Transaction Number" 
            placeholder="Optional"
            {...register('reference_number')}
          />

          <InputField 
            label="Remarks" 
            placeholder="Additional notes..."
            {...register('remarks')}
          />
        </div>

        <div className="form-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseForm;
