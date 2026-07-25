import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { createDispatch, updateDispatch } from '../../services/dispatchService';
import { fetchMasterOptions } from '../../services/masterService';

const DispatchForm = ({ isOpen, onClose, dispatchRecord, onSuccess }) => {
  const [options, setOptions] = useState({ customers: [], readyMaterials: [] });
  const [loading, setLoading] = useState(false);
  const isEditing = !!dispatchRecord;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const readyMaterialId = watch('ready_material_id');
  const selectedReadyMaterial = options.readyMaterials.find((rm) => rm.id === readyMaterialId);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (dispatchRecord) {
        const formattedDate = new Date(dispatchRecord.dispatch_date).toISOString().slice(0, 16);
        reset({
          ...dispatchRecord,
          dispatch_date: formattedDate
        });
      } else {
        reset({
          customer_id: '',
          ready_material_id: '',
          vehicle_number: '',
          driver_name: '',
          quantity_dispatched: '',
          dispatch_date: new Date().toISOString().slice(0, 16),
          destination: '',
          remarks: ''
        });
      }
    }
  }, [isOpen, dispatchRecord, reset]);

  const loadOptions = async () => {
    try {
      const data = await fetchMasterOptions();
      setOptions({ customers: data.customers, readyMaterials: data.readyMaterials });
    } catch (error) {
      toast.error('Failed to load dropdown options');
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEditing) {
        await updateDispatch(dispatchRecord.id, data);
        toast.success('Dispatch updated');
      } else {
        await createDispatch(data);
        toast.success('Dispatch created');
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
      title={isEditing ? "Edit Dispatch" : "New Dispatch"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEnterSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Customer</label>
            <select 
              className="input-field"
              {...register('customer_id', { required: 'Customer is required' })}
            >
              <option value="">Select Customer</option>
              {options.customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.customer_id && <span className="input-error-text">{errors.customer_id.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Ready Material</label>
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
            label="Vehicle Number" 
            placeholder="e.g. MH-14-XY-9876"
            error={errors.vehicle_number?.message}
            {...register('vehicle_number', { required: 'Vehicle number is required' })}
          />
          
          <InputField 
            label="Driver Name" 
            placeholder="Optional"
            {...register('driver_name')}
          />
          
          <InputField
            label="Quantity Dispatched"
            type="number" step="0.01"
            unit={selectedReadyMaterial?.unit}
            error={errors.quantity_dispatched?.message}
            {...register('quantity_dispatched', { required: 'Quantity is required', min: 0.01 })}
          />
          
          <InputField 
            label="Dispatch Date & Time" 
            type="datetime-local"
            error={errors.dispatch_date?.message}
            {...register('dispatch_date', { required: 'Dispatch date is required' })}
          />
          
          <InputField 
            label="Destination" 
            placeholder="e.g. Mumbai Warehouse"
            {...register('destination')}
          />

          <InputField 
            label="Remarks" 
            placeholder="Any additional notes..."
            {...register('remarks')}
          />
        </div>

        <div className="form-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Dispatch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DispatchForm;
