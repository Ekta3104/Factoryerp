import React, { useState, useEffect } from 'react';
import { partyService } from '../../services/partyService';
import { toast } from 'react-hot-toast';
import {
  RiUser3Line,
  RiSearchLine,
  RiPhoneLine,
  RiMailLine,
  RiUserAddLine,
} from 'react-icons/ri';
import Modal from '../../components/ui/Modal';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

const partyTypes = [
  'Employee',
  'Worker/Labour',
  'Contractor',
  'Supplier',
  'Driver',
  'Technician',
  'Consultant',
  'Customer',
  'Other',
];

const PartyProfiles = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('');
  const [selectedParty, setSelectedParty] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newParty, setNewParty] = useState({
    name: '',
    party_type: 'Employee',
    phone: '',
    email: '',
    tax_id: '',
  });

  useEffect(() => {
    fetchParties();
  }, [search, partyTypeFilter]);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const res = await partyService.getParties({ search, party_type: partyTypeFilter, limit: 100 });
      setParties(res.data?.parties || []);
    } catch (err) {
      toast.error('Failed to load party profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParty = async (e) => {
    e.preventDefault();
    if (!newParty.name || !newParty.party_type) {
      toast.error('Name and Party Type are required');
      return;
    }
    setSaving(true);
    try {
      await partyService.createParty(newParty);
      toast.success('Recipient profile created!');
      setIsAddModalOpen(false);
      setNewParty({ name: '', party_type: 'Employee', phone: '', email: '', tax_id: '' });
      fetchParties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create party');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recipient Profiles</h1>
          <p className="page-subtitle">Universal financial profiles for Employees, Labour, Contractors, Suppliers, and Drivers</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <RiUserAddLine size={18} />
          Create Recipient Profile
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <RiSearchLine />
          <input
            type="text"
            placeholder="Search by name, phone, email, or tax ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={partyTypeFilter} onChange={(e) => setPartyTypeFilter(e.target.value)} className="filter-select">
          <option value="">All Recipient Types</option>
          {partyTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Recipient Cards Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading recipient profiles…
        </div>
      ) : parties.length === 0 ? (
        <div className="table-empty-state">
          <p>No recipient profiles match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {parties.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedParty(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedParty(p);
                }
              }}
              role="button"
              tabIndex={0}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-md">
                    {p.party_type}
                  </span>
                </div>
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <RiUser3Line className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-500">
                {p.phone && <p className="flex items-center gap-1.5"><RiPhoneLine /> {p.phone}</p>}
                {p.email && <p className="flex items-center gap-1.5"><RiMailLine /> {p.email}</p>}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Outstanding Advance:</span>
                <span className="font-bold text-rose-600 text-sm">{fmt(p.total_outstanding_advance)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Recipient Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Recipient Profile" icon={RiUserAddLine} size="md">
        <form onSubmit={handleCreateParty}>
          <div className="form-grid">
            <div className="form-grid-full">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                placeholder="Name"
                value={newParty.name}
                onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="form-grid-full">
              <label className="input-label">Recipient Type *</label>
              <select
                value={newParty.party_type}
                onChange={(e) => setNewParty({ ...newParty, party_type: e.target.value })}
                className="input-field"
              >
                {partyTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Phone</label>
              <input
                type="text"
                placeholder="9876543210"
                value={newParty.phone}
                onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">PAN / GST / Tax ID</label>
              <input
                type="text"
                placeholder="Tax Identifier"
                value={newParty.tax_id}
                onChange={(e) => setNewParty({ ...newParty, tax_id: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="form-grid-full">
              <label className="input-label">Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={newParty.email}
                onChange={(e) => setNewParty({ ...newParty, email: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Recipient Detail Modal */}
      <Modal
        isOpen={!!selectedParty}
        onClose={() => setSelectedParty(null)}
        title={selectedParty?.name || ''}
        subtitle={selectedParty?.party_type}
        icon={RiUser3Line}
        size="md"
      >
        {selectedParty && (
          <div className="space-y-4">
            <div className="callout callout-info">
              <span className="callout-label">Outstanding Advance Balance</span>
              <span className="callout-value">{fmt(selectedParty.total_outstanding_advance)}</span>
            </div>
            <div className="space-y-2 text-sm">
              {selectedParty.phone && (
                <p className="flex items-center gap-2 text-slate-700"><RiPhoneLine /> {selectedParty.phone}</p>
              )}
              {selectedParty.email && (
                <p className="flex items-center gap-2 text-slate-700"><RiMailLine /> {selectedParty.email}</p>
              )}
              {selectedParty.tax_id && (
                <p className="text-slate-500 text-xs">PAN / GST / Tax ID: <span className="text-slate-700 font-medium">{selectedParty.tax_id}</span></p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PartyProfiles;
