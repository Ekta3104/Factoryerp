import React, { useState, useEffect } from 'react';
import { financialReportService } from '../../services/financialReportService';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-hot-toast';
import { 
  RiFileList2Line, 
  RiShieldCheckLine, 
  RiFileExcelLine, 
  RiFilePdfLine,
  RiRefreshLine
} from 'react-icons/ri';

const FinancialLedgerAudit = () => {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' or 'audit'
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ledger') {
        const res = await financialReportService.getLedger({ limit: 100 });
        setTransactions(res.data?.transactions || []);
      } else {
        const res = await financialReportService.getAuditLogs({ limit: 100 });
        setAuditLogs(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load ledger logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Immutable Financial Ledger & Audit Trail</h1>
          <p className="text-sm text-slate-500">Append-only audit logs and double-entry transaction ledger</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={financialReportService.getAdvanceExportExcelUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
          >
            <RiFileExcelLine className="w-4 h-4" />
            Export Advance Excel
          </a>
          <a
            href={financialReportService.getSalaryExportExcelUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
          >
            <RiFileExcelLine className="w-4 h-4" />
            Export Salary Excel
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RiFileList2Line className="w-4 h-4" />
          Financial Transaction Ledger
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RiShieldCheckLine className="w-4 h-4" />
          System Audit Logs
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        {activeTab === 'ledger' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Txn #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Entry Type</th>
                  <th className="py-2.5 px-3">Debit (₹)</th>
                  <th className="py-2.5 px-3">Credit (₹)</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{t.transaction_number}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(t.transaction_date).toLocaleString()}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {t.party_name}
                      <span className="block text-[11px] font-normal text-slate-400">{t.party_type}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600">
                      {parseFloat(t.debit_amount || 0) > 0 ? `₹${parseFloat(t.debit_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600">
                      {parseFloat(t.credit_amount || 0) > 0 ? `₹${parseFloat(t.credit_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{t.payment_method || '-'}</td>
                    <td className="py-3 px-3 text-slate-500">{t.reference_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">State Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{log.entity_name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{log.user_name || 'System'}</td>
                    <td className="py-3 px-3 text-xs text-slate-500 font-mono">
                      {JSON.stringify(log.new_state || log.old_state)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialLedgerAudit;
