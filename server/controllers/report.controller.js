import { assembleReport, buildDateRange, generateExcel, generatePDF } from '../services/report.service.js';

// ─── Shared filter extractor ──────────────────────────────────────────────────
const extractFilters = (query) => ({
  supplier_id:      query.supplier_id      || null,
  customer_id:      query.customer_id      || null,
  raw_material_id:  query.raw_material_id  || null,
  ready_material_id: query.ready_material_id || null,
  category:         query.category         || null,
  shift:            query.shift            || null,
  operator_name:    query.operator_name    || null,
});

// ─── Shared response handler ──────────────────────────────────────────────────
const sendReport = async (req, res, startDate, endDate) => {
  const filters = extractFilters(req.query);
  const { format = 'json' } = req.query;

  const report = await assembleReport(startDate, endDate, filters);

  if (format === 'excel') {
    const workbook = await generateExcel(report);
    const filename = `report_${startDate.slice(0, 10)}_to_${endDate.slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  if (format === 'pdf') {
    const filename = `report_${startDate.slice(0, 10)}_to_${endDate.slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    generatePDF(report, res);
    return;
  }

  res.status(200).json({ success: true, data: report });
};

// ─── Controllers ─────────────────────────────────────────────────────────────
export const getDailyReport = async (req, res) => {
  try {
    const [startDate, endDate] = buildDateRange('daily');
    await sendReport(req, res, startDate, endDate);
  } catch (error) {
    console.error('Daily Report Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getWeeklyReport = async (req, res) => {
  try {
    const [startDate, endDate] = buildDateRange('weekly');
    await sendReport(req, res, startDate, endDate);
  } catch (error) {
    console.error('Weekly Report Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const [startDate, endDate] = buildDateRange('monthly');
    await sendReport(req, res, startDate, endDate);
  } catch (error) {
    console.error('Monthly Report Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getCustomReport = async (req, res) => {
  try {
    const [startDate, endDate] = buildDateRange('custom', req.query.startDate, req.query.endDate);
    await sendReport(req, res, startDate, endDate);
  } catch (error) {
    console.error('Custom Report Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Bad Request' });
  }
};
