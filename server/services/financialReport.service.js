import { pool } from '../config/db.js';
import { FinancialLedgerModel } from '../models/financialLedger.model.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const FinancialReportService = {
  async getDashboardSummary() {
    const advanceSummaryRes = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_disbursed,
        COALESCE(SUM(adjusted_amount), 0) AS total_adjusted,
        COALESCE(SUM(refunded_amount), 0) AS total_refunded,
        COALESCE(SUM(outstanding_balance), 0) AS total_outstanding
      FROM advances
      WHERE status != 'Reversed'
    `);

    const salarySummaryRes = await pool.query(`
      SELECT 
        COALESCE(SUM(gross_salary), 0) AS total_gross_salary,
        COALESCE(SUM(paid_amount), 0) AS total_paid_salary,
        COALESCE(SUM(pending_balance), 0) AS total_pending_salary
      FROM employee_salaries
      WHERE status != 'Cancelled'
    `);

    const outstandingByPartyRes = await pool.query(`
      SELECT 
        p.id AS party_id,
        p.name AS party_name,
        p.party_type,
        p.phone,
        COALESCE(SUM(a.outstanding_balance), 0) AS total_outstanding
      FROM advance_parties p
      JOIN advances a ON p.id = a.party_id
      WHERE a.status IN ('Active', 'Partially Adjusted') AND a.outstanding_balance > 0
      GROUP BY p.id, p.name, p.party_type, p.phone
      ORDER BY total_outstanding DESC
      LIMIT 10
    `);

    const recentTransactionsRes = await pool.query(`
      SELECT ft.*, p.name AS party_name, p.party_type
      FROM financial_transactions ft
      JOIN advance_parties p ON ft.party_id = p.id
      ORDER BY ft.transaction_date DESC
      LIMIT 10
    `);

    return {
      advances: advanceSummaryRes.rows[0],
      salaries: salarySummaryRes.rows[0],
      topOutstandingParties: outstandingByPartyRes.rows,
      recentTransactions: recentTransactionsRes.rows,
    };
  },

  async getLedger(params) {
    return await FinancialLedgerModel.getLedgerTransactions(params);
  },

  async getAuditLogs(params) {
    return await FinancialLedgerModel.getAuditLogs(params);
  },

  async exportAdvanceRegisterExcel(res) {
    const advancesRes = await pool.query(`
      SELECT a.*, p.name AS party_name, p.party_type, c.name AS category_name
      FROM advances a
      JOIN advance_parties p ON a.party_id = p.id
      LEFT JOIN advance_categories c ON a.category_id = c.id
      ORDER BY a.disbursement_date DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Advance Register');

    worksheet.columns = [
      { header: 'Advance #', key: 'advance_number', width: 18 },
      { header: 'Date', key: 'disbursement_date', width: 14 },
      { header: 'Recipient Name', key: 'party_name', width: 25 },
      { header: 'Recipient Type', key: 'party_type', width: 16 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Adjusted (₹)', key: 'adjusted_amount', width: 15 },
      { header: 'Refunded (₹)', key: 'refunded_amount', width: 15 },
      { header: 'Outstanding (₹)', key: 'outstanding_balance', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment Method', key: 'payment_method', width: 16 },
      { header: 'Reference #', key: 'reference_number', width: 20 },
      { header: 'Reason', key: 'reason', width: 30 },
    ];

    advancesRes.rows.forEach((row) => {
      worksheet.addRow({
        ...row,
        disbursement_date: row.disbursement_date ? new Date(row.disbursement_date).toISOString().split('T')[0] : '',
        amount: parseFloat(row.amount || 0),
        adjusted_amount: parseFloat(row.adjusted_amount || 0),
        refunded_amount: parseFloat(row.refunded_amount || 0),
        outstanding_balance: parseFloat(row.outstanding_balance || 0),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Advance_Register.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  },

  async exportSalaryRegisterExcel(res) {
    const salaryRes = await pool.query(`
      SELECT es.*, p.name AS party_name, p.party_type, sc.cycle_name
      FROM employee_salaries es
      JOIN advance_parties p ON es.party_id = p.id
      JOIN salary_cycles sc ON es.salary_cycle_id = sc.id
      ORDER BY es.created_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Salary Register');

    worksheet.columns = [
      { header: 'Cycle Name', key: 'cycle_name', width: 20 },
      { header: 'Employee / Recipient', key: 'party_name', width: 25 },
      { header: 'Party Type', key: 'party_type', width: 16 },
      { header: 'Gross Salary (₹)', key: 'gross_salary', width: 18 },
      { header: 'Deductions (₹)', key: 'total_deductions', width: 16 },
      { header: 'Net Salary (₹)', key: 'net_salary', width: 18 },
      { header: 'Paid Amount (₹)', key: 'paid_amount', width: 18 },
      { header: 'Pending Balance (₹)', key: 'pending_balance', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    salaryRes.rows.forEach((row) => {
      worksheet.addRow({
        ...row,
        gross_salary: parseFloat(row.gross_salary || 0),
        total_deductions: parseFloat(row.total_deductions || 0),
        net_salary: parseFloat(row.net_salary || 0),
        paid_amount: parseFloat(row.paid_amount || 0),
        pending_balance: parseFloat(row.pending_balance || 0),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Salary_Register.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  },

  async exportAdvanceRegisterPDF(res) {
    const advancesRes = await pool.query(`
      SELECT a.*, p.name AS party_name, p.party_type
      FROM advances a
      JOIN advance_parties p ON a.party_id = p.id
      ORDER BY a.disbursement_date DESC
    `);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Advance_Register.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('FactoryERP - Universal Advance Register', { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Advance Transactions:', { underline: true });
    doc.moveDown(0.5);

    advancesRes.rows.forEach((adv, i) => {
      doc.fontSize(9).text(
        `${i + 1}. [${adv.advance_number}] ${adv.party_name} (${adv.party_type}) | Disbursed: ₹${adv.amount} | Outstanding: ₹${adv.outstanding_balance} | Status: ${adv.status}`
      );
    });

    doc.end();
  },
};
