export const VehicleInwardModel = {
  create: `
    INSERT INTO vehicle_inwards (
      vehicle_number, driver_name, supplier_id, raw_material_id, 
      quantity_received, entry_time, remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `,
  
  findById: `
    SELECT v.*, s.name as supplier_name, r.name as raw_material_name, u.name as raw_material_unit
    FROM vehicle_inwards v
    LEFT JOIN suppliers s ON v.supplier_id = s.id
    LEFT JOIN raw_materials r ON v.raw_material_id = r.id
    LEFT JOIN units u ON r.unit_id = u.id
    WHERE v.id = $1;
  `,

  update: `
    UPDATE vehicle_inwards
    SET vehicle_number = $1, driver_name = $2, supplier_id = $3, raw_material_id = $4,
        quantity_received = $5, entry_time = $6, remarks = $7,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *;
  `,

  delete: `
    DELETE FROM vehicle_inwards WHERE id = $1 RETURNING *;
  `,

  updateRawMaterialStock: `
    UPDATE raw_materials 
    SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2 
    RETURNING current_stock;
  `
};
