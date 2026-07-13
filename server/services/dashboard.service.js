// =============================================
// DASHBOARD SERVICE
// Projection layer ONLY — no SQL, no business logic.
// Imports exclusively from report.service.js
// =============================================

import {
  assembleReport,
  assembleTrendData,
  buildDateRange,
} from './report.service.js';

export const getDashboardData = async () => {
  // Build IST-aware date ranges
  const [todayStart, todayEnd]     = buildDateRange('daily');
  const [monthStart, monthEnd]     = buildDateRange('monthly');

  // Fire today's full report, this month's expense total,
  // and 7-day trends — all in parallel
  const [todayReport, monthReport, trends] = await Promise.all([
    assembleReport(todayStart, todayEnd, {}),
    assembleReport(monthStart, monthEnd, {}),
    assembleTrendData(7),
  ]);

  // ── KPI projections from today's report ─────────────────────────────────────

  // Current stock = closing stock computed from all historical transactions up to now
  const currentRawStock = todayReport.inventory.raw_materials.reduce(
    (sum, m) => sum + parseFloat(m.closing_stock || 0), 0
  );
  const currentReadyStock = todayReport.inventory.ready_materials.reduce(
    (sum, m) => sum + parseFloat(m.closing_stock || 0), 0
  );

  const todayProductionQty = todayReport.production.by_shift.reduce(
    (sum, s) => sum + parseFloat(s.total_produced || 0), 0
  );

  // Low stock alerts — raw materials where closing_stock <= reorder_level
  const lowStockAlerts = todayReport.inventory.raw_materials.filter(
    (m) => parseFloat(m.closing_stock) <= parseFloat(m.reorder_level || 0)
  ).map((m) => ({
    raw_material_id:   m.raw_material_id,
    raw_material_name: m.raw_material_name,
    closing_stock:     m.closing_stock,
    reorder_level:     m.reorder_level,
  }));

  return {
    generated_at: new Date().toISOString(),
    kpis: {
      current_raw_material_stock:   currentRawStock,
      current_ready_material_stock: currentReadyStock,
      today_vehicle_inward_count:   parseInt(todayReport.vehicle_inward.summary.total_vehicles   || 0),
      today_raw_material_received:  parseFloat(todayReport.vehicle_inward.summary.total_weight_received || 0),
      today_production_quantity:    todayProductionQty,
      today_dispatch_quantity:      parseFloat(todayReport.dispatch.summary.total_dispatched       || 0),
      today_total_expenses:         parseFloat(todayReport.expenses.totals.total_amount            || 0),
      current_month_total_expenses: parseFloat(monthReport.expenses.totals.total_amount           || 0),
      low_stock_alerts:             lowStockAlerts,
    },
    trends: {
      last_7_days_production: trends.production,
      last_7_days_dispatch:   trends.dispatch,
      last_7_days_expenses:   trends.expenses,
    },
  };
};
