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
    { header: 'Raw Material', accessor: 'raw_material_name' },
    { header: 'Qty Used', accessor: 'quantity_used', align: 'right' },
    { header: 'Ready Material', accessor: 'ready_material_name' },
    { header: 'Qty Produced', accessor: 'quantity_produced', align: 'right' },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => handleEdit(row)}
            style={{ background: 'none', border: 'none', color: 'var(--color-brand-600)', cursor: 'pointer' }}
          >
            <RiEdit2Line size={18} />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer' }}
          >
            <RiDeleteBinLine size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Production</h1>
        <Button variant="primary" onClick={() => { setEditingProduction(null); setIsFormOpen(true); }}>
          <RiAddLine size={20} />
          New Batch
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>Loading...</div>
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
