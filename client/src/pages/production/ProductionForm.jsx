import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { createProduction, updateProduction } from '../../services/productionService';
import { fetchMasterOptions } from '../../services/masterService';

const ProductionForm = ({ isOpen, onClose, production, onSuccess }) => {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!production;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const formulaId = watch('formula_id');
  const quantityProduced = watch('quantity_produced');
  const selectedFormula = formulas.find((f) => f.id === formulaId);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (production) {
        const formattedDate = new Date(production.production_date).toISOString().slice(0, 16);
        reset({
          ...production,
          production_date: formattedDate
        });
      } else {
        reset({
          batch_number: '',
          production_date: new Date().toISOString().slice(0, 16),
          shift: 'Morning',
          operator_name: '',
          machine: '',
          formula_id: '',
          quantity_produced: '',
          remarks: ''
        });
      }
    }
  }, [isOpen, production, reset]);

  const loadOptions = async () => {
    try {
      const data = await fetchMasterOptions();
      setFormulas(data.formulas || []);
    } catch (error) {
      toast.error('Failed to load formula options');
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        batch_number: data.batch_number,
        production_date: data.production_date,
        shift: data.shift,
        operator_name: data.operator_name,
        machine: data.machine,
        formula_id: data.formula_id,
        quantity_produced: data.quantity_produced,
        remarks: data.remarks
      };
      if (isEditing) {
        await updateProduction(production.id, payload);
        toast.success('Production batch updated');
      } else {
        await createProduction(payload);
        toast.success('Production batch created');
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

  // quantityProduced is a bag count; convert to tons via the ready material's
  // pack size before scaling the formula (which is defined per ton).
  const packSize = selectedFormula?.pack_size_kg ? parseFloat(selectedFormula.pack_size_kg) : 0;
  const producedTons = selectedFormula && quantityProduced && packSize
    ? (parseFloat(quantityProduced) * packSize) / 1000
    : 0;
  const scale = selectedFormula && quantityProduced && parseFloat(selectedFormula.output_quantity) > 0
    ? producedTons / parseFloat(selectedFormula.output_quantity)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Production Batch" : "New Production Batch"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEnterSubmit}>
        <div className="form-grid">
          <InputField
            label="Batch Number"
            placeholder="e.g. BATCH-001"
            error={errors.batch_number?.message}
            {...register('batch_number', { required: 'Batch number is required' })}
          />
          <InputField
            label="Production Date"
            type="datetime-local"
            error={errors.production_date?.message}
            {...register('production_date', { required: 'Date is required' })}
          />

          <div className="input-group">
            <label className="input-label">Shift</label>
            <select
              className="input-field"
              {...register('shift', { required: 'Shift is required' })}
            >
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
              <option value="Night">Night Shift</option>
            </select>
            {errors.shift && <span className="input-error-text">{errors.shift.message}</span>}
          </div>

          <InputField
            label="Operator Name"
            placeholder="Optional"
            {...register('operator_name')}
          />

          <InputField
            label="Machine"
            placeholder="Optional"
            {...register('machine')}
          />
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1.1rem', color: 'var(--color-brand-800)' }}>Formula</h3>

        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Formula</label>
            <select
              className="input-field"
              {...register('formula_id', { required: 'Formula is required' })}
              disabled={isEditing}
            >
              <option value="">Select Formula</option>
              {formulas.map((f) => (
                <option key={f.id} value={f.id}>{f.name} &rarr; {f.ready_material_name} ({f.ready_material_unit})</option>
              ))}
            </select>
            {errors.formula_id && <span className="input-error-text">{errors.formula_id.message}</span>}
          </div>

          <InputField
            label="Quantity Produced"
            type="number" step="1"
            unit={selectedFormula?.ready_material_unit}
            error={errors.quantity_produced?.message}
            {...register('quantity_produced', { required: 'Required', min: 0.01 })}
          />
        </div>

        {selectedFormula && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--color-brand-50)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Raw materials required</div>
            {!quantityProduced ? (
              <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Enter quantity produced to see the breakdown.</div>
            ) : (
              <>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>
                  = {producedTons.toFixed(2)} t of {selectedFormula.ready_material_name}
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {selectedFormula.ingredients.map((ing) => (
                    <li key={ing.raw_material_id}>
                      {ing.raw_material_name}: {(parseFloat(ing.quantity) * scale).toFixed(2)} t
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <InputField
            label="Remarks"
            placeholder="Any additional notes..."
            {...register('remarks')}
          />
        </div>

        <div className="form-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Batch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductionForm;
