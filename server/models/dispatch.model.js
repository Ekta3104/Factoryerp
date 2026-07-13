export const DispatchModel = {
  create: `
    INSERT INTO dispatches (
      customer_id, ready_material_id, vehicle_number, driver_name,
      quantity_dispatched, dispatch_date, destination, remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `,
  
  findById: `
    SELECT d.*, c.name as customer_name, rm.name as ready_material_name
    FROM dispatches d
    LEFT JOIN customers c ON d.customer_id = c.id
    LEFT JOIN ready_materials rm ON d.ready_material_id = rm.id
    WHERE d.id = $1;
  `,

  update: `
    UPDATE dispatches
    SET customer_id = $1, ready_material_id = $2, vehicle_number = $3, driver_name = $4,
        quantity_dispatched = $5, dispatch_date = $6, destination = $7, remarks = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING *;
  `,

  delete: `
    DELETE FROM dispatches WHERE id = $1 RETURNING *;
  `,

  updateReadyMaterialStock: `
    UPDATE ready_materials 
    SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2 
    RETURNING current_stock;
  `,

  checkReadyMaterialStock: `
    SELECT current_stock, name FROM ready_materials WHERE id = $1;
  `
};
