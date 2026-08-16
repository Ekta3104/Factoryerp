import React, { useState, useEffect } from 'react';
import { financialReportService } from '../../services/financialReportService';
import { toast } from 'react-hot-toast';
import {
  RiFileList2Line,
  RiShieldCheckLine,
  RiFileExcelLine,
} from 'react-icons/ri';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

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
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Immutable Financial Ledger & Audit Trail</h1>
          <p className="page-subtitle">Append-only audit logs and double-entry transaction ledger</p>
        </div>

        <div className="page-header-actions">
          <a
            href={financialReportService.getAdvanceExportExcelUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success"
          >
            <RiFileExcelLine size={16} />
            Export Advance Excel
          </a>
          <a
            href={financialReportService.getSalaryExportExcelUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <RiFileExcelLine size={16} />
            Export Salary Excel
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }} role="tablist" aria-label="Ledger and audit views">
        <button
          role="tab"
          aria-selected={activeTab === 'ledger'}
          onClick={() => setActiveTab('ledger')}
          className="flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all"
          style={{
            borderBottom: `2px solid ${activeTab === 'ledger' ? 'var(--color-brand-600)' : 'transparent'}`,
            color: activeTab === 'ledger' ? 'var(--color-brand-600)' : 'var(--color-text-secondary)',
          }}
        >
          <RiFileList2Line className="w-4 h-4" />
          Financial Transaction Ledger
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'audit'}
          onClick={() => setActiveTab('audit')}
          className="flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all"
          style={{
            borderBottom: `2px solid ${activeTab === 'audit' ? 'var(--color-brand-600)' : 'transparent'}`,
            color: activeTab === 'audit' ? 'var(--color-brand-600)' : 'var(--color-text-secondary)',
          }}
        >
          <RiShieldCheckLine className="w-4 h-4" />
          System Audit Logs
        </button>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading {activeTab === 'ledger' ? 'transaction ledger' : 'audit logs'}…
        </div>
      ) : activeTab === 'ledger' ? (
        transactions.length === 0 ? (
          <div className="table-empty-state">
            <p>No ledger transactions recorded yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Txn #</th>
                  <th>Date</th>
                  <th>Recipient</th>
                  <th>Entry Type</th>
                  <th>Debit (₹)</th>
                  <th>Credit (₹)</th>
                  <th>Method</th>
                  <th>Reference #</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold text-slate-900">{t.transaction_number}</td>
                    <td className="text-slate-500">{new Date(t.transaction_date).toLocaleString()}</td>
                    <td className="font-medium text-slate-900">
                      {t.party_name}
                      <span className="block text-[11px] font-normal text-slate-400">{t.party_type}</span>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {t.transaction_type}
                      </span>
                    </td>
                    <td className="font-bold text-rose-600">
                      {parseFloat(t.debit_amount || 0) > 0 ? fmt(t.debit_amount) : '-'}
                    </td>
                    <td className="font-bold text-emerald-600">
                      {parseFloat(t.credit_amount || 0) > 0 ? fmt(t.credit_amount) : '-'}
                    </td>
                    <td>{t.payment_method || '-'}</td>
                    <td className="text-slate-500">{t.reference_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : auditLogs.length === 0 ? (
        <div className="table-empty-state">
          <p>No audit log entries recorded yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Entity</th>
                <th>Action</th>
                <th>User</th>
                <th>State Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="font-semibold text-slate-900">{log.entity_name}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700">
                      {log.action}
                    </span>
                  </td>
                  <td>{log.user_name || 'System'}</td>
                  <td className="text-xs text-slate-500 font-mono">
                    {JSON.stringify(log.new_state || log.old_state)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinancialLedgerAudit;
