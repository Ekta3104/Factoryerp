import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RiAddLine, RiDeleteBinLine, RiEdit2Line } from 'react-icons/ri';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import DispatchForm from './DispatchForm';
import { listDispatches, deleteDispatch } from '../../services/dispatchService';

const DispatchList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await listDispatches({ limit: 50 });
      setData(res.data || []);
    } catch (error) {
      toast.error('Failed to load dispatches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (dispatchRecord) => {
    setEditingDispatch(dispatchRecord);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dispatch? It will revert the ready material stock balance.')) return;
    try {
      await deleteDispatch(id);
      toast.success('Dispatch deleted');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    { header: 'Vehicle No.', accessor: 'vehicle_number' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Material', accessor: 'ready_material_name' },
    { header: 'Qty', accessor: 'quantity_dispatched', align: 'right' },
    { 
      header: 'Date', 
      accessor: 'dispatch_date',
      cell: (row) => new Date(row.dispatch_date).toLocaleString('en-IN')
    },
    { header: 'Destination', accessor: 'destination' },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="table-actions">
          <button
            onClick={() => handleEdit(row)}
            className="icon-action-btn"
            aria-label="Edit dispatch"
            title="Edit"
          >
            <RiEdit2Line size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="icon-action-btn icon-action-btn--danger"
            aria-label="Delete dispatch"
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
        <h1 className="page-title">Dispatches</h1>
        <Button variant="primary" onClick={() => { setEditingDispatch(null); setIsFormOpen(true); }}>
          <RiAddLine size={20} />
          New Dispatch
        </Button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dispatches...</p>
        </div>
      ) : (
        <Table columns={columns} data={data} keyField="id" />
      )}

      {isFormOpen && (
        <DispatchForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          dispatchRecord={editingDispatch}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default DispatchList;
