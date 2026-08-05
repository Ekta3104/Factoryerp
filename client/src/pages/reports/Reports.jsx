import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RiFileExcel2Line, RiFilePdfLine, RiRefreshLine } from 'react-icons/ri';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import InputField from '../../components/ui/InputField';
import { fetchReport, downloadReport } from '../../services/reportService';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (reportType === 'custom' && !startDate && !endDate) {
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
    }
    
    if (reportType !== 'custom' || (startDate && endDate)) {
      loadReport();
    }
  }, [reportType]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = reportType === 'custom' ? { startDate, endDate } : {};
      const data = await fetchReport(reportType, params);
      setReportData(data);
    } catch (error) {
      toast.error('Failed to load report data');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  const handleDownload = async (format) => {
    try {
      setDownloading(true);
      const params = reportType === 'custom' ? { startDate, endDate } : {};
      await downloadReport(reportType, format, params);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export ${format}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
      </div>

      <div className="reports-controls">
        <div className="report-type-selector">
          {['daily', 'weekly', 'monthly', 'custom'].map((type) => (
            <button 
              key={type}
              className={`report-type-btn ${reportType === type ? 'active' : ''}`}
              onClick={() => setReportType(type)}
            >
              {type === 'daily' ? 'Today' : type === 'weekly' ? 'This Week' : type === 'monthly' ? 'This Month' : 'Custom Range'}
            </button>
          ))}
        </div>

        {reportType === 'custom' && (
          <form className="custom-date-picker" onSubmit={handleCustomDateSubmit}>
            <InputField 
              type="date" 
              label="Start Date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              required
            />
            <InputField 
              type="date" 
              label="End Date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              required
            />
            <div style={{ marginTop: '1.5rem' }}>
              <Button type="submit" variant="secondary">Apply Range</Button>
            </div>
          </form>
        )}

        <div className="export-actions">
          <Button variant="secondary" onClick={loadReport} disabled={loading}>
            <RiRefreshLine size={18} />
            Refresh Data
          </Button>
          <Button
            variant="success"
            onClick={() => handleDownload('excel')}
            disabled={downloading || !reportData}
          >
            <RiFileExcel2Line size={18} />
            Export Excel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDownload('pdf')}
            disabled={downloading || !reportData}
          >
            <RiFilePdfLine size={18} />
            Export PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading report data...</p>
        </div>
      ) : reportData ? (
        <>
          {/* ── Summary Cards ─────────────────────────────── */}
          <div className="report-summary-cards">
            <div className="summary-card">
              <div className="summary-card-title">Total Inward Vehicles</div>
              <div className="summary-card-value">{reportData.vehicle_inward?.summary?.total_vehicles ?? 0}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-title">Total Weight Received</div>
              <div className="summary-card-value">{parseFloat(reportData.vehicle_inward?.summary?.total_weight_received ?? 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-title">Total Dispatches</div>
              <div className="summary-card-value">{reportData.dispatch?.summary?.total_dispatches ?? 0}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-title">Total Expenses</div>
              <div className="summary-card-value" style={{color: 'var(--color-error)'}}>
                ₹{parseFloat(reportData.expenses?.totals?.total_amount ?? 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* ── Raw Material Inventory ────────────────────── */}
          <div className="report-section">
            <div className="report-section-header">Raw Material Inventory</div>
            <Table 
              columns={[
                { header: 'Material', accessor: 'raw_material_name' },
                { header: 'Opening Stock', accessor: 'opening_stock', align: 'right' },
                { header: 'Received', accessor: 'received_in_period', align: 'right' },
                { header: 'Used in Production', accessor: 'used_in_period', align: 'right' },
                { header: 'Closing Stock', accessor: 'closing_stock', align: 'right' }
              ]} 
              data={reportData.inventory?.raw_materials || []} 
            />
          </div>

          {/* ── Ready Material Inventory ──────────────────── */}
          <div className="report-section">
            <div className="report-section-header">Ready Material Inventory</div>
            <Table 
              columns={[
                { header: 'Material', accessor: 'ready_material_name' },
                { header: 'Opening Stock', accessor: 'opening_stock', align: 'right' },
                { header: 'Produced', accessor: 'produced_in_period', align: 'right' },
                { header: 'Dispatched', accessor: 'dispatched_in_period', align: 'right' },
                { header: 'Closing Stock', accessor: 'closing_stock', align: 'right' }
              ]} 
              data={reportData.inventory?.ready_materials || []} 
            />
          </div>

          {/* ── Production by Shift ──────────────────────── */}
          <div className="report-section">
            <div className="report-section-header">Production by Shift</div>
            <Table 
              columns={[
                { header: 'Shift', accessor: 'shift' },
                { header: 'Batches', accessor: 'batch_count', align: 'right' },
                { header: 'Raw Material', accessor: 'raw_material_name' },
                { header: 'Ready Material', accessor: 'ready_material_name' },
                { header: 'Total Raw Used', accessor: 'total_raw_used', align: 'right' },
                { header: 'Total Produced', accessor: 'total_produced', align: 'right' }
              ]} 
              data={reportData.production?.by_shift || []} 
            />
          </div>

          {/* ── Vehicle Inward by Supplier ────────────────── */}
          <div className="report-section">
            <div className="report-section-header">Vehicle Inward by Supplier</div>
            <Table 
              columns={[
                { header: 'Supplier', accessor: 'supplier_name' },
                { header: 'Raw Material', accessor: 'raw_material_name' },
                { header: 'Total Vehicles', accessor: 'total_vehicles', align: 'right' },
                { header: 'Total Weight', accessor: 'total_weight_received', align: 'right' }
              ]} 
              data={reportData.vehicle_inward?.by_supplier || []} 
            />
          </div>

          {/* ── Dispatch by Customer ─────────────────────── */}
          <div className="report-section">
            <div className="report-section-header">Dispatch by Customer</div>
            <Table 
              columns={[
                { header: 'Customer', accessor: 'customer_name' },
                { header: 'Ready Material', accessor: 'ready_material_name' },
                { header: 'Total Dispatches', accessor: 'total_dispatches', align: 'right' },
                { header: 'Total Dispatched', accessor: 'total_dispatched', align: 'right' }
              ]} 
              data={reportData.dispatch?.by_customer || []} 
            />
          </div>

          {/* ── Expenses by Category ─────────────────────── */}
          <div className="report-section">
            <div className="report-section-header">Expenses by Category</div>
            <Table 
              columns={[
                { header: 'Category', accessor: 'category' },
                { header: 'Payment Type', accessor: 'payment_type' },
                { header: 'Entries', accessor: 'total_entries', align: 'right' },
                { header: 'Total Amount (₹)', accessor: 'total_amount', align: 'right' }
              ]} 
              data={reportData.expenses?.by_category || []} 
            />
          </div>

          {/* ── Expenses by Day ──────────────────────────── */}
          <div className="report-section">
            <div className="report-section-header">Expenses by Day</div>
            <Table 
              columns={[
                { header: 'Date', accessor: 'expense_day' },
                { header: 'Entries', accessor: 'total_entries', align: 'right' },
                { header: 'Total Amount (₹)', accessor: 'total_amount', align: 'right' }
              ]} 
              data={reportData.expenses?.by_day || []} 
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Reports;
