import React, { useState, useEffect } from 'react';
import { partyService } from '../../services/partyService';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-hot-toast';
import { 
  RiUser3Line, 
  RiSearchLine, 
  RiPhoneLine, 
  RiMailLine, 
  RiUserAddLine,
  RiBankCardLine
} from 'react-icons/ri';

const PartyProfiles = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('');
  const [selectedParty, setSelectedParty] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    try {
      await partyService.createParty(newParty);
      toast.success('Recipient profile created!');
      setIsAddModalOpen(false);
      setNewParty({ name: '', party_type: 'Employee', phone: '', email: '', tax_id: '' });
      fetchParties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create party');
    }
  };

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recipient Profiles</h1>
          <p className="text-sm text-slate-500">Universal financial profiles for Employees, Labour, Contractors, Suppliers, and Drivers</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
        >
          <RiUserAddLine className="w-5 h-5" />
          + Create Recipient Profile
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or tax ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={partyTypeFilter}
          onChange={(e) => setPartyTypeFilter(e.target.value)}
          className="w-full md:w-56 px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Recipient Types</option>
          {partyTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parties.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedParty(p)}
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
              <span className="font-bold text-rose-600 text-sm">
                ₹{parseFloat(p.total_outstanding_advance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Recipient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Create Recipient Profile</h3>
            <form onSubmit={handleCreateParty} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newParty.name}
                  onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Recipient Type *</label>
                <select
                  value={newParty.party_type}
                  onChange={(e) => setNewParty({ ...newParty, party_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                >
                  {partyTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={newParty.phone}
                    onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">PAN / GST / Tax ID</label>
                  <input
                    type="text"
                    placeholder="Tax Identifier"
                    value={newParty.tax_id}
                    onChange={(e) => setNewParty({ ...newParty, tax_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-blue-600 text-white font-semibold rounded-xl shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyProfiles;
