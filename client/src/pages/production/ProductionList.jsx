import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RiAddLine, RiDeleteBinLine, RiEdit2Line } from 'react-icons/ri';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import ProductionForm from './ProductionForm';
import { listProductions, deleteProduction } from '../../services/productionService';

const ProductionList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await listProductions({ limit: 50 });
      setData(res.data || []);
    } catch (error) {
      toast.error('Failed to load production batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (production) => {
    setEditingProduction(production);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch? It will revert stock balances for both Raw and Ready materials.')) return;
    try {
      await deleteProduction(id);
      toast.success('Production batch deleted');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    { header: 'Batch No.', accessor: 'batch_number' },
    { 
      header: 'Date', 
      accessor: 'production_date',
      cell: (row) => new Date(row.production_date).toLocaleString('en-IN')
    },
    { header: 'Shift', accessor: 'shift' },
    { header: 'Formula', accessor: 'formula_name' },
    { header: 'Ready Material', accessor: 'ready_material_name' },
    { header: 'Qty Produced', accessor: 'quantity_produced', align: 'right' },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="table-actions">
          <button
            onClick={() => handleEdit(row)}
            className="icon-action-btn"
            aria-label="Edit production batch"
            title="Edit"
          >
            <RiEdit2Line size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="icon-action-btn icon-action-btn--danger"
            aria-label="Delete production batch"
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
        <h1 className="page-title">Production</h1>
        <Button variant="primary" onClick={() => { setEditingProduction(null); setIsFormOpen(true); }}>
          <RiAddLine size={20} />
          New Batch
        </Button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading production batches...</p>
        </div>
      ) : (
        <Table columns={columns} data={data} keyField="id" />
      )}

      {isFormOpen && (
        <ProductionForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          production={editingProduction}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default ProductionList;
