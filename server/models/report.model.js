// =============================================
// REPORT MODEL – Pure SQL query strings
// All stocks computed from historical transactions
// Timezone: Asia/Kolkata
// =============================================

export const ReportModel = {

  // ------------------------------------------
  // RAW MATERIAL INVENTORY
  // Opening = all inward received BEFORE start_date - all production used BEFORE start_date
  // ------------------------------------------
  rawMaterialInventory: `
    WITH
      params AS (
        SELECT
          $1::timestamptz AS start_date,
          $2::timestamptz AS end_date
      ),
      raw_materials_list AS (
        SELECT r.id, r.name, r.reorder_level, u.name AS unit
        FROM raw_materials r
        LEFT JOIN units u ON r.unit_id = u.id
        WHERE ($3::uuid IS NULL OR r.id = $3::uuid)
      ),
      opening_inward AS (
        SELECT raw_material_id, COALESCE(SUM(quantity_received), 0) AS qty
        FROM vehicle_inwards, params
        WHERE entry_time AT TIME ZONE 'Asia/Kolkata' < start_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY raw_material_id
      ),
      opening_used AS (
        SELECT raw_material_id, COALESCE(SUM(quantity_used), 0) AS qty
        FROM production_batches, params
        WHERE start_time AT TIME ZONE 'Asia/Kolkata' < start_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY raw_material_id
      ),
      period_inward AS (
        SELECT raw_material_id, COALESCE(SUM(quantity_received), 0) AS qty
        FROM vehicle_inwards, params
        WHERE entry_time AT TIME ZONE 'Asia/Kolkata' >= start_date AT TIME ZONE 'Asia/Kolkata'
          AND entry_time AT TIME ZONE 'Asia/Kolkata' <= end_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY raw_material_id
      ),
      period_used AS (
        SELECT raw_material_id, COALESCE(SUM(quantity_used), 0) AS qty
        FROM production_batches, params
        WHERE start_time AT TIME ZONE 'Asia/Kolkata' >= start_date AT TIME ZONE 'Asia/Kolkata'
          AND start_time AT TIME ZONE 'Asia/Kolkata' <= end_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY raw_material_id
      )
    SELECT
      rm.id AS raw_material_id,
      rm.name AS raw_material_name,
      rm.unit,
      rm.reorder_level,
      COALESCE(oi.qty, 0) - COALESCE(ou.qty, 0)                         AS opening_stock,
      COALESCE(pi_d.qty, 0)                                              AS received_in_period,
      COALESCE(pu.qty, 0)                                                AS used_in_period,
      (COALESCE(oi.qty, 0) - COALESCE(ou.qty, 0))
        + COALESCE(pi_d.qty, 0) - COALESCE(pu.qty, 0)                   AS closing_stock
    FROM raw_materials_list rm
    LEFT JOIN opening_inward  oi   ON oi.raw_material_id = rm.id
    LEFT JOIN opening_used    ou   ON ou.raw_material_id = rm.id
    LEFT JOIN period_inward   pi_d ON pi_d.raw_material_id = rm.id
    LEFT JOIN period_used     pu   ON pu.raw_material_id = rm.id
    ORDER BY rm.name;
  `,

  // ------------------------------------------
  // READY MATERIAL INVENTORY
  // Opening = all production produced BEFORE start_date - all dispatched BEFORE start_date
  // ------------------------------------------
  readyMaterialInventory: `
    WITH
      params AS (
        SELECT
          $1::timestamptz AS start_date,
          $2::timestamptz AS end_date
      ),
      ready_materials_list AS (
        SELECT r.id, r.name, u.name AS unit
        FROM ready_materials r
        LEFT JOIN units u ON r.unit_id = u.id
        WHERE ($3::uuid IS NULL OR r.id = $3::uuid)
      ),
      opening_produced AS (
        SELECT ready_material_id, COALESCE(SUM(quantity_produced), 0) AS qty
        FROM production_batches, params
        WHERE end_time AT TIME ZONE 'Asia/Kolkata' < start_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY ready_material_id
      ),
      opening_dispatched AS (
        SELECT ready_material_id, COALESCE(SUM(quantity_dispatched), 0) AS qty
        FROM dispatches, params
        WHERE dispatch_date AT TIME ZONE 'Asia/Kolkata' < start_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY ready_material_id
      ),
      period_produced AS (
        SELECT ready_material_id, COALESCE(SUM(quantity_produced), 0) AS qty
        FROM production_batches, params
        WHERE end_time AT TIME ZONE 'Asia/Kolkata' >= start_date AT TIME ZONE 'Asia/Kolkata'
          AND end_time AT TIME ZONE 'Asia/Kolkata' <= end_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY ready_material_id
      ),
      period_dispatched AS (
        SELECT ready_material_id, COALESCE(SUM(quantity_dispatched), 0) AS qty
        FROM dispatches, params
        WHERE dispatch_date AT TIME ZONE 'Asia/Kolkata' >= start_date AT TIME ZONE 'Asia/Kolkata'
          AND dispatch_date AT TIME ZONE 'Asia/Kolkata' <= end_date AT TIME ZONE 'Asia/Kolkata'
        GROUP BY ready_material_id
      )
    SELECT
      rm.id AS ready_material_id,
      rm.name AS ready_material_name,
      rm.unit,
      COALESCE(op.qty, 0) - COALESCE(od.qty, 0)                         AS opening_stock,
      COALESCE(pp.qty, 0)                                                AS produced_in_period,
      COALESCE(pd_d.qty, 0)                                              AS dispatched_in_period,
      (COALESCE(op.qty, 0) - COALESCE(od.qty, 0))
        + COALESCE(pp.qty, 0) - COALESCE(pd_d.qty, 0)                   AS closing_stock
    FROM ready_materials_list rm
    LEFT JOIN opening_produced   op   ON op.ready_material_id = rm.id
    LEFT JOIN opening_dispatched od   ON od.ready_material_id = rm.id
    LEFT JOIN period_produced    pp   ON pp.ready_material_id = rm.id
    LEFT JOIN period_dispatched  pd_d ON pd_d.ready_material_id = rm.id
    ORDER BY rm.name;
  `,

  // ------------------------------------------
  // PRODUCTION SUMMARY
  // ------------------------------------------
  productionByShift: `
    SELECT
      pb.shift,
      COUNT(*)                            AS batch_count,
      COALESCE(SUM(pb.quantity_used), 0)      AS total_raw_used,
      COALESCE(SUM(pb.quantity_produced), 0)  AS total_produced,
      rm.name  AS raw_material_name,
      rdy.name AS ready_material_name
    FROM production_batches pb
    LEFT JOIN raw_materials   rm  ON pb.raw_material_id = rm.id
    LEFT JOIN ready_materials rdy ON pb.ready_material_id = rdy.id
    WHERE pb.start_time AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND pb.start_time AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::text IS NULL OR pb.shift = $3)
      AND ($4::text IS NULL OR pb.operator_name ILIKE '%' || $4 || '%')
    GROUP BY pb.shift, rm.name, rdy.name
    ORDER BY pb.shift;
  `,

  productionByOperator: `
    SELECT
      pb.operator_name,
      COUNT(*)                                AS batch_count,
      COALESCE(SUM(pb.quantity_used), 0)      AS total_raw_used,
      COALESCE(SUM(pb.quantity_produced), 0)  AS total_produced
    FROM production_batches pb
    WHERE pb.start_time AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND pb.start_time AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::text IS NULL OR pb.shift = $3)
      AND ($4::text IS NULL OR pb.operator_name ILIKE '%' || $4 || '%')
    GROUP BY pb.operator_name
    ORDER BY total_produced DESC;
  `,

  productionByMachine: `
    SELECT
      pb.machine,
      COUNT(*)                                AS batch_count,
      COALESCE(SUM(pb.quantity_used), 0)      AS total_raw_used,
      COALESCE(SUM(pb.quantity_produced), 0)  AS total_produced
    FROM production_batches pb
    WHERE pb.start_time AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND pb.start_time AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::text IS NULL OR pb.shift = $3)
    GROUP BY pb.machine
    ORDER BY total_produced DESC;
  `,

  // ------------------------------------------
  // VEHICLE INWARD SUMMARY
  // ------------------------------------------
  inwardBySupplier: `
    SELECT
      s.id AS supplier_id,
      s.name AS supplier_name,
      COUNT(vi.id)                              AS total_vehicles,
      COALESCE(SUM(vi.quantity_received), 0)    AS total_weight_received,
      rm.name                                   AS raw_material_name
    FROM vehicle_inwards vi
    LEFT JOIN suppliers s    ON vi.supplier_id = s.id
    LEFT JOIN raw_materials rm ON vi.raw_material_id = rm.id
    WHERE vi.entry_time AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND vi.entry_time AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::uuid IS NULL OR vi.supplier_id = $3::uuid)
      AND ($4::uuid IS NULL OR vi.raw_material_id = $4::uuid)
    GROUP BY s.id, s.name, rm.name
    ORDER BY total_weight_received DESC;
  `,

  inwardSummary: `
    SELECT
      COUNT(id)                               AS total_vehicles,
      COALESCE(SUM(quantity_received), 0)     AS total_weight_received
    FROM vehicle_inwards
    WHERE entry_time AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND entry_time AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::uuid IS NULL OR supplier_id = $3::uuid)
      AND ($4::uuid IS NULL OR raw_material_id = $4::uuid);
  `,

  // ------------------------------------------
  // DISPATCH SUMMARY
  // ------------------------------------------
  dispatchByCustomer: `
    SELECT
      c.id AS customer_id,
      c.name AS customer_name,
      COUNT(d.id)                                AS total_dispatches,
      COALESCE(SUM(d.quantity_dispatched), 0)    AS total_dispatched,
      rm.name                                    AS ready_material_name
    FROM dispatches d
    LEFT JOIN customers c       ON d.customer_id = c.id
    LEFT JOIN ready_materials rm ON d.ready_material_id = rm.id
    WHERE d.dispatch_date AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND d.dispatch_date AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::uuid IS NULL OR d.customer_id = $3::uuid)
      AND ($4::uuid IS NULL OR d.ready_material_id = $4::uuid)
    GROUP BY c.id, c.name, rm.name
    ORDER BY total_dispatched DESC;
  `,

  dispatchByVehicle: `
    SELECT
      d.vehicle_number,
      COUNT(d.id)                                AS total_dispatches,
      COALESCE(SUM(d.quantity_dispatched), 0)    AS total_dispatched
    FROM dispatches d
    WHERE d.dispatch_date AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND d.dispatch_date AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::uuid IS NULL OR d.customer_id = $3::uuid)
      AND ($4::uuid IS NULL OR d.ready_material_id = $4::uuid)
    GROUP BY d.vehicle_number
    ORDER BY total_dispatched DESC;
  `,

  dispatchSummary: `
    SELECT
      COUNT(id)                               AS total_dispatches,
      COALESCE(SUM(quantity_dispatched), 0)   AS total_dispatched
    FROM dispatches
    WHERE dispatch_date AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND dispatch_date AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::uuid IS NULL OR customer_id = $3::uuid)
      AND ($4::uuid IS NULL OR ready_material_id = $4::uuid);
  `,

  // ------------------------------------------
  // EXPENSE SUMMARY
  // ------------------------------------------
  expenseByCategory: `
    SELECT
      category,
      COUNT(id)                   AS total_entries,
      COALESCE(SUM(amount), 0)    AS total_amount,
      payment_type
    FROM expenses
    WHERE expense_date AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND expense_date AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::text IS NULL OR category = $3)
    GROUP BY category, payment_type
    ORDER BY total_amount DESC;
  `,

  expenseByDay: `
    SELECT
      DATE(expense_date AT TIME ZONE 'Asia/Kolkata') AS expense_day,
      COALESCE(SUM(amount), 0)                        AS total_amount,
      COUNT(id)                                       AS total_entries
    FROM expenses
    WHERE expense_date AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND expense_date AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::text IS NULL OR category = $3)
    GROUP BY expense_day
    ORDER BY expense_day;
  `,

  expenseTotals: `
    SELECT
      COUNT(id)                   AS total_entries,
      COALESCE(SUM(amount), 0)    AS total_amount
    FROM expenses
    WHERE expense_date AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND expense_date AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND ($3::text IS NULL OR category = $3);
  `,
  // ------------------------------------------
  // 7-DAY TREND QUERIES (used by Dashboard)
  // ------------------------------------------
  productionTrend: `
    SELECT
      DATE(pb.start_time AT TIME ZONE 'Asia/Kolkata')   AS day,
      COALESCE(SUM(pb.quantity_produced), 0)             AS total_produced,
      COALESCE(SUM(pb.quantity_used), 0)                 AS total_raw_used,
      COUNT(*)                                           AS batch_count
    FROM production_batches pb
    WHERE pb.start_time AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND pb.start_time AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
    GROUP BY day
    ORDER BY day;
  `,

  dispatchTrend: `
    SELECT
      DATE(d.dispatch_date AT TIME ZONE 'Asia/Kolkata')  AS day,
      COALESCE(SUM(d.quantity_dispatched), 0)            AS total_dispatched,
      COUNT(*)                                           AS dispatch_count
    FROM dispatches d
    WHERE d.dispatch_date AT TIME ZONE 'Asia/Kolkata' >= $1::timestamptz AT TIME ZONE 'Asia/Kolkata'
      AND d.dispatch_date AT TIME ZONE 'Asia/Kolkata' <= $2::timestamptz AT TIME ZONE 'Asia/Kolkata'
    GROUP BY day
    ORDER BY day;
  `,
};
