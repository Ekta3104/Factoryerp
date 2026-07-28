export const ProductionModel = {
  create: `
    INSERT INTO production_batches (
      batch_number, production_date, shift, operator_name, machine,
      raw_material_id, ready_material_id, quantity_used, quantity_produced, remarks, formula_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `,

  findById: `
    SELECT p.*, rm.name as raw_material_name, rdm.name as ready_material_name, pf.name as formula_name
    FROM production_batches p
    LEFT JOIN raw_materials rm ON p.raw_material_id = rm.id
    LEFT JOIN ready_materials rdm ON p.ready_material_id = rdm.id
    LEFT JOIN product_formulas pf ON p.formula_id = pf.id
    WHERE p.id = $1;
  `,

  update: `
    UPDATE production_batches
    SET production_date = $1, shift = $2, operator_name = $3, machine = $4,
        raw_material_id = $5, ready_material_id = $6, quantity_used = $7,
        quantity_produced = $8, remarks = $9, updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *;
  `,

  delete: `
    DELETE FROM production_batches WHERE id = $1 RETURNING *;
  `,

  updateRawMaterialStock: `
    UPDATE raw_materials
    SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING current_stock;
  `,

  updateReadyMaterialStock: `
    UPDATE ready_materials
    SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING current_stock;
  `,

  checkRawMaterialStock: `
    SELECT current_stock, name FROM raw_materials WHERE id = $1;
  `,

  findFormulaWithIngredients: `
    SELECT pf.id, pf.name, pf.ready_material_id, pf.output_quantity,
      rdm.pack_size_kg, rdm.name as ready_material_name,
      COALESCE(
        json_agg(
          json_build_object('raw_material_id', fi.raw_material_id, 'quantity', fi.quantity, 'raw_material_name', rm.name)
        ) FILTER (WHERE fi.id IS NOT NULL),
        '[]'
      ) as ingredients
    FROM product_formulas pf
    JOIN ready_materials rdm ON pf.ready_material_id = rdm.id
    LEFT JOIN formula_ingredients fi ON fi.formula_id = pf.id
    LEFT JOIN raw_materials rm ON fi.raw_material_id = rm.id
    WHERE pf.id = $1 AND pf.is_active = true
    GROUP BY pf.id, rdm.pack_size_kg, rdm.name;
  `,

  insertBatchMaterial: `
    INSERT INTO production_batch_materials (production_batch_id, raw_material_id, quantity_used)
    VALUES ($1, $2, $3)
    RETURNING *;
  `,

  findBatchMaterialsByBatchId: `
    SELECT pbm.*, rm.name as raw_material_name
    FROM production_batch_materials pbm
    LEFT JOIN raw_materials rm ON pbm.raw_material_id = rm.id
    WHERE pbm.production_batch_id = $1;
  `,

  deleteBatchMaterialsByBatchId: `
    DELETE FROM production_batch_materials WHERE production_batch_id = $1 RETURNING *;
  `
};
