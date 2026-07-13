import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { createProduction, updateProduction } from '../../services/productionService';
import { fetchMasterOptions } from '../../services/masterService';

const ProductionForm = ({ isOpen, onClose, production, onSuccess }) => {
  const [options, setOptions] = useState({ rawMaterials: [], readyMaterials: [] });
  const [loading, setLoading] = useState(false);
  const isEditing = !!production;

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
          shift: 'Day',
          operator_name: '',
          machine: '',
          raw_material_id: '',
          ready_material_id: '',
          quantity_used: '',
          quantity_produced: '',
          remarks: ''
        });
      }
    }
  }, [isOpen, production, reset]);

  const loadOptions = async () => {
    try {
      const data = await fetchMasterOptions();
      setOptions({ rawMaterials: data.rawMaterials, readyMaterials: data.readyMaterials });
    } catch (error) {
      toast.error('Failed to load material options');
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEditing) {
        await updateProduction(production.id, data);
        toast.success('Production batch updated');
      } else {
        await createProduction(data);
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Edit Production Batch" : "New Production Batch"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
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
              <option value="Day">Day Shift</option>
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

        <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1.1rem', color: 'var(--color-brand-800)' }}>Materials</h3>
        
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Raw Material Used</label>
            <select 
              className="input-field"
              {...register('raw_material_id', { required: 'Raw Material is required' })}
              disabled={isEditing}
            >
              <option value="">Select Raw Material</option>
              {options.rawMaterials.map(rm => (
                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
              ))}
            </select>
            {errors.raw_material_id && <span className="input-error-text">{errors.raw_material_id.message}</span>}
          </div>

          <InputField 
            label="Quantity Used" 
            type="number" step="0.01"
            error={errors.quantity_used?.message}
            {...register('quantity_used', { required: 'Required', min: 0.01 })}
          />

          <div className="input-group">
            <label className="input-label">Ready Material Produced</label>
            <select 
              className="input-field"
              {...register('ready_material_id', { required: 'Ready Material is required' })}
              disabled={isEditing}
            >
              <option value="">Select Ready Material</option>
              {options.readyMaterials.map(rm => (
                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
              ))}
            </select>
            {errors.ready_material_id && <span className="input-error-text">{errors.ready_material_id.message}</span>}
          </div>

          <InputField 
            label="Quantity Produced" 
            type="number" step="0.01"
            error={errors.quantity_produced?.message}
            {...register('quantity_produced', { required: 'Required', min: 0.01 })}
          />
        </div>

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
