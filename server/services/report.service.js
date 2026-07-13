import { pool } from '../config/db.js';
import { ReportModel } from '../models/report.model.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// =============================================
// DATE RANGE HELPERS
// =============================================

/**
 * Returns [startDate, endDate] as UTC-aware ISO strings
 * anchored to Asia/Kolkata day boundaries.
 */
export const buildDateRange = (preset, startDate, endDate) => {
  const IST_OFFSET = '+05:30';

  if (preset === 'custom') {
    if (!startDate || !endDate) throw new Error('startDate and endDate are required for custom reports');
    return [
      new Date(`${startDate}T00:00:00${IST_OFFSET}`).toISOString(),
      new Date(`${endDate}T23:59:59.999${IST_OFFSET}`).toISOString(),
    ];
  }

  const now = new Date();
  // Get today's date in IST
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const year = istNow.getFullYear();
  const month = String(istNow.getMonth() + 1).padStart(2, '0');
  const day = String(istNow.getDate()).padStart(2, '0');

  if (preset === 'daily') {
    return [
      new Date(`${year}-${month}-${day}T00:00:00${IST_OFFSET}`).toISOString(),
      new Date(`${year}-${month}-${day}T23:59:59.999${IST_OFFSET}`).toISOString(),
    ];
  }

  if (preset === 'weekly') {
    const weekAgo = new Date(istNow);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const wYear = weekAgo.getFullYear();
    const wMonth = String(weekAgo.getMonth() + 1).padStart(2, '0');
    const wDay = String(weekAgo.getDate()).padStart(2, '0');
    return [
      new Date(`${wYear}-${wMonth}-${wDay}T00:00:00${IST_OFFSET}`).toISOString(),
      new Date(`${year}-${month}-${day}T23:59:59.999${IST_OFFSET}`).toISOString(),
    ];
  }

  if (preset === 'monthly') {
    return [
      new Date(`${year}-${month}-01T00:00:00${IST_OFFSET}`).toISOString(),
      new Date(`${year}-${month}-${day}T23:59:59.999${IST_OFFSET}`).toISOString(),
    ];
  }

  throw new Error('Invalid report preset');
};

// =============================================
// TREND DATA ASSEMBLER (used by Dashboard)
// =============================================

/**
 * Fetches production, dispatch and expense trend data
 * for the last `days` days in a single parallel query round-trip.
 */
export const assembleTrendData = async (days = 7) => {
  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const endY  = istNow.getFullYear();
  const endM  = String(istNow.getMonth() + 1).padStart(2, '0');
  const endD  = String(istNow.getDate()).padStart(2, '0');

  const startDay = new Date(istNow);
  startDay.setDate(startDay.getDate() - (days - 1));
  const startY = startDay.getFullYear();
  const startM = String(startDay.getMonth() + 1).padStart(2, '0');
  const startD = String(startDay.getDate()).padStart(2, '0');

  const [startDate, endDate] = buildDateRange('custom', `${startY}-${startM}-${startD}`, `${endY}-${endM}-${endD}`);

  const [productionTrend, dispatchTrend, expenseTrend] = await Promise.all([
    pool.query(ReportModel.productionTrend, [startDate, endDate]),
    pool.query(ReportModel.dispatchTrend,   [startDate, endDate]),
    pool.query(ReportModel.expenseByDay,    [startDate, endDate, null]),
  ]);

  return {
    production: productionTrend.rows,
    dispatch:   dispatchTrend.rows,
    expenses:   expenseTrend.rows,
  };
};


// =============================================
// CORE REPORT ASSEMBLER
// =============================================

export const assembleReport = async (startDate, endDate, filters = {}) => {
  const {
    supplier_id = null,
    customer_id = null,
    raw_material_id = null,
    ready_material_id = null,
    category = null,
    shift = null,
    operator_name = null,
  } = filters;

  // Fire all independent queries in parallel
  const [
    rawMaterialInventory,
    readyMaterialInventory,
    productionByShift,
    productionByOperator,
    productionByMachine,
    inwardBySupplier,
    inwardSummary,
    dispatchByCustomer,
    dispatchByVehicle,
    dispatchSummary,
    expenseByCategory,
    expenseByDay,
    expenseTotals,
  ] = await Promise.all([
    pool.query(ReportModel.rawMaterialInventory,  [startDate, endDate, raw_material_id]),
    pool.query(ReportModel.readyMaterialInventory, [startDate, endDate, ready_material_id]),
    pool.query(ReportModel.productionByShift,     [startDate, endDate, shift, operator_name]),
    pool.query(ReportModel.productionByOperator,  [startDate, endDate, shift, operator_name]),
    pool.query(ReportModel.productionByMachine,   [startDate, endDate, shift]),
    pool.query(ReportModel.inwardBySupplier,      [startDate, endDate, supplier_id, raw_material_id]),
    pool.query(ReportModel.inwardSummary,         [startDate, endDate, supplier_id, raw_material_id]),
    pool.query(ReportModel.dispatchByCustomer,    [startDate, endDate, customer_id, ready_material_id]),
    pool.query(ReportModel.dispatchByVehicle,     [startDate, endDate, customer_id, ready_material_id]),
    pool.query(ReportModel.dispatchSummary,       [startDate, endDate, customer_id, ready_material_id]),
    pool.query(ReportModel.expenseByCategory,     [startDate, endDate, category]),
    pool.query(ReportModel.expenseByDay,          [startDate, endDate, category]),
    pool.query(ReportModel.expenseTotals,         [startDate, endDate, category]),
  ]);

  return {
    meta: {
      generated_at: new Date().toISOString(),
      start_date: startDate,
      end_date: endDate,
      filters,
    },
    inventory: {
      raw_materials: rawMaterialInventory.rows,
      ready_materials: readyMaterialInventory.rows,
    },
    production: {
      by_shift: productionByShift.rows,
      by_operator: productionByOperator.rows,
      by_machine: productionByMachine.rows,
    },
    vehicle_inward: {
      summary: inwardSummary.rows[0] || { total_vehicles: 0, total_weight_received: 0 },
      by_supplier: inwardBySupplier.rows,
    },
    dispatch: {
      summary: dispatchSummary.rows[0] || { total_dispatches: 0, total_dispatched: 0 },
      by_customer: dispatchByCustomer.rows,
      by_vehicle: dispatchByVehicle.rows,
    },
    expenses: {
      totals: expenseTotals.rows[0] || { total_entries: 0, total_amount: 0 },
      by_category: expenseByCategory.rows,
      by_day: expenseByDay.rows,
    },
  };
};

// =============================================
// EXCEL EXPORTER
// =============================================

export const generateExcel = async (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FactoryERP';
  workbook.created = new Date();

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    },
  };

  const addSheet = (name, columns, rows) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width || 20 }));
    sheet.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));
    rows.forEach(row => sheet.addRow(row));
    return sheet;
  };

  // --- RAW MATERIAL INVENTORY ---
  addSheet('Raw Material Inventory', [
    { header: 'Material', key: 'raw_material_name', width: 30 },
    { header: 'Opening Stock', key: 'opening_stock', width: 18 },
    { header: 'Received', key: 'received_in_period', width: 18 },
    { header: 'Used in Production', key: 'used_in_period', width: 22 },
    { header: 'Closing Stock', key: 'closing_stock', width: 18 },
  ], report.inventory.raw_materials);

  // --- READY MATERIAL INVENTORY ---
  addSheet('Ready Material Inventory', [
    { header: 'Material', key: 'ready_material_name', width: 30 },
    { header: 'Opening Stock', key: 'opening_stock', width: 18 },
    { header: 'Produced', key: 'produced_in_period', width: 18 },
    { header: 'Dispatched', key: 'dispatched_in_period', width: 18 },
    { header: 'Closing Stock', key: 'closing_stock', width: 18 },
  ], report.inventory.ready_materials);

  // --- PRODUCTION BY SHIFT ---
  addSheet('Production by Shift', [
    { header: 'Shift', key: 'shift', width: 15 },
    { header: 'Batches', key: 'batch_count', width: 12 },
    { header: 'Raw Material', key: 'raw_material_name', width: 25 },
    { header: 'Ready Material', key: 'ready_material_name', width: 25 },
    { header: 'Total Raw Used', key: 'total_raw_used', width: 18 },
    { header: 'Total Produced', key: 'total_produced', width: 18 },
  ], report.production.by_shift);

  // --- PRODUCTION BY OPERATOR ---
  addSheet('Production by Operator', [
    { header: 'Operator', key: 'operator_name', width: 25 },
    { header: 'Batches', key: 'batch_count', width: 12 },
    { header: 'Total Raw Used', key: 'total_raw_used', width: 18 },
    { header: 'Total Produced', key: 'total_produced', width: 18 },
  ], report.production.by_operator);

  // --- PRODUCTION BY MACHINE ---
  addSheet('Production by Machine', [
    { header: 'Machine', key: 'machine', width: 25 },
    { header: 'Batches', key: 'batch_count', width: 12 },
    { header: 'Total Raw Used', key: 'total_raw_used', width: 18 },
    { header: 'Total Produced', key: 'total_produced', width: 18 },
  ], report.production.by_machine);

  // --- VEHICLE INWARD BY SUPPLIER ---
  addSheet('Vehicle Inward by Supplier', [
    { header: 'Supplier', key: 'supplier_name', width: 30 },
    { header: 'Raw Material', key: 'raw_material_name', width: 25 },
    { header: 'Total Vehicles', key: 'total_vehicles', width: 16 },
    { header: 'Total Weight Received', key: 'total_weight_received', width: 22 },
  ], report.vehicle_inward.by_supplier);

  // --- DISPATCH BY CUSTOMER ---
  addSheet('Dispatch by Customer', [
    { header: 'Customer', key: 'customer_name', width: 30 },
    { header: 'Ready Material', key: 'ready_material_name', width: 25 },
    { header: 'Total Dispatches', key: 'total_dispatches', width: 18 },
    { header: 'Total Dispatched', key: 'total_dispatched', width: 18 },
  ], report.dispatch.by_customer);

  // --- DISPATCH BY VEHICLE ---
  addSheet('Dispatch by Vehicle', [
    { header: 'Vehicle Number', key: 'vehicle_number', width: 20 },
    { header: 'Total Dispatches', key: 'total_dispatches', width: 18 },
    { header: 'Total Dispatched', key: 'total_dispatched', width: 18 },
  ], report.dispatch.by_vehicle);

  // --- EXPENSES BY CATEGORY ---
  addSheet('Expenses by Category', [
    { header: 'Category', key: 'category', width: 28 },
    { header: 'Payment Type', key: 'payment_type', width: 16 },
    { header: 'Entries', key: 'total_entries', width: 12 },
    { header: 'Total Amount', key: 'total_amount', width: 18 },
  ], report.expenses.by_category);

  // --- EXPENSES BY DAY ---
  addSheet('Expenses by Day', [
    { header: 'Date', key: 'expense_day', width: 18 },
    { header: 'Entries', key: 'total_entries', width: 12 },
    { header: 'Total Amount', key: 'total_amount', width: 18 },
  ], report.expenses.by_day);

  return workbook;
};

// =============================================
// PDF EXPORTER
// =============================================

export const generatePDF = (report, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  const { meta, inventory, production, vehicle_inward, dispatch, expenses } = report;

  const title = (text) => {
    doc.moveDown(0.5)
       .fontSize(13).fillColor('#1E3A5F').font('Helvetica-Bold').text(text)
       .moveDown(0.3);
  };

  const sectionHeader = (...cols) => {
    doc.fontSize(9).fillColor('#555555').font('Helvetica-Bold');
    cols.forEach((col, i) => doc.text(col, { continued: i < cols.length - 1, width: 480 / cols.length, align: 'left' }));
    doc.moveDown(0.2);
  };

  const row = (...cols) => {
    doc.fontSize(9).fillColor('#000000').font('Helvetica');
    cols.forEach((col, i) => doc.text(String(col ?? '—'), { continued: i < cols.length - 1, width: 480 / cols.length, align: 'left' }));
    doc.moveDown(0.15);
  };

  // HEADER
  doc.fontSize(16).fillColor('#1E3A5F').font('Helvetica-Bold')
     .text('FactoryERP — Report', { align: 'center' });
  doc.fontSize(9).fillColor('#777').font('Helvetica')
     .text(`Period: ${meta.start_date.slice(0, 10)} to ${meta.end_date.slice(0, 10)}`, { align: 'center' })
     .text(`Generated: ${new Date(meta.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, { align: 'center' });
  doc.moveDown(1);

  // RAW MATERIAL INVENTORY
  title('Raw Material Inventory');
  sectionHeader('Material', 'Opening', 'Received', 'Used', 'Closing');
  inventory.raw_materials.forEach(r => row(r.raw_material_name, r.opening_stock, r.received_in_period, r.used_in_period, r.closing_stock));

  // READY MATERIAL INVENTORY
  title('Ready Material Inventory');
  sectionHeader('Material', 'Opening', 'Produced', 'Dispatched', 'Closing');
  inventory.ready_materials.forEach(r => row(r.ready_material_name, r.opening_stock, r.produced_in_period, r.dispatched_in_period, r.closing_stock));

  // PRODUCTION BY SHIFT
  title('Production by Shift');
  sectionHeader('Shift', 'Batches', 'Raw Used', 'Produced');
  production.by_shift.forEach(r => row(r.shift, r.batch_count, r.total_raw_used, r.total_produced));

  // PRODUCTION BY OPERATOR
  title('Production by Operator');
  sectionHeader('Operator', 'Batches', 'Raw Used', 'Produced');
  production.by_operator.forEach(r => row(r.operator_name, r.batch_count, r.total_raw_used, r.total_produced));

  // PRODUCTION BY MACHINE
  title('Production by Machine');
  sectionHeader('Machine', 'Batches', 'Raw Used', 'Produced');
  production.by_machine.forEach(r => row(r.machine, r.batch_count, r.total_raw_used, r.total_produced));

  // VEHICLE INWARD
  title(`Vehicle Inward Summary — ${vehicle_inward.summary.total_vehicles} Vehicles, ${vehicle_inward.summary.total_weight_received} Units Received`);
  sectionHeader('Supplier', 'Material', 'Vehicles', 'Weight Received');
  vehicle_inward.by_supplier.forEach(r => row(r.supplier_name, r.raw_material_name, r.total_vehicles, r.total_weight_received));

  // DISPATCH
  title(`Dispatch Summary — ${dispatch.summary.total_dispatches} Dispatches, ${dispatch.summary.total_dispatched} Units`);
  sectionHeader('Customer', 'Material', 'Dispatches', 'Total Dispatched');
  dispatch.by_customer.forEach(r => row(r.customer_name, r.ready_material_name, r.total_dispatches, r.total_dispatched));

  // EXPENSES
  title(`Expense Summary — Total: ₹${expenses.totals.total_amount}`);
  sectionHeader('Category', 'Payment', 'Entries', 'Total Amount');
  expenses.by_category.forEach(r => row(r.category, r.payment_type, r.total_entries, `₹${r.total_amount}`));

  doc.end();
};
