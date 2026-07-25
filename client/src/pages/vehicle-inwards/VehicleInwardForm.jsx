import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { createInward, updateInward } from '../../services/vehicleInwardService';
import { fetchMasterOptions } from '../../services/masterService';

const VehicleInwardForm = ({ isOpen, onClose, inward, onSuccess }) => {
  const [options, setOptions] = useState({ suppliers: [], rawMaterials: [] });
  const [loading, setLoading] = useState(false);
  const isEditing = !!inward;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const rawMaterialId = watch('raw_material_id');
  const selectedRawMaterial = options.rawMaterials.find((rm) => rm.id === rawMaterialId);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (inward) {
        // Format datetime for datetime-local input
        const formattedDate = new Date(inward.entry_time).toISOString().slice(0, 16);
        reset({
          ...inward,
          entry_time: formattedDate
        });
      } else {
        reset({
          vehicle_number: '',
          driver_name: '',
          supplier_id: '',
          raw_material_id: '',
          quantity_received: '',
          entry_time: new Date().toISOString().slice(0, 16),
          diesel_expense: 0,
          toll_expense: 0,
          driver_expense: 0,
          jcb_unloading_charges: 0,
          jcb_diesel_charges: 0,
          remarks: ''
        });
      }
    }
  }, [isOpen, inward, reset]);

  const loadOptions = async () => {
    try {
      const data = await fetchMasterOptions();
      setOptions({ suppliers: data.suppliers, rawMaterials: data.rawMaterials });
    } catch (error) {
      toast.error('Failed to load dropdown options');
    }
  };

  // Belt-and-suspenders guard: the browser can trigger an implicit form
  // submit from places other than a deliberate click on the Save button
  // (Enter in a field, autofill accepting a suggestion, completing a
  // datetime-local value, etc). Only allow the submit through if it was
  // set in motion by an explicit interaction with the Save button itself.
  const submitIntentRef = useRef(false);

  const armSubmit = () => {
    submitIntentRef.current = true;
  };

  const guardedSubmit = (e) => {
    if (!submitIntentRef.current) {
      e.preventDefault();
      return;
    }
    submitIntentRef.current = false;
    return handleSubmit(onSubmit)(e);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEditing) {
        await updateInward(inward.id, data);
        toast.success('Vehicle Inward updated');
      } else {
        await createInward(data);
        toast.success('Vehicle Inward created');
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
      title={isEditing ? "Edit Vehicle Inward" : "New Vehicle Inward"}
      size="lg"
    >
      <form onSubmit={guardedSubmit}>
        <div className="form-grid">
          <InputField 
            label="Vehicle Number" 
            placeholder="e.g. MH-12-AB-1234"
            error={errors.vehicle_number?.message}
            {...register('vehicle_number', { required: 'Vehicle number is required' })}
          />
          <InputField 
            label="Driver Name" 
            placeholder="Optional"
            error={errors.driver_name?.message}
            {...register('driver_name')}
          />
          
          <div className="input-group">
            <label className="input-label">Supplier</label>
            <select 
              className="input-field"
              {...register('supplier_id', { required: 'Supplier is required' })}
            >
              <option value="">Select Supplier</option>
              {options.suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.supplier_id && <span className="input-error-text">{errors.supplier_id.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Raw Material</label>
            <select 
              className="input-field"
              {...register('raw_material_id', { required: 'Raw Material is required' })}
              disabled={isEditing} // Cannot change material after creation
            >
              <option value="">Select Raw Material</option>
              {options.rawMaterials.map(rm => (
                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
              ))}
            </select>
            {errors.raw_material_id && <span className="input-error-text">{errors.raw_material_id.message}</span>}
            {isEditing && <span style={{fontSize: '0.75rem', color: 'var(--color-muted)'}}>Cannot change material for existing inward.</span>}
          </div>

          <InputField
            label="Quantity Received"
            type="number"
            step="0.01"
            unit={selectedRawMaterial?.unit}
            error={errors.quantity_received?.message}
            {...register('quantity_received', { required: 'Quantity is required', min: 0.01 })}
          />
          
          <InputField 
            label="Entry Time" 
            type="datetime-local"
            error={errors.entry_time?.message}
            {...register('entry_time', { required: 'Entry time is required' })}
          />
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1.1rem', color: 'var(--color-brand-800)' }}>Expenses</h3>
        
        <div className="form-grid">
          <InputField 
            label="Vehicle Diesel (₹)" 
            type="number" step="0.01"
            {...register('diesel_expense', { valueAsNumber: true })}
          />
          <InputField 
            label="Vehicle Toll (₹)" 
            type="number" step="0.01"
            {...register('toll_expense', { valueAsNumber: true })}
          />
          <InputField 
            label="Driver Expense (₹)" 
            type="number" step="0.01"
            {...register('driver_expense', { valueAsNumber: true })}
          />
          <InputField 
            label="JCB Unloading (₹)" 
            type="number" step="0.01"
            {...register('jcb_unloading_charges', { valueAsNumber: true })}
          />
          <InputField 
            label="JCB Diesel (₹)" 
            type="number" step="0.01"
            {...register('jcb_diesel_charges', { valueAsNumber: true })}
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
          <Button variant="primary" type="submit" onClick={armSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Inward'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleInwardForm;
