import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RiAddLine, RiDeleteBinLine, RiEdit2Line } from 'react-icons/ri';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import VehicleInwardForm from './VehicleInwardForm';
import { listInwards, deleteInward } from '../../services/vehicleInwardService';

const VehicleInwardsList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInward, setEditingInward] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await listInwards({ limit: 50 }); // Fetching top 50 for now
      setData(res.data || []);
    } catch (error) {
      toast.error('Failed to load inwards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (inward) => {
    setEditingInward(inward);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inward? It will revert the stock.')) return;
    try {
      await deleteInward(id);
      toast.success('Inward deleted');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    { header: 'Vehicle No', accessor: 'vehicle_number' },
    { header: 'Supplier', accessor: 'supplier_name' },
    { header: 'Material', accessor: 'raw_material_name' },
    {
      header: 'Quantity Received',
      accessor: 'quantity_received',
      align: 'right',
      cell: (row) => (
        <>
          {row.quantity_received}
          {row.raw_material_unit && <span className="unit-badge">{row.raw_material_unit}</span>}
        </>
      )
    },
    { 
      header: 'Entry Time', 
      accessor: 'entry_time',
      cell: (row) => new Date(row.entry_time).toLocaleString('en-IN')
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="table-actions">
          <button
            onClick={() => handleEdit(row)}
            className="icon-action-btn"
            aria-label="Edit vehicle inward"
            title="Edit"
          >
            <RiEdit2Line size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="icon-action-btn icon-action-btn--danger"
            aria-label="Delete vehicle inward"
            title="Delete"
          >
            <RiDeleteBinLine size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vehicle Inwards</h1>
        <Button variant="primary" onClick={() => { setEditingInward(null); setIsFormOpen(true); }}>
          <RiAddLine size={20} />
          New Inward
        </Button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading vehicle inwards...</p>
        </div>
      ) : (
        <Table columns={columns} data={data} keyField="id" />
      )}

      {isFormOpen && (
        <VehicleInwardForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          inward={editingInward}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default VehicleInwardsList;
